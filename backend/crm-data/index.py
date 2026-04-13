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
                subtotal = float(cur2.fetchone()["total"])
                disc_pct = float(p.get("discount_percent") or 0)
                p["total"] = subtotal * (1 - disc_pct / 100)
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
            import secrets as _secrets
            token = _secrets.token_hex(24)
            cur.execute(
                "INSERT INTO projects (name, client_id, status, deadline, discount_percent, client_token) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (body.get("name", ""), body.get("client_id"), body.get("status", "draft"),
                 body.get("deadline") or None, body.get("discount_percent", 0), token)
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method in ("POST", "PUT") and project_id:
            fields = ["name", "client_id", "status", "deadline", "discount_percent", "vat_mode", "vat_rate", "main_estimate_approved", "object_address", "object_type", "object_area", "project_duration"]
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
                "INSERT INTO work_items (project_id, estimate_id, name, quantity, unit, price, sort_order) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get("project_id"), body.get("estimate_id"), body.get("name", ""), body.get("quantity", 1),
                 body.get("unit", "шт"), body.get("price", 0), body.get("sort_order", 0))
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method == "POST" and params.get("delete") == "true" and item_id:
            cur.execute("UPDATE work_items SET sort_order = -1 WHERE id = %s", (item_id,))
            conn.commit()
            return json_resp({"ok": True})

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


def handle_client_token(method, params, body):
    """Получить или сгенерировать токен клиента для проекта."""
    conn = get_db()
    try:
        import secrets as _secrets
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        project_id = params.get("project_id")
        if not project_id:
            return json_resp({"ok": False, "error": "project_id required"}, 400)
        cur.execute("SELECT client_token FROM projects WHERE id = %s", (project_id,))
        row = cur.fetchone()
        if not row:
            return json_resp({"ok": False, "error": "Not found"}, 404)
        token = row["client_token"]
        if not token:
            token = _secrets.token_hex(24)
            cur.execute("UPDATE projects SET client_token = %s WHERE id = %s", (token, project_id))
            conn.commit()
        return json_resp({"ok": True, "token": token})
    finally:
        conn.close()


def handle_client_view(method, params, body):
    """Публичный endpoint для клиента — только по токену, без авторизации."""
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        token = params.get("token")
        if not token:
            return json_resp({"ok": False, "error": "token required"}, 400)

        cur.execute("""
            SELECT p.id, p.name, p.status, p.deadline, p.discount_percent, p.vat_mode, p.vat_rate,
                   c.name as client_name, c.contact_person, c.phone, c.email
            FROM projects p LEFT JOIN clients c ON c.id = p.client_id
            WHERE p.client_token = %s
        """, (token,))
        project = cur.fetchone()
        if not project:
            return json_resp({"ok": False, "error": "Not found"}, 404)

        project_id = project["id"]

        # Основная смета — только если утверждена
        cur.execute("SELECT main_estimate_approved FROM projects WHERE id = %s", (project_id,))
        proj_flags = cur.fetchone()
        if proj_flags and proj_flags["main_estimate_approved"]:
            cur.execute("""
                SELECT id, name, quantity, unit, price, sort_order
                FROM work_items WHERE project_id = %s AND estimate_id IS NULL AND sort_order >= 0 ORDER BY sort_order, id
            """, (project_id,))
            items = [dict(r) for r in cur.fetchall()]
        else:
            items = []

        # Доп. сметы — только утверждённые
        cur.execute("""
            SELECT e.id, e.name, e.discount_percent, e.vat_mode, e.vat_rate
            FROM project_estimates e WHERE e.project_id = %s AND e.is_approved = TRUE ORDER BY e.sort_order, e.id
        """, (project_id,))
        estimates_raw = [dict(r) for r in cur.fetchall()]
        estimates = []
        for est in estimates_raw:
            cur.execute("SELECT id, name, quantity, unit, price FROM work_items WHERE estimate_id = %s AND sort_order >= 0 ORDER BY sort_order, id", (est["id"],))
            est["items"] = [dict(r) for r in cur.fetchall()]
            estimates.append(est)

        cur.execute("SELECT * FROM project_chats WHERE project_id = %s", (project_id,))
        chat = cur.fetchone()
        chat_id = None
        members = []
        messages = []
        if chat:
            chat_id = chat["id"]
            cur.execute("SELECT * FROM project_chat_members WHERE chat_id = %s ORDER BY id", (chat_id,))
            members = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM project_chat_messages WHERE chat_id = %s ORDER BY created_at ASC", (chat_id,))
            messages = [dict(r) for r in cur.fetchall()]

        if method == "POST" and params.get("sub") == "message":
            if not chat_id:
                return json_resp({"ok": False, "error": "Chat not found"}, 404)
            text = body.get("text", "").strip()
            author_name = body.get("author_name", "Клиент")
            if not text:
                return json_resp({"ok": False, "error": "text required"}, 400)
            cur.execute(
                "INSERT INTO project_chat_messages (chat_id, author_name, author_role, text) VALUES (%s,%s,'client',%s) RETURNING *",
                (chat_id, author_name, text)
            )
            msg = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "message": msg})

        return json_resp({
            "ok": True,
            "project": dict(project),
            "items": items,
            "estimates": estimates,
            "chat": {"id": chat_id} if chat_id else None,
            "members": members,
            "messages": messages,
        })
    finally:
        conn.close()


