"""
Авито Messenger API v3 + автоответ через ChatGPT (Polza.ai).
Получение токена, списка чатов, сообщений, отправка ответов, автопилот и настройки промпта.
"""
import json
import os
import urllib.request
import urllib.parse
import urllib.error
import psycopg2


AVITO_AUTH_URL = "https://api.avito.ru/token"
AVITO_API_BASE = "https://api.avito.ru"
POLZA_API_URL  = "https://api.polza.ai/v1/chat/completions"

DEFAULT_PROMPT = """Ты — вежливый менеджер. Отвечай дружелюбно и коротко (2-4 предложения).
В конце каждого ответа мягко проси номер телефона клиента.
Пиши только на русском языке. Никогда не представляйся как ИИ или бот."""


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_saved_prompt() -> str:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT prompt FROM autopilot_settings ORDER BY id LIMIT 1")
        row = cur.fetchone()
        return row[0] if row and row[0] else ""
    finally:
        conn.close()


def save_prompt(prompt: str):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE autopilot_settings SET prompt = %s, updated_at = NOW() WHERE id = 1", (prompt,))
        if cur.rowcount == 0:
            cur.execute("INSERT INTO autopilot_settings (prompt) VALUES (%s)", (prompt,))
        conn.commit()
    finally:
        conn.close()


def get_avito_token() -> str:
    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": os.environ["AVITO_CLIENT_ID"],
        "client_secret": os.environ["AVITO_CLIENT_SECRET"],
    }).encode()
    req = urllib.request.Request(
        AVITO_AUTH_URL, data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())["access_token"]


def avito_get(path: str, token: str) -> dict:
    url = f"{AVITO_API_BASE}{path}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def avito_post(path: str, token: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{AVITO_API_BASE}{path}", data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def send_avito_message(user_id: int, chat_id: str, text: str, token: str) -> dict:
    return avito_post(
        f"/messenger/v1/accounts/{user_id}/chats/{chat_id}/messages",
        token,
        {"message": {"text": text}, "type": "text"}
    )


def chatgpt_reply(history: list[dict], system_prompt: str) -> str:
    """Отправляет историю в ChatGPT с пользовательским промптом."""
    messages = [{"role": "system", "content": system_prompt}] + history

    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.7,
    }).encode()

    req = urllib.request.Request(
        POLZA_API_URL, data=payload,
        headers={
            "Authorization": f"Bearer {os.environ['POLZA_AI_API_KEY']}",
            "Content-Type": "application/json",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        result = json.loads(resp.read())

    return result["choices"][0]["message"]["content"].strip()


def handler(event: dict, context) -> dict:
    """Авито чаты + автопилот с настраиваемым промптом."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "chats")

    # ── GET/POST prompt — не требует Авито токена ─────────────────────────────
    if action == "prompt" and method == "GET":
        prompt = get_saved_prompt()
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "prompt": prompt})
        }

    if action == "prompt" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        prompt = body.get("prompt", "")
        save_prompt(prompt)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    avito_token = get_avito_token()
    me = avito_get("/core/v1/accounts/self", avito_token)
    user_id = me["id"]

    if action == "chats":
        unread_only = params.get("unread_only", "false") == "true"
        url = f"/messenger/v2/accounts/{user_id}/chats?unread_only={'true' if unread_only else 'false'}&limit=50"
        data = avito_get(url, avito_token)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "chats": data.get("chats", []), "user_id": user_id})
        }

    elif action == "messages":
        chat_id = params.get("chat_id")
        if not chat_id:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"ok": False, "error": "chat_id required"})}
        try:
            data = avito_get(f"/messenger/v3/accounts/{user_id}/chats/{chat_id}/messages?limit=50", avito_token)
        except Exception as e:
            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"ok": False, "error": f"Avito API error: {str(e)}"})}
        msgs = data.get("messages", [])
        msgs.reverse()
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "messages": msgs, "user_id": user_id})
        }

    elif action == "send" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        message = body.get("message", "")
        if not chat_id or not message:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"ok": False, "error": "chat_id and message required"})}
        result = send_avito_message(user_id, chat_id, message, avito_token)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "result": result})
        }

    elif action == "autopilot" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        target_chat_id = body.get("chat_id")

        saved_prompt = get_saved_prompt()
        system_prompt = saved_prompt if saved_prompt.strip() else DEFAULT_PROMPT

        chats_data = avito_get(
            f"/messenger/v2/accounts/{user_id}/chats?unread_only=true&limit=20",
            avito_token
        )
        chats = chats_data.get("chats", [])

        if target_chat_id:
            chats = [c for c in chats if c["id"] == target_chat_id]

        processed = []
        errors = []

        import time as _time

        for chat in chats:
            chat_id = chat["id"]
            try:
                _time.sleep(0.5)
                msgs_data = avito_get(
                    f"/messenger/v3/accounts/{user_id}/chats/{chat_id}/messages?limit=10",
                    avito_token
                )
                msgs = msgs_data.get("messages", [])

                if not msgs:
                    continue

                msgs.reverse()

                last_msg = msgs[-1]
                if last_msg.get("author_id") == user_id:
                    continue

                history = []
                for m in msgs:
                    raw = m.get("content", {}).get("text", "")
                    text = raw if isinstance(raw, str) else (raw.get("text", "") if isinstance(raw, dict) else "")
                    if not text:
                        continue
                    role = "assistant" if m.get("author_id") == user_id else "user"
                    history.append({"role": role, "content": text})

                if not history:
                    continue

                reply_text = chatgpt_reply(history, system_prompt)
                send_avito_message(user_id, chat_id, reply_text, avito_token)

                processed.append({
                    "chat_id": chat_id,
                    "reply": reply_text,
                    "client": chat.get("users", [{}])[0].get("name", ""),
                })

            except Exception as e:
                errors.append({"chat_id": chat_id, "error": str(e)})

        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({
                "ok": True,
                "processed": len(processed),
                "replies": processed,
                "errors": errors,
            })
        }

    return {
        "statusCode": 400, "headers": CORS_HEADERS,
        "body": json.dumps({"ok": False, "error": f"Unknown action: {action}"})
    }
