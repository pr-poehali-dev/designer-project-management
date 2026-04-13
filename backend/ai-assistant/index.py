"""AI-ассистент Давинчи: голос (Whisper), диалог (GPT-4o), полный доступ к CRM."""
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
CRM_API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386"
TASKS_API = "https://functions.poehali.dev/bb906e76-a34b-4cb8-9312-650654427354"


def json_resp(data, status=200):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(data, ensure_ascii=False)}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_profile() -> dict:
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT assistant_name, full_name, assistant_gender FROM user_profile ORDER BY id LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                "assistant_name": row["assistant_name"] or "Жарвис",
                "user_name": (row["full_name"] or "").split()[0] or "друг",
                "gender": row["assistant_gender"] or "male",
            }
    except Exception:
        pass
    return {"assistant_name": "Жарвис", "user_name": "друг", "gender": "male"}


def get_crm_context() -> dict:
    """Загружает актуальные данные из CRM для контекста."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT p.id, p.name, p.status, p.deadline,
                   c.name as client_name,
                   (SELECT COUNT(*) FROM project_team t WHERE t.project_id = p.id) as team_count
            FROM projects p
            LEFT JOIN clients c ON c.id = p.client_id
            ORDER BY p.updated_at DESC LIMIT 10
        """)
        projects = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT id, name, contact_person, phone, email, status
            FROM clients ORDER BY created_at DESC LIMIT 10
        """)
        clients = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT id, title, status, priority, assignee, deadline
            FROM tasks WHERE status != 'done' ORDER BY created_at DESC LIMIT 15
        """)
        tasks = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT title, deadline FROM tasks
            WHERE deadline IS NOT NULL AND deadline >= NOW()::date AND status != 'done'
            ORDER BY deadline ASC LIMIT 5
        """)
        upcoming = [dict(r) for r in cur.fetchall()]

        conn.close()
        return {"projects": projects, "clients": clients, "tasks": tasks, "upcoming_deadlines": upcoming}
    except Exception as e:
        return {"projects": [], "clients": [], "tasks": [], "upcoming_deadlines": [], "error": str(e)}


def execute_action(action: dict) -> dict:
    """Выполняет действие в CRM напрямую через БД."""
    act = action.get("action")
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if act == "create_task":
            title = action.get("title", "Новая задача")
            description = action.get("description", "")
            priority = action.get("priority", "medium")
            assignee = action.get("assignee", "")
            deadline = action.get("deadline")
            project_id = action.get("project_id")
            cur.execute("""
                INSERT INTO tasks (title, description, priority, assignee, status, type, deadline, project_id)
                VALUES (%s, %s, %s, %s, 'new', 'project', %s, %s) RETURNING id
            """, (title, description, priority, assignee, deadline, project_id))
            task_id = cur.fetchone()["id"]
            conn.commit()
            return {"ok": True, "created": "task", "id": task_id, "title": title}

        if act == "create_client":
            name = action.get("name", "Новый клиент")
            phone = action.get("phone", "")
            email = action.get("email", "")
            contact_person = action.get("contact_person", "")
            cur.execute("""
                INSERT INTO clients (name, contact_person, phone, email, status)
                VALUES (%s, %s, %s, %s, 'new') RETURNING id
            """, (name, contact_person or name, phone, email))
            client_id = cur.fetchone()["id"]
            conn.commit()
            return {"ok": True, "created": "client", "id": client_id, "name": name}

        if act == "create_project":
            name = action.get("name", "Новый проект")
            client_id = action.get("client_id")
            cur.execute("""
                INSERT INTO projects (name, client_id, status)
                VALUES (%s, %s, 'new') RETURNING id
            """, (name, client_id))
            project_id = cur.fetchone()["id"]
            conn.commit()
            return {"ok": True, "created": "project", "id": project_id, "name": name}

        if act == "add_note":
            client_id = action.get("client_id")
            text = action.get("text", "")
            if client_id and text:
                cur.execute("INSERT INTO client_notes (client_id, text) VALUES (%s, %s) RETURNING id", (client_id, text))
                note_id = cur.fetchone()["id"]
                conn.commit()
                return {"ok": True, "created": "note", "id": note_id}

        if act == "update_task_status":
            task_id = action.get("task_id")
            status = action.get("status", "in_progress")
            if task_id:
                cur.execute("UPDATE tasks SET status = %s WHERE id = %s", (status, task_id))
                conn.commit()
                return {"ok": True, "updated": "task_status", "task_id": task_id, "status": status}

        return {"ok": False, "error": f"Unknown action: {act}"}
    finally:
        conn.close()


def transcribe_audio(audio_b64: str, mime: str = "audio/webm") -> str:
    api_key = os.environ.get("POLZA_AI_API_KEY", "")
    audio_bytes = base64.b64decode(audio_b64)
    ext = "webm"
    if "ogg" in mime: ext = "ogg"
    elif "mp4" in mime or "m4a" in mime: ext = "mp4"
    elif "wav" in mime: ext = "wav"

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
    return resp.json().get("text", "")


def build_system_prompt(assistant_name: str, user_name: str, app_context: dict, crm: dict) -> str:
    page_labels = {
        "dashboard": "Дашборд", "projects": "Проекты", "clients": "Клиенты",
        "tasks": "Задачи", "team": "Команда", "finance": "Финансы",
        "profile": "Профиль", "chats": "Чаты", "guild": "Гильдия",
        "contracts": "Шаблоны", "marketing": "Маркетинг", "company": "Компания",
    }
    status_labels = {"new": "Новый", "active": "Активный", "done": "Завершён", "paused": "Пауза"}
    priority_labels = {"high": "Высокий", "medium": "Средний", "low": "Низкий"}

    current_page = page_labels.get(app_context.get("page", ""), app_context.get("page", ""))
    project_name = app_context.get("project_name", "")

    projects_text = ""
    if crm.get("projects"):
        lines = []
        for p in crm["projects"]:
            st = status_labels.get(p.get("status", ""), p.get("status", ""))
            cl = f", клиент: {p['client_name']}" if p.get("client_name") else ""
            dl = f", дедлайн: {p['deadline']}" if p.get("deadline") else ""
            lines.append(f"  - #{p['id']} «{p['name']}» [{st}]{cl}{dl}")
        projects_text = "Последние проекты:\n" + "\n".join(lines)

    clients_text = ""
    if crm.get("clients"):
        lines = []
        for c in crm["clients"]:
            ph = f", тел: {c['phone']}" if c.get("phone") else ""
            lines.append(f"  - #{c['id']} «{c['name']}» / {c.get('contact_person', '')}{ph}")
        clients_text = "Последние клиенты:\n" + "\n".join(lines)

    tasks_text = ""
    if crm.get("tasks"):
        lines = []
        for t in crm["tasks"]:
            pr = priority_labels.get(t.get("priority", ""), "")
            as_ = f", исполнитель: {t['assignee']}" if t.get("assignee") else ""
            dl = f", дедлайн: {t['deadline']}" if t.get("deadline") else ""
            lines.append(f"  - #{t['id']} «{t['title']}» [{pr}]{as_}{dl}")
        tasks_text = "Активные задачи:\n" + "\n".join(lines)

    deadlines_text = ""
    if crm.get("upcoming_deadlines"):
        lines = [f"  - «{d['title']}» → {d['deadline']}" for d in crm["upcoming_deadlines"]]
        deadlines_text = "Ближайшие дедлайны:\n" + "\n".join(lines)

    return f"""Ты — {assistant_name}, умный AI-помощник дизайн-студии встроенный в CRM.