def handle_estimates(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        estimate_id = params.get("id")
        project_id = params.get("project_id")

        if method == "GET" and project_id:
            cur.execute("SELECT * FROM project_estimates WHERE project_id = %s ORDER BY sort_order, id", (project_id,))
            estimates = [dict(r) for r in cur.fetchall()]
            for est in estimates:
                cur.execute("SELECT * FROM work_items WHERE estimate_id = %s AND sort_order >= 0 ORDER BY sort_order, id", (est["id"],))
                est["items"] = [dict(r) for r in cur.fetchall()]
            # Также включаем позиции без estimate_id (старые)
            cur.execute("SELECT * FROM work_items WHERE project_id = %s AND estimate_id IS NULL AND sort_order >= 0 ORDER BY sort_order, id", (project_id,))
            orphan_items = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "estimates": estimates, "orphan_items": orphan_items})

        if method == "POST" and not estimate_id:
            pid = body.get("project_id")
            name = body.get("name", "Дополнительная смета")
            cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as ns FROM project_estimates WHERE project_id = %s", (pid,))
            ns = cur.fetchone()["ns"]
            cur.execute(
                "INSERT INTO project_estimates (project_id, name, discount_percent, vat_mode, vat_rate, sort_order) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (pid, name, body.get("discount_percent", 0), body.get("vat_mode", "none"), body.get("vat_rate", 20), ns)
            )
            conn.commit()
            return json_resp({"ok": True, "id": cur.fetchone()["id"]})

        if method in ("POST", "PUT") and estimate_id:
            # Утверждение сметы
            if body.get("action") == "approve":
                approved = body.get("is_approved", True)
                cur.execute(
                    "UPDATE project_estimates SET is_approved = %s, approved_at = CASE WHEN %s THEN NOW() ELSE NULL END WHERE id = %s",
                    (approved, approved, estimate_id)
                )
                conn.commit()
                return json_resp({"ok": True})
            # Утверждение основной сметы (без estimate_id)
            if body.get("action") == "approve_main":
                pid = body.get("project_id")
                approved = body.get("is_approved", True)
                cur.execute(
                    "UPDATE projects SET main_estimate_approved = %s, main_estimate_approved_at = CASE WHEN %s THEN NOW() ELSE NULL END WHERE id = %s",
                    (approved, approved, pid)
                )
                conn.commit()
                return json_resp({"ok": True})
            fields = ["name", "discount_percent", "vat_mode", "vat_rate"]
            sets, vals = [], []
            for f in fields:
                if f in body:
                    sets.append(f"{f} = %s")
                    vals.append(body[f])
            if sets:
                vals.append(estimate_id)
                cur.execute(f"UPDATE project_estimates SET {', '.join(sets)} WHERE id = %s", vals)
                conn.commit()
            return json_resp({"ok": True})

        if method == "DELETE" and estimate_id:
            cur.execute("DELETE FROM work_items WHERE estimate_id = %s", (estimate_id,))
            cur.execute("DELETE FROM project_estimates WHERE id = %s", (estimate_id,))
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


