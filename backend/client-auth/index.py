"""Авторизация клиентов: регистрация по токену проекта, вход, проверка сессии."""
import json
import os
import hashlib
import hmac
import time
import base64
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Client-Token",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_resp(data, status=200):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(data, default=str)}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token(client_user_id: int, client_id: int) -> str:
    secret = os.environ.get("CLIENT_JWT_SECRET", "changeme")
    payload = f"{client_user_id}:{client_id}:{int(time.time())}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def verify_token(token: str):
    """Возвращает (client_user_id, client_id) или None."""
    try:
        secret = os.environ.get("CLIENT_JWT_SECRET", "changeme")
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.rsplit(":", 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        p_parts = payload.split(":")
        if len(p_parts) != 3:
            return None
        return int(p_parts[0]), int(p_parts[1])
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Авторизация клиентов личного кабинета."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if method == "POST":
        body = json.loads(event.get("body") or "{}")

    # ── Проверка — можно ли использовать email как дизайнер ──────────
    if action == "check_email":
        email = body.get("email", "").strip().lower()
        if not email:
            return json_resp({"ok": False, "error": "email required"}, 400)
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id FROM client_users WHERE LOWER(email) = %s", (email,))
            if cur.fetchone():
                return json_resp({"ok": False, "is_client": True,
                    "error": "Этот email зарегистрирован как клиент. Войдите через ссылку от дизайнера или используйте другой email."})
            return json_resp({"ok": True, "is_client": False})
        finally:
            conn.close()

    # ── Регистрация клиента по токену проекта ────────────────────────
    if action == "register" and method == "POST":
        project_token = body.get("project_token", "")
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()

        if not project_token or not email or not password:
            return json_resp({"ok": False, "error": "project_token, email и password обязательны"}, 400)
        if len(password) < 6:
            return json_resp({"ok": False, "error": "Пароль минимум 6 символов"}, 400)

        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Найти проект по токену
            cur.execute("SELECT id, client_id FROM projects WHERE client_token = %s", (project_token,))
            project = cur.fetchone()
            if not project:
                return json_resp({"ok": False, "error": "Недействительная ссылка"}, 404)

            client_id = project["client_id"]

            # Проверить — email уже занят?
            cur.execute("SELECT id, client_id FROM client_users WHERE LOWER(email) = %s", (email,))
            existing = cur.fetchone()
            if existing:
                if existing["client_id"] == client_id:
                    return json_resp({"ok": False, "error": "Вы уже зарегистрированы. Войдите с вашим паролем."})
                return json_resp({"ok": False, "error": "Email уже используется"})

            # Получить имя клиента если не передано
            if not name:
                cur.execute("SELECT contact_person, name FROM clients WHERE id = %s", (client_id,))
                cl = cur.fetchone()
                name = cl["contact_person"] or cl["name"] if cl else "Клиент"

            pwd_hash = hash_password(password)
            cur.execute(
                "INSERT INTO client_users (client_id, email, password_hash, name) VALUES (%s, %s, %s, %s) RETURNING id",
                (client_id, email, pwd_hash, name)
            )
            user_id = cur.fetchone()["id"]
            conn.commit()

            session_token = make_token(user_id, client_id)
            return json_resp({"ok": True, "token": session_token, "name": name, "client_id": client_id})
        finally:
            conn.close()

    # ── Вход клиента ─────────────────────────────────────────────────
    if action == "login" and method == "POST":
        project_token = body.get("project_token", "")
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return json_resp({"ok": False, "error": "email и password обязательны"}, 400)

        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Если передан project_token — проверить что клиент привязан к этому проекту
            if project_token:
                cur.execute("SELECT client_id FROM projects WHERE client_token = %s", (project_token,))
                proj = cur.fetchone()
                if not proj:
                    return json_resp({"ok": False, "error": "Недействительная ссылка"}, 404)
                cur.execute(
                    "SELECT * FROM client_users WHERE LOWER(email) = %s AND client_id = %s",
                    (email, proj["client_id"])
                )
            else:
                cur.execute("SELECT * FROM client_users WHERE LOWER(email) = %s", (email,))

            user = cur.fetchone()
            if not user or user["password_hash"] != hash_password(password):
                return json_resp({"ok": False, "error": "Неверный email или пароль"}, 401)

            if not user["is_active"]:
                return json_resp({"ok": False, "error": "Аккаунт заблокирован"}, 403)

            cur.execute("UPDATE client_users SET last_login_at = NOW() WHERE id = %s", (user["id"],))
            conn.commit()

            session_token = make_token(user["id"], user["client_id"])
            return json_resp({"ok": True, "token": session_token, "name": user["name"], "client_id": user["client_id"]})
        finally:
            conn.close()

    # ── Проверка сессии ──────────────────────────────────────────────
    if action == "me" and method == "GET":
        auth = event.get("headers", {}).get("X-Client-Token", "")
        if not auth:
            return json_resp({"ok": False, "error": "Unauthorized"}, 401)
        result = verify_token(auth)
        if not result:
            return json_resp({"ok": False, "error": "Invalid token"}, 401)
        user_id, client_id = result
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT id, name, email, client_id FROM client_users WHERE id = %s AND is_active = TRUE", (user_id,))
            user = cur.fetchone()
            if not user:
                return json_resp({"ok": False, "error": "User not found"}, 404)
            return json_resp({"ok": True, "user": dict(user)})
        finally:
            conn.close()

    return json_resp({"ok": False, "error": f"Unknown action: {action}"}, 400)