Обращайся к пользователю: {user_name}.
Сейчас открыта страница: {current_page}.{f" Открытый проект: «{project_name}»." if project_name else ""}

=== ДАННЫЕ CRM ===
{projects_text}

{clients_text}

{tasks_text}

{deadlines_text}
=================

Ты умеешь ВЫПОЛНЯТЬ действия. Когда пользователь просит что-то сделать — выполняй, отвечай JSON:

НАВИГАЦИЯ (перейти в раздел):
{{"action": "navigate", "page": "clients|projects|tasks|profile|guild|finance|chats|dashboard|team|contracts|marketing|company"}}

ОТКРЫТЬ ПРОЕКТ (по id из данных выше):
{{"action": "open_project", "project_id": <число>}}

СОЗДАТЬ ЗАДАЧУ:
{{"action": "create_task", "title": "...", "description": "...", "priority": "high|medium|low", "assignee": "...", "deadline": "YYYY-MM-DD или null"}}

СОЗДАТЬ КЛИЕНТА:
{{"action": "create_client", "name": "...", "contact_person": "...", "phone": "...", "email": "..."}}

СОЗДАТЬ ПРОЕКТ:
{{"action": "create_project", "name": "...", "client_id": <число или null>}}

ДОБАВИТЬ ЗАМЕТКУ КЛИЕНТУ:
{{"action": "add_note", "client_id": <число>, "text": "..."}}

ИЗМЕНИТЬ СТАТУС ЗАДАЧИ:
{{"action": "update_task_status", "task_id": <число>, "status": "new|in_progress|review|approval|done"}}

ТОЛЬКО ОТВЕТИТЬ (никакого действия):
{{"action": "reply", "text": "твой ответ здесь"}}