STAGE_KEYS = ["survey", "concept", "working_project", "visualization", "supervision", "handover"]
STAGE_LABELS = {
    "survey": "Замер",
    "concept": "Концепция",
    "working_project": "Рабочий проект",
    "visualization": "Визуализация",
    "supervision": "Авторский надзор",
    "handover": "Сдача объекта",
}


def handle_stages(method, params, body):
    """Этапы проекта: статус, комментарий, файлы/фото."""
    import base64 as _base64, uuid as _uuid, boto3 as _boto3, os as _os
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        project_id = params.get("project_id") or body.get("project_id")
        sub = params.get("sub", "")

        if method == "GET" and not sub:
            # Инициализируем недостающие этапы
            for key in STAGE_KEYS:
                cur.execute(
                    "INSERT INTO project_stages (project_id, stage_key) VALUES (%s, %s) ON CONFLICT (project_id, stage_key) DO NOTHING",
                    (project_id, key)
                )
            conn.commit()

            cur.execute("SELECT * FROM project_stages WHERE project_id = %s ORDER BY id", (project_id,))
            stages_raw = {r["stage_key"]: dict(r) for r in cur.fetchall()}

            result = []
            for key in STAGE_KEYS:
                stage = stages_raw.get(key, {})
                stage_id = stage.get("id")
                files = []
                if stage_id:
                    cur.execute("SELECT * FROM stage_files WHERE stage_id = %s ORDER BY created_at ASC", (stage_id,))
                    files = [dict(f) for f in cur.fetchall()]
                result.append({
                    "id": stage_id,
                    "project_id": int(project_id),
                    "stage_key": key,
                    "label": STAGE_LABELS[key],
                    "status": stage.get("status", "pending"),
                    "comment": stage.get("comment", ""),
                    "completed_at": stage.get("completed_at"),
                    "files": files,
                })
            return json_resp({"ok": True, "stages": result})

        if method == "PUT" and not sub:
            stage_key = body.get("stage_key")
            status = body.get("status")
            comment = body.get("comment")
            sets, vals = [], []
            if status is not None:
                sets.append("status = %s"); vals.append(status)
                if status == "done":
                    sets.append("completed_at = NOW()")
                elif status == "pending":
                    sets.append("completed_at = NULL")
            if comment is not None:
                sets.append("comment = %s"); vals.append(comment)
            if sets:
                sets.append("updated_at = NOW()")
                vals += [project_id, stage_key]
                cur.execute(f"UPDATE project_stages SET {', '.join(sets)} WHERE project_id = %s AND stage_key = %s", vals)
                conn.commit()
            return json_resp({"ok": True})

        if method == "POST" and sub == "file":
            stage_key = body.get("stage_key")
            file_data = body.get("file")
            mime = body.get("mime", "image/jpeg")
            name = body.get("name", "Файл")
            file_type = body.get("file_type", "photo")

            cur.execute("SELECT id FROM project_stages WHERE project_id = %s AND stage_key = %s", (project_id, stage_key))
            row = cur.fetchone()
            if not row:
                return json_resp({"ok": False, "error": "Stage not found"}, 404)
            stage_id = row["id"]

            raw = _base64.b64decode(file_data)
            ext = mime.split("/")[-1].replace("jpeg", "jpg")
            key = f"stages/{project_id}/{stage_key}/{_uuid.uuid4()}.{ext}"
            s3 = _boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=_os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=_os.environ["AWS_SECRET_ACCESS_KEY"])
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime, ACL="public-read")
            url = f"https://cdn.poehali.dev/projects/{_os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            cur.execute(
                "INSERT INTO stage_files (stage_id, project_id, name, url, mime, file_type) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (stage_id, project_id, name, url, mime, file_type)
            )
            f = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "file": f})

        if method == "DELETE" and sub == "file":
            file_id = params.get("file_id") or body.get("file_id")
            cur.execute("UPDATE stage_files SET url = '' WHERE id = %s AND project_id = %s", (file_id, project_id))
            conn.commit()
            return json_resp({"ok": True})

        return json_resp({"ok": False, "error": "Bad request"}, 400)
    finally:
        conn.close()


