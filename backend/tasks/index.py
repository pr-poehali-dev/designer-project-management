"""CRUD для задач и комментариев к задачам."""
import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_resp(data, status=200):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(data, default=str)}


def handler(event: dict, context) -> dict:
    """Управление задачами: создание, обновление статуса, комментарии."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    sub = params.get("sub", "")

    if sub == "comments":
        return handle_comments(method, params, body)
    return handle_tasks(method, params, body)


def handle_tasks(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        task_id = params.get("id")

        if method == "GET" and not task_id:
            project_id = params.get("project_id")
            status_filter = params.get("status")
            where = []
            vals = []
            if project_id:
                where.append("t.project_id = %s")
                vals.append(project_id)
            if status_filter:
                where.append("t.status = %s")
                vals.append(status_filter)
            where_sql = ("WHERE " + " AND ".join(where)) if where else ""
            cur.execute(f"""
                SELECT t.*, p.name as project_name,
                    (SELECT count(*) FROM task_comments c WHERE c.task_id = t.id) as comments_count
                FROM tasks t
                LEFT JOIN projects p ON p.id = t.project_id
                {where_sql}
                ORDER BY
                    CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                    t.created_at DESC
            """, vals)
            return json_resp({"ok": True, "tasks": [dict(r) for r in cur.fetchall()]})

        if method == "GET" and task_id:
            cur.execute("""
                SELECT t.*, p.name as project_name
                FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
                WHERE t.id = %s
            """, (task_id,))
            task = cur.fetchone()
            if not task:
                return json_resp({"ok": False, "error": "Not found"}, 404)
            cur.execute("SELECT * FROM task_comments WHERE task_id = %s ORDER BY created_at ASC", (task_id,))
            comments = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "task": dict(task), "comments": comments})

        if method == "POST" and not task_id:
            fields = ["title", "description", "type", "project_id", "assignee", "priority", "status", "deadline", "tags", "created_by"]
            cols, placeholders, vals = [], [], []
            for f in fields:
                if f in body:
                    cols.append(f)
                    placeholders.append("%s")
                    v = body[f]
                    if f == "tags" and isinstance(v, list):
                        vals.append(v)
                    else:
                        vals.append(v)
            if not cols or "title" not in body:
                return json_resp({"ok": False, "error": "title required"}, 400)
            cur.execute(
                f"INSERT INTO tasks ({', '.join(cols)}) VALUES ({', '.join(placeholders)}) RETURNING id",
                vals
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            return json_resp({"ok": True, "id": new_id})

        if method == "PUT" and task_id:
            fields = ["title", "description", "type", "project_id", "assignee", "priority", "status", "deadline", "tags"]
            sets, vals = [], []
            for f in fields:
                if f in body:
                    sets.append(f"{f} = %s")
                    vals.append(body[f])
            if sets:
                sets.append("updated_at = NOW()")
                vals.append(task_id)
                cur.execute(f"UPDATE tasks SET {', '.join(sets)} WHERE id = %s", vals)
                conn.commit()
            return json_resp({"ok": True})

        if method == "DELETE" and task_id:
            cur.execute("DELETE FROM task_comments WHERE task_id = %s", (task_id,))
            cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
            conn.commit()
            return json_resp({"ok": True})

        return json_resp({"ok": False, "error": "Not found"}, 404)
    finally:
        conn.close()


def handle_comments(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        task_id = params.get("task_id")
        comment_id = params.get("id")

        if method == "GET" and task_id:
            cur.execute("SELECT * FROM task_comments WHERE task_id = %s ORDER BY created_at ASC", (task_id,))
            return json_resp({"ok": True, "comments": [dict(r) for r in cur.fetchall()]})

        if method == "POST":
            task_id = body.get("task_id")
            author = body.get("author", "")
            text = body.get("body", "").strip()
            is_internal = body.get("is_internal", True)
            if not task_id or not text:
                return json_resp({"ok": False, "error": "task_id and body required"}, 400)
            cur.execute(
                "INSERT INTO task_comments (task_id, author, body, is_internal) VALUES (%s, %s, %s, %s) RETURNING id",
                (task_id, author, text, is_internal)
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            return json_resp({"ok": True, "id": new_id})

        if method == "DELETE" and comment_id:
            cur.execute("DELETE FROM task_comments WHERE id = %s", (comment_id,))
            conn.commit()
            return json_resp({"ok": True})

        return json_resp({"ok": False, "error": "Not found"}, 404)
    finally:
        conn.close()
