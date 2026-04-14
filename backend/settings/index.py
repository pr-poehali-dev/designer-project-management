"""Профиль пользователя и данные компании — чтение и сохранение."""
import json
import os
import base64
import uuid
import hmac
import hashlib
import psycopg2
import psycopg2.extras
import boto3


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Designer-Token",
}

PROFILE_FIELDS = ["full_name", "phone", "email", "position", "avatar_url", "assistant_name", "theme", "assistant_gender"]
COMPANY_FIELDS = [
    "legal_form", "company_name", "inn", "ogrn", "kpp",
    "legal_address", "actual_address",
    "bank_name", "bik", "checking_account", "corr_account",
    "director_name", "contact_phone", "contact_email",
]

GUILD_FIELDS = ["specializations", "guild_description", "guild_price_info", "taking_orders"]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def verify_token(token: str):
    """Возвращает designer_id или None."""
    try:
        secret = os.environ.get("DESIGNER_JWT_SECRET", "designer_secret_2024")
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        p_parts = payload.split(":")
        if len(p_parts) != 2:
            return None
        return int(p_parts[0])
    except Exception:
        return None


def get_designer_id(event: dict):
    """Извлекает и верифицирует designer_id из заголовка X-Designer-Token."""
    token = event.get("headers", {}).get("X-Designer-Token", "")
    if not token:
        return None
    return verify_token(token)