def handle_partners(method, params, body):
    """CRUD для партнёров: магазины, поставщики, отделочники."""
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        partner_id = params.get("id")

        if method == "GET" and not partner_id:
            category = params.get("category", "")
            if category:
                cur.execute("SELECT * FROM partners WHERE category = %s ORDER BY name ASC", (category,))
            else:
                cur.execute("SELECT * FROM partners ORDER BY name ASC")
            return json_resp({"ok": True, "partners": [dict(r) for r in cur.fetchall()]})

        if method == "GET" and partner_id:
            cur.execute("SELECT * FROM partners WHERE id = %s", (partner_id,))
            row = cur.fetchone()
            if not row:
                return json_resp({"ok": False, "error": "Not found"}, 404)
            return json_resp({"ok": True, "partner": dict(row)})

        if method == "POST" and not partner_id:
            fields = ["name", "category", "services", "phone", "email", "address", "website", "contact_person", "discount_percent", "notes"]
            cols = [f for f in fields if f in body]
            vals = [body[f] for f in cols]
            placeholders = ", ".join(["%s"] * len(cols))
            cur.execute(
                f"INSERT INTO partners ({', '.join(cols)}) VALUES ({placeholders}) RETURNING *",
                vals
            )
            partner = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "partner": partner})

        if method == "PUT" and partner_id:
            fields = ["name", "category", "services", "phone", "email", "address", "website", "contact_person", "discount_percent", "notes"]
            sets = [f"{f} = %s" for f in fields if f in body]
            vals = [body[f] for f in fields if f in body]
            if not sets:
                return json_resp({"ok": False, "error": "No fields to update"})
            sets.append("updated_at = NOW()")
            vals.append(partner_id)
            cur.execute(f"UPDATE partners SET {', '.join(sets)} WHERE id = %s RETURNING *", vals)
            partner = cur.fetchone()
            conn.commit()
            return json_resp({"ok": True, "partner": dict(partner) if partner else {}})

        if method == "DELETE" and partner_id:
            cur.execute("DELETE FROM partners WHERE id = %s", (partner_id,))
            conn.commit()
            return json_resp({"ok": True})

        return json_resp({"ok": False, "error": "Bad request"}, 400)
    finally:
        conn.close()


def handle_members(method, params, body):
    """Список участников для выбора в команду: профиль дизайнера, команда проекта, клиент проекта, + доступные роли."""
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        project_id = params.get("project_id") or body.get("project_id")

        # Профиль владельца (дизайнер)
        cur.execute("SELECT full_name, position, specializations FROM user_profile ORDER BY id LIMIT 1")
        profile = cur.fetchone()
        members = []
        available_roles = []

        if profile:
            name = profile["full_name"] or "Дизайнер"
            members.append({"name": name, "label": f"{name} (вы)"})
            specs = profile["specializations"] or []
            available_roles = list(specs)

        # Команда проекта (уже добавленные — чтобы не дублировать)
        existing_names = set()
        if project_id:
            cur.execute("SELECT member_name FROM project_team WHERE project_id = %s", (project_id,))
            existing_names = {r["member_name"] for r in cur.fetchall()}

        # Клиент проекта
        if project_id:
            cur.execute("""
                SELECT c.name, c.contact_person FROM projects p
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.id = %s
            """, (project_id,))
            proj = cur.fetchone()
            if proj:
                client_name = proj["contact_person"] or proj["name"]
                if client_name:
                    members.append({"name": client_name, "label": f"{client_name} (клиент)"})

        # Все роли из user_profile (объединяем уникальные)
        cur.execute("SELECT DISTINCT unnest(specializations) as spec FROM user_profile WHERE specializations IS NOT NULL")
        all_specs = [r["spec"] for r in cur.fetchall()]
        for s in all_specs:
            if s not in available_roles:
                available_roles.append(s)

        SPEC_MAP = {
            "designer": "Дизайнер",
            "draftsman": "Чертежник",
            "visualizer": "Визуализатор",
            "estimator": "Сметчик",
        }
        roles = [{"id": s, "label": SPEC_MAP.get(s, s.capitalize())} for s in available_roles]
        # Дефолтный набор если пусто
        if not roles:
            roles = [
                {"id": "designer", "label": "Дизайнер"},
                {"id": "draftsman", "label": "Чертежник"},
                {"id": "visualizer", "label": "Визуализатор"},
                {"id": "estimator", "label": "Сметчик"},
            ]

        return json_resp({"ok": True, "members": members, "roles": roles, "existing_names": list(existing_names)})
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


