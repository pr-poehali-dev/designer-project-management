import json
import os
import hmac
import hashlib
import base64
import time
import psycopg2
import psycopg2.extras


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    salt = os.environ.get("DESIGNER_SALT", "ds_salt_2024")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def make_token(designer_id: int) -> str:
    secret = os.environ.get("DESIGNER_JWT_SECRET", "designer_secret_2024")
    payload = f"{designer_id}:{int(time.time())}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


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


def json_resp(data, status=200):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(data, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    """Авторизация дизайнеров: регистрация, вход, проверка сессии."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Designer-Token",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    action = event.get("queryStringParameters", {}).get("action", "")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # Регистрация
    if action == "register" and method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()

        if not email or not password:
            return json_resp({"ok": False, "error": "email и password обязательны"}, 400)
        if len(password) < 6:
            return json_resp({"ok": False, "error": "Пароль минимум 6 символов"}, 400)
        if not name:
            return json_resp({"ok": False, "error": "Имя обязательно"}, 400)

        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("SELECT id FROM designers WHERE email = %s", (email,))
        if cur.fetchone():
            return json_resp({"ok": False, "error": "Этот email уже зарегистрирован"}, 409)

        pwd_hash = hash_password(password)
        cur.execute(
            "INSERT INTO designers (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
            (email, pwd_hash, name)
        )
        designer_id = cur.fetchone()["id"]

        # Создаём пустые профиль и данные компании для нового дизайнера
        cur.execute(
            "INSERT INTO user_profile (email, full_name, designer_id) VALUES (%s, %s, %s)",
            (email, name, designer_id)
        )
        cur.execute(
            "INSERT INTO company_info (contact_email, designer_id) VALUES (%s, %s)",
            (email, designer_id)
        )
        conn.commit()
        conn.close()

        token = make_token(designer_id)
        return json_resp({"ok": True, "token": token, "name": name, "designer_id": designer_id})

    # Вход
    if action == "login" and method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return json_resp({"ok": False, "error": "email и password обязательны"}, 400)

        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM designers WHERE email = %s", (email,))
        designer = cur.fetchone()

        if not designer or designer["password_hash"] != hash_password(password):
            conn.close()
            return json_resp({"ok": False, "error": "Неверный email или пароль"}, 401)

        if not designer["is_active"]:
            conn.close()
            return json_resp({"ok": False, "error": "Аккаунт заблокирован"}, 403)

        cur.execute("UPDATE designers SET last_login_at = NOW() WHERE id = %s", (designer["id"],))
        conn.commit()
        conn.close()

        token = make_token(designer["id"])
        return json_resp({
            "ok": True,
            "token": token,
            "name": designer["name"],
            "designer_id": designer["id"],
            "plan": designer["plan"],
        })

    # Проверка сессии
    if action == "me":
        token = event.get("headers", {}).get("X-Designer-Token", "")
        if not token:
            return json_resp({"ok": False, "error": "Unauthorized"}, 401)

        designer_id = verify_token(token)
        if not designer_id:
            return json_resp({"ok": False, "error": "Invalid token"}, 401)

        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, name, email, plan FROM designers WHERE id = %s AND is_active = TRUE",
            (designer_id,)
        )
        designer = cur.fetchone()
        conn.close()

        if not designer:
            return json_resp({"ok": False, "error": "User not found"}, 404)

        return json_resp({"ok": True, "designer": dict(designer)})

    return json_resp({"ok": False, "error": "Unknown action"}, 400)