ВАЖНО:
- Отвечай ТОЛЬКО валидным JSON, без markdown, без лишнего текста
- Используй реальные id из данных CRM выше
- Если не знаешь id — спроси уточнение
- Если вопрос требует только ответа — используй action=reply
- Будь краток и дружелюбен, по-русски"""


def chat_with_gpt(messages: list, system_prompt: str) -> str:
    api_key = os.environ.get("POLZA_AI_API_KEY", "")
    recent = messages[-6:] if len(messages) > 6 else messages
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "system", "content": system_prompt}] + recent,
        "max_tokens": 250,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
    }
    resp = requests.post(
        f"{POLZA_BASE}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=25,
    )
    data = resp.json()
    if "choices" not in data:
        raise Exception(f"GPT error: {data.get('error', data)}")
    return data["choices"][0]["message"]["content"].strip()


def tts_openai(text: str, gender: str = "male") -> str:
    """Синтез речи через OpenAI TTS. Возвращает base64 mp3."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    # Голоса: onyx/echo/fable — мужские; shimmer/nova/alloy — женские
    voice = "onyx" if gender == "male" else "nova"
    resp = requests.post(
        "https://api.openai.com/v1/audio/speech",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "tts-1", "input": text, "voice": voice, "response_format": "mp3"},
        timeout=30,
    )
    if resp.status_code != 200:
        raise Exception(f"TTS error: {resp.status_code} {resp.text[:200]}")
    return base64.b64encode(resp.content).decode()


def handler(event: dict, context) -> dict:
    """AI-ассистент: transcribe, chat, tts, info."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    profile = get_profile()
    assistant_name = profile["assistant_name"]
    user_name = profile["user_name"]
    gender = profile["gender"]

    if action == "info" and method == "GET":
        return json_resp({"ok": True, "assistant_name": assistant_name, "user_name": user_name, "gender": gender})

    if action == "transcribe" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        audio_b64 = body.get("audio")
        mime = body.get("mime", "audio/webm")
        if not audio_b64:
            return json_resp({"ok": False, "error": "audio required"}, 400)
        text = transcribe_audio(audio_b64, mime)
        return json_resp({"ok": True, "text": text})

    if action == "tts" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        text = body.get("text", "").strip()
        if not text:
            return json_resp({"ok": False, "error": "text required"}, 400)
        audio_b64 = tts_openai(text, gender)
        return json_resp({"ok": True, "audio": audio_b64, "mime": "audio/mpeg"})

    if action == "chat" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        messages = body.get("messages", [])
        app_context = body.get("context", {})
        with_voice = body.get("with_voice", False)
        if not messages:
            return json_resp({"ok": False, "error": "messages required"}, 400)

        crm = get_crm_context()
        system_prompt = build_system_prompt(assistant_name, user_name, app_context, crm)
        raw_reply = chat_with_gpt(messages, system_prompt)

        parsed = {}
        try:
            parsed = json.loads(raw_reply)
        except Exception:
            reply_text = raw_reply
            audio_b64 = None
            if with_voice:
                try:
                    audio_b64 = tts_openai(reply_text, gender)
                except Exception:
                    audio_b64 = None
            return json_resp({"ok": True, "reply": reply_text, "action": None, "assistant_name": assistant_name, "audio": audio_b64})

        act = parsed.get("action")
        reply_text = parsed.get("text", "")

        server_actions = {"create_task", "create_client", "create_project", "add_note", "update_task_status"}
        client_actions = {"navigate", "open_project"}

        executed_result = None
        client_action = None

        if act in server_actions:
            executed_result = execute_action(parsed)
            action_labels = {
                "create_task": lambda r: f"Задача «{r.get('title', '')}» создана!",
                "create_client": lambda r: f"Клиент «{r.get('name', '')}» добавлен!",
                "create_project": lambda r: f"Проект «{r.get('name', '')}» создан!",
                "add_note": lambda _: "Заметка добавлена!",
                "update_task_status": lambda r: f"Статус задачи обновлён на «{r.get('status', '')}»",
            }
            if executed_result and executed_result.get("ok"):
                reply_text = action_labels.get(act, lambda _: "Готово!")(executed_result)
            else:
                reply_text = f"Не удалось выполнить действие: {executed_result.get('error', 'ошибка')}"
        elif act in client_actions:
            client_action = parsed
            reply_text = {"navigate": "Открываю раздел...", "open_project": "Открываю проект..."}.get(act, "Выполняю...")
        else:
            reply_text = parsed.get("text", raw_reply)

        audio_b64 = None
        if with_voice and reply_text:
            try:
                audio_b64 = tts_openai(reply_text, gender)
            except Exception:
                audio_b64 = None

        return json_resp({
            "ok": True,
            "reply": reply_text,
            "action": client_action,
            "executed": executed_result,
            "assistant_name": assistant_name,
            "audio": audio_b64,
        })

    return json_resp({"ok": False, "error": f"Unknown action: {action}"}, 400)