def handle_client_messages(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        client_id = params.get("client_id") or body.get("client_id")

        if method == "GET" and client_id:
            cur.execute(
                "UPDATE client_messages SET is_read = TRUE WHERE client_id = %s AND from_me = FALSE AND is_read = FALSE",
                (client_id,)
            )
            conn.commit()
            cur.execute(
                "SELECT * FROM client_messages WHERE client_id = %s ORDER BY created_at ASC",
                (client_id,)
            )
            return json_resp({"ok": True, "messages": [dict(r) for r in cur.fetchall()]})

        if method == "GET" and not client_id:
            cur.execute("""
                SELECT c.id, c.name, c.contact_person, c.phone,
                    (SELECT COUNT(*) FROM client_messages m WHERE m.client_id = c.id AND m.from_me = FALSE AND m.is_read = FALSE) as unread,
                    (SELECT text FROM client_messages m WHERE m.client_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM client_messages m WHERE m.client_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
                FROM clients c
                ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
            """)
            return json_resp({"ok": True, "clients": [dict(r) for r in cur.fetchall()]})

        if method == "POST":
            text = body.get("text", "").strip()
            from_me = body.get("from_me", True)
            if not client_id or not text:
                return json_resp({"ok": False, "error": "client_id and text required"}, 400)
            cur.execute(
                "INSERT INTO client_messages (client_id, from_me, text) VALUES (%s, %s, %s) RETURNING *",
                (client_id, from_me, text)
            )
            msg = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "message": msg})

    finally:
        conn.close()


def handle_client_messages_unread(method, params, body):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM client_messages WHERE from_me = FALSE AND is_read = FALSE")
        row = cur.fetchone()
        return json_resp({"ok": True, "unread": row["total"] if row else 0})
    finally:
        conn.close()


