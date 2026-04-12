"""
Интеграция с Авито Messenger API.
Получение токена, списка чатов, сообщений и отправка ответов.
"""
import json
import os
import urllib.request
import urllib.parse
import urllib.error


AVITO_AUTH_URL = "https://api.avito.ru/token"
AVITO_API_BASE = "https://api.avito.ru"


def get_access_token() -> str:
    client_id = os.environ["AVITO_CLIENT_ID"]
    client_secret = os.environ["AVITO_CLIENT_SECRET"]

    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }).encode()

    req = urllib.request.Request(
        AVITO_AUTH_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())
    return result["access_token"]


def avito_get(path: str, token: str) -> dict:
    req = urllib.request.Request(
        f"{AVITO_API_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def avito_post(path: str, token: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{AVITO_API_BASE}{path}",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "chats")

    token = get_access_token()

    # Получить user_id аккаунта
    me = avito_get("/core/v1/accounts/self", token)
    user_id = me["id"]

    if action == "chats":
        # Список чатов — v2 официальный эндпоинт
        unread_only = params.get("unread_only", "false") == "true"
        url = f"/messenger/v2/accounts/{user_id}/chats?unread_only={'true' if unread_only else 'false'}&limit=50"
        data = avito_get(url, token)
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "chats": data.get("chats", []), "user_id": user_id})
        }

    elif action == "messages":
        chat_id = params.get("chat_id")
        if not chat_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "chat_id required"})}
        data = avito_get(f"/messenger/v2/accounts/{user_id}/chats/{chat_id}/messages/?limit=50", token)
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "messages": data.get("messages", []), "user_id": user_id})
        }

    elif action == "send" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        message = body.get("message", "")
        if not chat_id or not message:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "chat_id and message required"})}
        result = avito_post(
            f"/messenger/v2/accounts/{user_id}/chats/{chat_id}/messages",
            token,
            {"message": {"text": message}, "type": "text"}
        )
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "result": result})
        }

    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "unknown action"})}