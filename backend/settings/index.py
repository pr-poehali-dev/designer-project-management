"""Профиль пользователя и данные компании — чтение и сохранение."""
import json
import os
import psycopg2
import psycopg2.extras


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

PROFILE_FIELDS = ["full_name", "phone", "email", "position", "avatar_url"]
COMPANY_FIELDS = [
    "legal_form", "company_name", "inn", "ogrn", "kpp",
    "legal_address", "actual_address",
    "bank_name", "bik", "checking_account", "corr_account",
    "director_name", "contact_phone", "contact_email",
]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_profile() -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM user_profile ORDER BY id LIMIT 1")
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def save_profile(data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for f in PROFILE_FIELDS:
            if f in data:
                sets.append(f"{f} = %s")
                vals.append(data[f])
        if not sets:
            return
        sets.append("updated_at = NOW()")
        vals.append(1)
        cur.execute(f"UPDATE user_profile SET {', '.join(sets)} WHERE id = %s", vals)
        conn.commit()
    finally:
        conn.close()


def get_company() -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM company_info ORDER BY id LIMIT 1")
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def save_company(data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for f in COMPANY_FIELDS:
            if f in data:
                sets.append(f"{f} = %s")
                vals.append(data[f])
        if not sets:
            return
        sets.append("updated_at = NOW()")
        vals.append(1)
        cur.execute(f"UPDATE company_info SET {', '.join(sets)} WHERE id = %s", vals)
        conn.commit()
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Чтение и сохранение профиля пользователя и данных компании."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "profile")

    if action == "profile" and method == "GET":
        data = get_profile()
        data.pop("id", None)
        data.pop("updated_at", None)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "profile": data}, default=str)
        }

    if action == "profile" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        save_profile(body)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    if action == "company" and method == "GET":
        data = get_company()
        data.pop("id", None)
        data.pop("updated_at", None)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "company": data}, default=str)
        }

    if action == "company" and method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        save_company(body)
        return {
            "statusCode": 200, "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True})
        }

    return {
        "statusCode": 400, "headers": CORS_HEADERS,
        "body": json.dumps({"ok": False, "error": f"Unknown action: {action}"})
    }