def handle_brief(method, params, body):
    import json as _json
    project_id = params.get("project_id") or body.get("project_id")
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "GET":
            cur.execute("SELECT * FROM project_briefs WHERE project_id = %s", (project_id,))
            row = cur.fetchone()
            if row:
                brief = dict(row)
                # Распаковываем custom_data в основной объект
                custom = brief.pop("custom_data", {}) or {}
                if isinstance(custom, str):
                    custom = _json.loads(custom)
                brief.update(custom)
                return json_resp({"ok": True, "brief": brief})
            return json_resp({"ok": True, "brief": None})
        if method in ("POST", "PUT"):
            known = ["style", "area", "budget", "rooms", "wishes", "color_palette",
                     "furniture", "restrictions", "extra", "client_comment"]
            sets, vals = [], []
            custom_data = {}
            for key, val in body.items():
                if key in ("project_id",):
                    continue
                if key in known:
                    sets.append(f"{key} = %s")
                    vals.append(val)
                elif key not in ("id", "updated_at"):
                    custom_data[key] = val
            if custom_data:
                sets.append("custom_data = custom_data || %s::jsonb")
                vals.append(_json.dumps(custom_data, ensure_ascii=False))
            sets.append("updated_at = NOW()")
            cur.execute("SELECT id FROM project_briefs WHERE project_id = %s", (project_id,))
            if cur.fetchone():
                vals.append(project_id)
                cur.execute(f"UPDATE project_briefs SET {', '.join(sets)} WHERE project_id = %s", vals)
            else:
                cur.execute("INSERT INTO project_briefs (project_id) VALUES (%s)", (project_id,))
                if sets:
                    vals.append(project_id)
                    cur.execute(f"UPDATE project_briefs SET {', '.join(sets)} WHERE project_id = %s", vals)
            conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_references(method, params, body):
    import base64, uuid, boto3, os as _os
    project_id = params.get("project_id") or body.get("project_id")
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "GET":
            cur.execute("SELECT * FROM project_references WHERE project_id = %s ORDER BY created_at ASC", (project_id,))
            return json_resp({"ok": True, "references": [dict(r) for r in cur.fetchall()]})
        if method == "POST":
            file_data = body.get("file")
            mime = body.get("mime", "image/jpeg")
            caption = body.get("caption", "")
            uploaded_by = body.get("uploaded_by", "client")
            if not file_data:
                return json_resp({"ok": False, "error": "file required"}, 400)
            raw = base64.b64decode(file_data)
            ext = mime.split("/")[-1].replace("jpeg", "jpg")
            key = f"references/{uuid.uuid4()}.{ext}"
            s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=_os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=_os.environ["AWS_SECRET_ACCESS_KEY"])
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime, ACL="public-read")
            url = f"https://cdn.poehali.dev/projects/{_os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute(
                "INSERT INTO project_references (project_id, uploaded_by, url, caption) VALUES (%s, %s, %s, %s) RETURNING *",
                (project_id, uploaded_by, url, caption)
            )
            ref = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "reference": ref})
        if method == "DELETE":
            ref_id = params.get("id") or body.get("id")
            cur.execute("DELETE FROM project_references WHERE id = %s AND project_id = %s", (ref_id, project_id))
            conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_documents(method, params, body):
    import base64, uuid, boto3, os as _os
    project_id = params.get("project_id") or body.get("project_id")
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "GET":
            cur.execute("SELECT * FROM project_documents WHERE project_id = %s ORDER BY created_at ASC", (project_id,))
            return json_resp({"ok": True, "documents": [dict(r) for r in cur.fetchall()]})
        if method == "POST" and not body.get("action"):
            file_data = body.get("file")
            mime = body.get("mime", "application/pdf")
            name = body.get("name", "Документ")
            doc_type = body.get("doc_type", "other")
            uploaded_by = body.get("uploaded_by", "designer")
            if not file_data:
                return json_resp({"ok": False, "error": "file required"}, 400)
            raw = base64.b64decode(file_data)
            ext = mime.split("/")[-1]
            if ext == "vnd.openxmlformats-officedocument.wordprocessingml.document": ext = "docx"
            elif ext == "msword": ext = "doc"
            key = f"documents/{uuid.uuid4()}.{ext}"
            s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=_os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=_os.environ["AWS_SECRET_ACCESS_KEY"])
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime, ACL="public-read")
            url = f"https://cdn.poehali.dev/projects/{_os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute(
                "INSERT INTO project_documents (project_id, uploaded_by, name, url, doc_type) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                (project_id, uploaded_by, name, url, doc_type)
            )
            doc = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "document": doc})
        if method == "POST" and body.get("action") == "sign":
            doc_id = body.get("id")
            cur.execute("UPDATE project_documents SET is_signed = TRUE WHERE id = %s AND project_id = %s", (doc_id, project_id))
            conn.commit()
            return json_resp({"ok": True})
    finally:
        conn.close()


