"""CRUD для клиентов, проектов, видов работ, заметок и документов."""
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


def handle_clients(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        client_id = params.get("id")

        if method == "GET" and not client_id:
            cur.execute("""
                SELECT c.*, 
                    (SELECT count(*) FROM projects p WHERE p.client_id = c.id) as project_count
                FROM clients c ORDER BY c.created_at DESC
            """)
            return json_resp({"ok": True, "clients": [dict(r) for r in cur.fetchall()]})

        if method == "GET" and client_id:
            cur.execute("SELECT * FROM clients WHERE id = %s", (client_id,))
            client = cur.fetchone()
            if not client:
                return json_resp({"ok": False, "error": "Not found"}, 404)
            cur.execute("SELECT * FROM projects WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
            projects = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM client_notes WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
            notes = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM client_documents WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
            docs = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "client": dict(client), "projects": projects, "notes": notes, "documents": docs})

        if method == "POST" and not client_id:
            fields = ["name", "contact_person", "phone", "email", "legal_form", "company_name",
                       "inn", "ogrn", "kpp", "legal_address", "bank_name", "bik",
                       "checking_account", "corr_account", "status", "notes"]
            cols, vals = [], []
            for f in fields:
                if f in body:
                    cols.append(f)
                    vals.append(body[f])
            if not cols:
                return json_resp({"ok": False, "error": "No data"}, 400)
            placeholders = ", ".join(["%s"] * len(cols))
            col_names = ", ".join(cols)
            cur.execute(f"INSERT INTO clients ({col_names}) VALUES ({placeholders}) RETURNING id", vals)
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method in ("POST", "PUT") and client_id:
            fields = ["name", "contact_person", "phone", "email", "legal_form", "company_name",
                       "inn", "ogrn", "kpp", "legal_address", "bank_name", "bik",
                       "checking_account", "corr_account", "status", "notes"]
            sets, vals = [], []
            for f in fields:
                if f in body:
                    sets.append(f"{f} = %s")
                    vals.append(body[f])
            if sets:
                sets.append("updated_at = NOW()")
                vals.append(client_id)
                cur.execute(f"UPDATE clients SET {', '.join(sets)} WHERE id = %s", vals)
                conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_projects(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        project_id = params.get("id")

        if method == "GET" and not project_id:
            cur.execute("""
                SELECT p.*, c.name as client_name
                FROM projects p
                LEFT JOIN clients c ON c.id = p.client_id
                ORDER BY p.created_at DESC
            """)
            projects = []
            for r in cur.fetchall():
                p = dict(r)
                cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur2.execute("SELECT COALESCE(SUM(quantity * price), 0) as total FROM work_items WHERE project_id = %s AND sort_order >= 0", (p["id"],))
                p["total"] = float(cur2.fetchone()["total"])
                cur2.execute("SELECT member_name, role FROM project_team WHERE project_id = %s", (p["id"],))
                p["team"] = [dict(t) for t in cur2.fetchall()]
                projects.append(p)
            return json_resp({"ok": True, "projects": projects})

        if method == "GET" and project_id:
            cur.execute("""
                SELECT p.*, c.name as client_name
                FROM projects p LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.id = %s
            """, (project_id,))
            project = cur.fetchone()
            if not project:
                return json_resp({"ok": False, "error": "Not found"}, 404)
            cur.execute("SELECT * FROM work_items WHERE project_id = %s AND sort_order >= 0 ORDER BY sort_order, id", (project_id,))
            items = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM project_team WHERE project_id = %s ORDER BY id", (project_id,))
            team = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM client_documents WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
            docs = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "project": dict(project), "work_items": items, "team": team, "documents": docs})

        if method == "POST" and not project_id:
            cur.execute(
                "INSERT INTO projects (name, client_id, status, deadline, discount_percent) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (body.get("name", ""), body.get("client_id"), body.get("status", "draft"),
                 body.get("deadline") or None, body.get("discount_percent", 0))
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method in ("POST", "PUT") and project_id:
            fields = ["name", "client_id", "status", "deadline", "discount_percent"]
            sets, vals = [], []
            for f in fields:
                if f in body:
                    sets.append(f"{f} = %s")
                    vals.append(body[f] if body[f] != "" else None)
            if sets:
                sets.append("updated_at = NOW()")
                vals.append(project_id)
                cur.execute(f"UPDATE projects SET {', '.join(sets)} WHERE id = %s", vals)
                conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_work_items(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        item_id = params.get("id")
        project_id = params.get("project_id")

        if method == "POST" and not item_id:
            cur.execute(
                "INSERT INTO work_items (project_id, name, quantity, unit, price, sort_order) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get("project_id"), body.get("name", ""), body.get("quantity", 1),
                 body.get("unit", "шт"), body.get("price", 0), body.get("sort_order", 0))
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method in ("POST", "PUT") and item_id:
            fields = ["name", "quantity", "unit", "price", "sort_order"]
            sets, vals = [], []
            for f in fields:
                if f in body:
                    sets.append(f"{f} = %s")
                    vals.append(body[f])
            if sets:
                vals.append(item_id)
                cur.execute(f"UPDATE work_items SET {', '.join(sets)} WHERE id = %s", vals)
                conn.commit()
            return json_resp({"ok": True})

        if method == "POST" and params.get("delete") == "true" and item_id:
            cur.execute("UPDATE work_items SET sort_order = -1 WHERE id = %s", (item_id,))
            conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_notes(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "POST":
            cur.execute(
                "INSERT INTO client_notes (client_id, text) VALUES (%s, %s) RETURNING id",
                (body.get("client_id"), body.get("text", ""))
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})
    finally:
        conn.close()


def handle_team(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "POST" and not params.get("id"):
            cur.execute(
                "INSERT INTO project_team (project_id, member_name, role) VALUES (%s, %s, %s) RETURNING id",
                (body.get("project_id"), body.get("member_name", ""), body.get("role", ""))
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})
    finally:
        conn.close()


def handle_reorder(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor()
        ids = body.get("ids", [])
        for i, item_id in enumerate(ids):
            cur.execute("UPDATE work_items SET sort_order = %s WHERE id = %s", (i, item_id))
        conn.commit()
        return json_resp({"ok": True})
    finally:
        conn.close()


def handle_templates(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        template_id = params.get("id")

        if method == "GET" and not template_id:
            cur.execute("SELECT t.*, (SELECT count(*) FROM estimate_template_items i WHERE i.template_id = t.id) as item_count FROM estimate_templates t ORDER BY t.created_at DESC")
            return json_resp({"ok": True, "templates": [dict(r) for r in cur.fetchall()]})

        if method == "GET" and template_id:
            cur.execute("SELECT * FROM estimate_templates WHERE id = %s", (template_id,))
            tpl = cur.fetchone()
            if not tpl:
                return json_resp({"ok": False, "error": "Not found"}, 404)
            cur.execute("SELECT * FROM estimate_template_items WHERE template_id = %s ORDER BY sort_order, id", (template_id,))
            items = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "template": dict(tpl), "items": items})

        if method == "POST" and not template_id:
            name = body.get("name", "Новый шаблон")
            items = body.get("items", [])
            cur.execute("INSERT INTO estimate_templates (name) VALUES (%s) RETURNING id", (name,))
            tpl_id = cur.fetchone()["id"]
            for i, item in enumerate(items):
                cur.execute(
                    "INSERT INTO estimate_template_items (template_id, name, quantity, unit, price, sort_order) VALUES (%s,%s,%s,%s,%s,%s)",
                    (tpl_id, item.get("name", ""), item.get("quantity", 1), item.get("unit", "шт"), item.get("price", 0), i)
                )
            conn.commit()
            return json_resp({"ok": True, "id": tpl_id})

        if method == "POST" and template_id and params.get("apply") == "true":
            project_id = body.get("project_id")
            if not project_id:
                return json_resp({"ok": False, "error": "project_id required"}, 400)
            cur.execute("SELECT * FROM estimate_template_items WHERE template_id = %s ORDER BY sort_order, id", (template_id,))
            tpl_items = cur.fetchall()
            cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM work_items WHERE project_id = %s AND sort_order >= 0", (project_id,))
            next_sort = int(cur.fetchone()["next_sort"] or 0)
            added_ids = []
            for i, item in enumerate(tpl_items):
                cur.execute(
                    "INSERT INTO work_items (project_id, name, quantity, unit, price, sort_order) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (project_id, item["name"], item["quantity"], item["unit"], item["price"], next_sort + i)
                )
                added_ids.append(cur.fetchone()["id"])
            conn.commit()
            cur.execute("SELECT * FROM work_items WHERE id = ANY(%s) ORDER BY sort_order", (added_ids,))
            new_items = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "added": len(tpl_items), "items": new_items})

        if method == "PUT" and template_id:
            name = body.get("name")
            items_data = body.get("items")
            if name:
                cur.execute("UPDATE estimate_templates SET name = %s WHERE id = %s", (name, template_id))
            if items_data is not None:
                cur.execute("DELETE FROM estimate_template_items WHERE template_id = %s", (template_id,))
                for i, item in enumerate(items_data):
                    cur.execute(
                        "INSERT INTO estimate_template_items (template_id, name, quantity, unit, price, sort_order) VALUES (%s,%s,%s,%s,%s,%s)",
                        (template_id, item.get("name", ""), item.get("quantity", 1), item.get("unit", "шт"), item.get("price", 0), i)
                    )
            conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_project_chat(method, params, body):
    """Чат проекта: создание, участники, сообщения."""
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        project_id = params.get("project_id")

        # Получить или создать чат проекта + участников + сообщения
        if method == "GET" and project_id:
            cur.execute("SELECT * FROM project_chats WHERE project_id = %s", (project_id,))
            chat = cur.fetchone()
            if not chat:
                # Создаём чат и добавляем клиента проекта автоматически
                cur.execute("INSERT INTO project_chats (project_id) VALUES (%s) RETURNING id", (project_id,))
                chat_id = cur.fetchone()["id"]
                # Добавляем клиента если привязан
                cur.execute("""
                    SELECT c.name, c.contact_person FROM projects p
                    LEFT JOIN clients c ON c.id = p.client_id
                    WHERE p.id = %s AND p.client_id IS NOT NULL
                """, (project_id,))
                client_row = cur.fetchone()
                if client_row:
                    cname = client_row["contact_person"] or client_row["name"] or "Клиент"
                    cur.execute(
                        "INSERT INTO project_chat_members (chat_id, name, role, color) VALUES (%s, %s, 'client', '#6366F1') RETURNING id",
                        (chat_id, cname)
                    )
                conn.commit()
                cur.execute("SELECT * FROM project_chats WHERE id = %s", (chat_id,))
                chat = cur.fetchone()
            else:
                chat_id = chat["id"]

            cur.execute("SELECT * FROM project_chat_members WHERE chat_id = %s ORDER BY id", (chat_id,))
            members = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM project_chat_messages WHERE chat_id = %s ORDER BY created_at ASC", (chat_id,))
            messages = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "chat": dict(chat), "members": members, "messages": messages})

        # Отправить сообщение
        if method == "POST" and params.get("sub") == "message":
            chat_id = body.get("chat_id")
            text = body.get("text", "").strip()
            author_name = body.get("author_name", "Менеджер")
            author_role = body.get("author_role", "manager")
            member_id = body.get("member_id")
            if not chat_id or not text:
                return json_resp({"ok": False, "error": "chat_id and text required"}, 400)
            cur.execute(
                "INSERT INTO project_chat_messages (chat_id, member_id, author_name, author_role, text) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                (chat_id, member_id, author_name, author_role, text)
            )
            msg = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "message": msg})

        # Добавить участника
        if method == "POST" and params.get("sub") == "member":
            chat_id = body.get("chat_id")
            name = body.get("name", "").strip()
            role = body.get("role", "member")
            color = body.get("color", "#111111")
            if not chat_id or not name:
                return json_resp({"ok": False, "error": "chat_id and name required"}, 400)
            cur.execute(
                "INSERT INTO project_chat_members (chat_id, name, role, color) VALUES (%s, %s, %s, %s) RETURNING *",
                (chat_id, name, role, color)
            )
            member = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "member": member})

    finally:
        conn.close()


def handle_clients_list_short(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, name, contact_person FROM clients ORDER BY name")
        return json_resp({"ok": True, "clients": [dict(r) for r in cur.fetchall()]})
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """CRUD API для клиентов, проектов, видов работ, заметок."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "clients")
    body = {}
    if method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")

    if action == "clients":
        return handle_clients(method, params, body)
    elif action == "clients_short":
        return handle_clients_list_short(method, params, body)
    elif action == "projects":
        return handle_projects(method, params, body)
    elif action == "work_items":
        return handle_work_items(method, params, body)
    elif action == "notes":
        return handle_notes(method, params, body)
    elif action == "team":
        return handle_team(method, params, body)
    elif action == "reorder":
        return handle_reorder(method, params, body)
    elif action == "templates":
        return handle_templates(method, params, body)
    elif action == "project_chat":
        return handle_project_chat(method, params, body)

    return json_resp({"ok": False, "error": f"Unknown action: {action}"}, 400)