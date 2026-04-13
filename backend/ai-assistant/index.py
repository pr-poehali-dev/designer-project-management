"""AI-ассистент: транскрипция голоса (Whisper), ответы (GPT-4o), контекст приложения."""
import json
import os
import base64
import tempfile
import requests
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

POLZA_BASE = "https://api.polza.ai/api/v1"


def json_resp(data, status=200):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(data, ensure_ascii=False)}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_assistant_name() -> str:
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT assistant_name, full_name FROM user_profile ORDER BY id LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            return (row["assistant_name"] or "Давинчи"), (row["full_name"] or "пользователь")
    except Exception:
        pass
    return "Давинчи", "пользователь"


def transcribe_audio(audio_b64: str, mime: str = "audio/webm") -> str:
    """Транскрибирует аудио через Whisper (Polza.ai)."""
    api_key = os.environ.get("POLZA_AI_API_KEY", "")
    audio_bytes = base64.b64decode(audio_b64)

    ext = "webm"
    if "ogg" in mime:
        ext = "ogg"
    elif "mp4" in mime or "m4a" in mime:
        ext = "mp4"
    elif "wav" in mime:
        ext = "wav"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    with open(tmp_path, "rb") as f:
        resp = requests.post(
            f"{POLZA_BASE}/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (f"audio.{ext}", f, mime)},
            data={"model": "openai/whisper-1", "language": "ru"},
            timeout=30,
        )

    os.unlink(tmp_path)
    data = resp.json()
    return data.get("text", "")


def chat_with_gpt(messages: list, assistant_name: str, user_name: str, context: dict) -> str:
    """Отправляет сообщения в GPT-4o и возвращает ответ."""
    api_key = os.environ.get("POLZA_AI_API_KEY", "")

    context_text = ""
    if context.get("page"):
        context_text += f"Пользователь сейчас находится на странице: {context['page']}. "
    if context.get("project_name"):
        context_text += f"Открытый проект: {context['project_name']}. "
    if context.get("client_name"):
        context_text += f"Клиент: {context['client_name']}. "

    system_prompt = f"""Ты — {assistant_name}, умный голосовой помощник дизайн-студии.
Ты встроен в CRM-систему для дизайнеров интерьера.
Обращайся к пользователю по имени: {user_name}.
{context_text}

Ты умеешь:
- Отвечать на вопросы о проектах, клиентах, задачах
- Помогать составлять тексты (письма клиентам, описания проектов, сметы)
- Давать советы по дизайну и работе со студией
- Выполнять команды навигации — отвечай JSON: {{"action": "navigate", "page": "clients"|"projects"|"tasks"|"profile"|"guild"}}
- Создавать задачи — отвечай JSON: {{"action": "create_task", "title": "...", "description": "..."}}
- Открывать проект — отвечай JSON: {{"action": "open_project", "project_id": <id>}}

Если выполняешь команду — отвечай ТОЛЬКО JSON без лишнего текста.
Если отвечаешь текстом — пиши кратко, по-русски, дружелюбно. Не более 3-4 предложений."""

    payload = {
        "model": "openai/gpt-4o",
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "max_tokens": 500,
        "temperature": 0.7,
    }

    resp = requests.post(
        f"{POLZA_BASE}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def handler(event: dict, context) -> dict:
    """AI-ассистент: /transcribe — голос в текст, /chat — текстовый диалог."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    assistant_name, user_name = get_assistant_name()

    if action == "info" and method == "GET":
        return json_resp({"ok": True, "assistant_name": assistant_name, "user_name": user_name})

    if action == "transcribe" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        audio_b64 = body.get("audio")
        mime = body.get("mime", "audio/webm")
        if not audio_b64:
            return json_resp({"ok": False, "error": "audio required"}, 400)
        text = transcribe_audio(audio_b64, mime)
        return json_resp({"ok": True, "text": text})

    if action == "chat" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        messages = body.get("messages", [])
        app_context = body.get("context", {})
        if not messages:
            return json_resp({"ok": False, "error": "messages required"}, 400)
        reply = chat_with_gpt(messages, assistant_name, user_name, app_context)

        # Попытка распарсить как команду
        parsed_action = None
        try:
            parsed = json.loads(reply)
            if isinstance(parsed, dict) and "action" in parsed:
                parsed_action = parsed
        except Exception:
            pass

        return json_resp({"ok": True, "reply": reply, "action": parsed_action, "assistant_name": assistant_name})

    return json_resp({"ok": False, "error": f"Unknown action: {action}"}, 400)