def get_profile(designer_id: int) -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM user_profile WHERE designer_id = %s LIMIT 1", (designer_id,))
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def save_profile(data: dict, designer_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets, vals = [], []
        for f in PROFILE_FIELDS:
            if f in data:
                sets.append(f"{f} = %s")
                vals.append(data[f])
        if not sets:
            return
        sets.append("updated_at = NOW()")
        vals.append(designer_id)
        cur.execute(f"UPDATE user_profile SET {', '.join(sets)} WHERE designer_id = %s", vals)
        conn.commit()
    finally:
        conn.close()


def get_company(designer_id: int) -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM company_info WHERE designer_id = %s LIMIT 1", (designer_id,))
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def save_company(data: dict, designer_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets, vals = [], []
        for f in COMPANY_FIELDS + ["logo_url"]:
            if f in data:
                sets.append(f"{f} = %s")
                vals.append(data[f])
        if not sets:
            return
        sets.append("updated_at = NOW()")
        vals.append(designer_id)
        cur.execute(f"UPDATE company_info SET {', '.join(sets)} WHERE designer_id = %s", vals)
        conn.commit()
    finally:
        conn.close()


def get_guild_profile(designer_id: int) -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM user_profile WHERE designer_id = %s LIMIT 1", (designer_id,))
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def save_guild_profile(data: dict, designer_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets, vals = [], []
        for f in GUILD_FIELDS:
            if f in data:
                sets.append(f"{f} = %s")
                vals.append(data[f])
        if not sets:
            return
        sets.append("updated_at = NOW()")
        vals.append(designer_id)
        cur.execute(f"UPDATE user_profile SET {', '.join(sets)} WHERE designer_id = %s", vals)
        conn.commit()
    finally:
        conn.close()


def upload_guild_photo(body: dict) -> str:
    file_data = body.get("file")
    mime = body.get("mime", "image/jpeg")
    if not file_data:
        return ""
    raw = base64.b64decode(file_data)
    ext = mime.split("/")[-1].replace("jpeg", "jpg")
    key = f"guild/{uuid.uuid4()}.{ext}"
    s3 = get_s3()
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime, ACL="public-read")
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"


def get_guild_members(specialization: str = None) -> list:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if specialization:
            cur.execute("""
                SELECT id, full_name, position, avatar_url,
                       specializations, guild_description, guild_price_info, guild_photos, taking_orders
                FROM user_profile
                WHERE taking_orders = TRUE AND %s = ANY(specializations)
                ORDER BY full_name
            """, (specialization,))
        else:
            cur.execute("""
                SELECT id, full_name, position, avatar_url,
                       specializations, guild_description, guild_price_info, guild_photos, taking_orders
                FROM user_profile
                WHERE taking_orders = TRUE
                ORDER BY full_name
            """)
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def upload_logo(body: dict) -> str:
    if body.get("remove"):
        return ""
    file_data = body.get("file")
    mime = body.get("mime", "image/png")
    if not file_data:
        return ""

    raw = base64.b64decode(file_data)
    ext = mime.split("/")[-1].replace("jpeg", "jpg")
    key = f"logos/{uuid.uuid4()}.{ext}"

    s3 = get_s3()
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=raw,
        ContentType=mime,
        ACL="public-read",
    )

    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Чтение и сохранение профиля, данных компании и загрузка логотипа."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "profile")

    # Публичные действия — без токена
    if action == "guild" and method == "GET":
        spec = params.get("specialization", "")
        members = get_guild_members(spec if spec else None)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "members": members}, default=str)
        }

    # Все остальные действия требуют токен
    designer_id = get_designer_id(event)
    if not designer_id:
        return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "Unauthorized"})}

    if action == "profile" and method == "GET":
        data = get_profile(designer_id)
        data.pop("id", None)
        data.pop("updated_at", None)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "profile": data}, default=str)
        }

    if action == "profile" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        save_profile(body, designer_id)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    if action == "company" and method == "GET":
        data = get_company(designer_id)
        data.pop("id", None)
        data.pop("updated_at", None)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "company": data}, default=str)
        }

    if action == "company" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        save_company(body, designer_id)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    if action == "upload_logo" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        url = upload_logo(body)
        save_company({"logo_url": url}, designer_id)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "url": url})
        }

    if action == "guild_profile" and method == "GET":
        data = get_guild_profile(designer_id)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "guild": {
                "specializations": data.get("specializations") or [],
                "guild_description": data.get("guild_description") or "",
                "guild_price_info": data.get("guild_price_info") or "",
                "guild_photos": data.get("guild_photos") or [],
                "taking_orders": data.get("taking_orders") or False,
            }}, default=str)
        }

    if action == "guild_profile" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        save_guild_profile(body, designer_id)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    if action == "upload_guild_photo" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        url = upload_guild_photo(body)
        if url:
            conn = get_db()
            try:
                cur = conn.cursor()
                cur.execute(
                    "UPDATE user_profile SET guild_photos = array_append(COALESCE(guild_photos, '{}'), %s) WHERE designer_id = %s",
                    (url, designer_id)
                )
                conn.commit()
            finally:
                conn.close()
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "url": url})
        }

    if action == "delete_guild_photo" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        url_to_remove = body.get("url", "")
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE user_profile SET guild_photos = array_remove(COALESCE(guild_photos, '{}'), %s) WHERE designer_id = %s",
                (url_to_remove, designer_id)
            )
            conn.commit()
        finally:
            conn.close()
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    if action == "brief_template" and method == "GET":
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT * FROM brief_template WHERE designer_id = %s ORDER BY id LIMIT 1", (designer_id,))
            row = cur.fetchone()
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True, "template": dict(row) if row else None}, default=str)
            }
        finally:
            conn.close()

    if action == "brief_template" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        fields = body.get("fields", [])
        intro = body.get("intro", "")
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id FROM brief_template WHERE designer_id = %s LIMIT 1", (designer_id,))
            if cur.fetchone():
                cur.execute(
                    "UPDATE brief_template SET fields = %s, intro = %s, updated_at = NOW() WHERE designer_id = %s",
                    (json.dumps(fields, ensure_ascii=False), intro, designer_id)
                )
            else:
                cur.execute(
                    "INSERT INTO brief_template (fields, intro, designer_id) VALUES (%s, %s, %s)",
                    (json.dumps(fields, ensure_ascii=False), intro, designer_id)
                )
            conn.commit()
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True})
            }
        finally:
            conn.close()

    if action == "internal_chats" and method == "GET":
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT * FROM internal_chats WHERE designer_id = %s ORDER BY updated_at DESC", (designer_id,))
            chats = [dict(r) for r in cur.fetchall()]
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True, "chats": chats}, default=str)
            }
        finally:
            conn.close()

    if action == "internal_chat_get_or_create" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = body.get("participant_name", "")
        initials = body.get("participant_initials", "")
        avatar = body.get("participant_avatar", "")
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT * FROM internal_chats WHERE participant_name = %s AND designer_id = %s LIMIT 1", (name, designer_id))
            row = cur.fetchone()
            if row:
                chat = dict(row)
            else:
                cur.execute(
                    "INSERT INTO internal_chats (participant_name, participant_initials, participant_avatar, designer_id) VALUES (%s, %s, %s, %s) RETURNING *",
                    (name, initials, avatar, designer_id)
                )
                chat = dict(cur.fetchone())
                conn.commit()
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True, "chat": chat}, default=str)
            }
        finally:
            conn.close()

    if action == "internal_messages" and method == "GET":
        chat_id = params.get("chat_id")
        if not chat_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "chat_id required"})}
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT * FROM internal_messages WHERE chat_id = %s ORDER BY created_at ASC", (chat_id,))
            messages = [dict(r) for r in cur.fetchall()]
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True, "messages": messages}, default=str)
            }
        finally:
            conn.close()

    if action == "internal_message_send" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        text = body.get("text", "").strip()
        from_me = body.get("from_me", True)
        if not chat_id or not text:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"ok": False, "error": "chat_id and text required"})}
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                "INSERT INTO internal_messages (chat_id, from_me, text) VALUES (%s, %s, %s) RETURNING *",
                (chat_id, from_me, text)
            )
            msg = dict(cur.fetchone())
            cur.execute("UPDATE internal_chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
            conn.commit()
            return {
                "statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True, "message": msg}, default=str)
            }
        finally:
            conn.close()

    return {
        "statusCode": 400, "headers": CORS_HEADERS,
        "body": json.dumps({"ok": False, "error": f"Unknown action: {action}"})
    }