def handle_payments(method, params, body):
    project_id = params.get("project_id") or body.get("project_id")
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if method == "GET":
            cur.execute("SELECT * FROM project_payments WHERE project_id = %s ORDER BY created_at ASC", (project_id,))
            payments = [dict(r) for r in cur.fetchall()]
            paid = sum(float(p["amount"]) for p in payments if p["is_paid"])

            # Сумма утверждённых смет (доп. сметы)
            cur.execute("""
                SELECT COALESCE(SUM(wi.quantity * wi.price), 0) as subtotal,
                       e.discount_percent, e.vat_mode, e.vat_rate
                FROM project_estimates e
                LEFT JOIN work_items wi ON wi.estimate_id = e.id AND wi.sort_order >= 0
                WHERE e.project_id = %s AND e.is_approved = TRUE
                GROUP BY e.id, e.discount_percent, e.vat_mode, e.vat_rate
            """, (project_id,))
            approved_total = 0.0
            for row in cur.fetchall():
                sub = float(row["subtotal"])
                disc = sub * float(row["discount_percent"] or 0) / 100
                after = sub - disc
                vm = row["vat_mode"]
                vr = float(row["vat_rate"] or 20)
                if vm == "added":
                    after = after + after * vr / 100
                approved_total += after

            # Основная смета (work_items без estimate_id) если утверждена
            cur.execute("SELECT main_estimate_approved, discount_percent, vat_mode, vat_rate FROM projects WHERE id = %s", (project_id,))
            proj = cur.fetchone()
            if proj and proj["main_estimate_approved"]:
                cur.execute("SELECT COALESCE(SUM(quantity * price), 0) as subtotal FROM work_items WHERE project_id = %s AND estimate_id IS NULL AND sort_order >= 0", (project_id,))
                main_sub = float(cur.fetchone()["subtotal"])
                disc = main_sub * float(proj["discount_percent"] or 0) / 100
                after = main_sub - disc
                vm = proj["vat_mode"]
                vr = float(proj["vat_rate"] or 20)
                if vm == "added":
                    after = after + after * vr / 100
                approved_total += after

            remaining = approved_total - paid
            return json_resp({"ok": True, "payments": payments, "total": approved_total, "paid": paid, "remaining": remaining})
        if method == "POST" and not body.get("action"):
            cur.execute(
                "INSERT INTO project_payments (project_id, amount, label, is_paid) VALUES (%s, %s, %s, %s) RETURNING *",
                (project_id, body.get("amount", 0), body.get("label", ""), body.get("is_paid", False))
            )
            pay = dict(cur.fetchone())
            conn.commit()
            return json_resp({"ok": True, "payment": pay})
        if method == "POST" and body.get("action") == "mark_paid":
            pay_id = body.get("id")
            cur.execute(
                "UPDATE project_payments SET is_paid = %s, paid_at = CASE WHEN %s THEN NOW() ELSE NULL END WHERE id = %s AND project_id = %s",
                (body.get("is_paid", True), body.get("is_paid", True), pay_id, project_id)
            )
            conn.commit()
            return json_resp({"ok": True})
        if method == "DELETE":
            pay_id = params.get("id") or body.get("id")
            cur.execute("DELETE FROM project_payments WHERE id = %s AND project_id = %s", (pay_id, project_id))
            conn.commit()
            return json_resp({"ok": True})
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
    elif action == "estimates":
        return handle_estimates(method, params, body)
    elif action == "project_chat":
        return handle_project_chat(method, params, body)
    elif action == "client_view":
        return handle_client_view(method, params, body)
    elif action == "client_token":
        return handle_client_token(method, params, body)
    elif action == "client_messages":
        return handle_client_messages(method, params, body)
    elif action == "client_messages_unread":
        return handle_client_messages_unread(method, params, body)
    elif action == "brief":
        return handle_brief(method, params, body)
    elif action == "references":
        return handle_references(method, params, body)
    elif action == "documents":
        return handle_documents(method, params, body)
    elif action == "payments":
        return handle_payments(method, params, body)
    elif action == "members":
        return handle_members(method, params, body)
    elif action == "partners":
        return handle_partners(method, params, body)
    elif action == "stages":
        return handle_stages(method, params, body)

    return json_resp({"ok": False, "error": f"Unknown action: {action}"}, 400)