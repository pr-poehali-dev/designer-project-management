"""
Генерация .docx документа из шаблона с подстановкой переменных проекта.
POST ?action=generate — генерирует docx, загружает в S3, возвращает URL
GET ?action=templates — список шаблонов
"""
import json
import os
import re
import io
import base64
import boto3
import psycopg2
import psycopg2.extras
from datetime import datetime

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def json_resp(data, status=200):
    return {"statusCode": status, "headers": HEADERS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # GET /templates — список шаблонов
        if method == "GET" and action == "templates":
            cur.execute("SELECT id, name FROM doc_templates ORDER BY id")
            templates = [dict(r) for r in cur.fetchall()]
            return json_resp({"ok": True, "templates": templates})

        # POST /generate — генерация документа
        if method == "POST" and action == "generate":
            project_id = body.get("project_id")
            template_id = body.get("template_id")

            if not project_id or not template_id:
                return json_resp({"ok": False, "error": "project_id and template_id required"}, 400)

            # Загружаем шаблон
            cur.execute("SELECT content FROM doc_templates WHERE id = %s", (template_id,))
            tpl_row = cur.fetchone()
            if not tpl_row:
                return json_resp({"ok": False, "error": "Template not found"}, 404)
            template_text = tpl_row["content"]

            # Загружаем данные проекта
            cur.execute("""
                SELECT p.*, c.name as client_name, c.phone as client_phone, c.email as client_email,
                       c.company_name as client_company, c.inn as client_inn, c.ogrn as client_ogrn,
                       c.kpp as client_kpp, c.legal_address as client_legal_address,
                       c.bank_name as client_bank_name, c.bik as client_bik,
                       c.checking_account as client_checking_account,
                       c.corr_account as client_corr_account
                FROM projects p
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.id = %s
            """, (project_id,))
            proj = cur.fetchone()
            if not proj:
                return json_resp({"ok": False, "error": "Project not found"}, 404)

            # Загружаем реквизиты дизайнера (settings)
            cur.execute("SELECT key, value FROM settings")
            settings = {r["key"]: r["value"] for r in cur.fetchall()}

            # Считаем итоговую сумму утверждённых смет
            cur.execute("""
                SELECT COALESCE(SUM(wi.quantity * wi.price), 0) as subtotal,
                       e.discount_percent, e.vat_mode, e.vat_rate
                FROM project_estimates e
                LEFT JOIN work_items wi ON wi.estimate_id = e.id
                WHERE e.project_id = %s AND e.is_approved = TRUE
                GROUP BY e.id, e.discount_percent, e.vat_mode, e.vat_rate
            """, (project_id,))
            total = 0.0
            for row in cur.fetchall():
                sub = float(row["subtotal"])
                disc = sub * float(row["discount_percent"] or 0) / 100
                after = sub - disc
                vm = row["vat_mode"]
                vr = float(row["vat_rate"] or 20)
                if vm == "added":
                    after = after + after * vr / 100
                total += after

            if proj["main_estimate_approved"]:
                cur.execute("SELECT COALESCE(SUM(quantity * price), 0) as sub FROM work_items WHERE project_id = %s AND estimate_id IS NULL", (project_id,))
                main_sub = float(cur.fetchone()["sub"])
                disc = main_sub * float(proj["discount_percent"] or 0) / 100
                after = main_sub - disc
                vm = proj["vat_mode"] or "none"
                vr = float(proj["vat_rate"] or 20)
                if vm == "added":
                    after = after + after * vr / 100
                total += after

            total_str = f"{int(total):,}".replace(",", " ") + " руб." if total else "по согласованию"

            # Словарь замен
            today = datetime.now().strftime("%d.%m.%Y")
            replacements = {
                "{{date}}": today,
                "{{project_name}}": proj["name"] or "",
                "{{project_total}}": total_str,
                "{{project_duration}}": proj["project_duration"] or "по согласованию",
                "{{client_name}}": proj["client_name"] or "",
                "{{client_phone}}": proj["client_phone"] or "",
                "{{client_email}}": proj["client_email"] or "",
                "{{client_company}}": proj["client_company"] or "",
                "{{client_inn}}": proj["client_inn"] or "",
                "{{client_ogrn}}": proj["client_ogrn"] or "",
                "{{client_kpp}}": proj["client_kpp"] or "",
                "{{client_legal_address}}": proj["client_legal_address"] or "",
                "{{client_bank_name}}": proj["client_bank_name"] or "",
                "{{client_bik}}": proj["client_bik"] or "",
                "{{client_checking_account}}": proj["client_checking_account"] or "",
                "{{client_corr_account}}": proj["client_corr_account"] or "",
                "{{designer_name}}": settings.get("company_name") or settings.get("full_name") or "",
                "{{designer_inn}}": settings.get("inn") or "",
                "{{designer_ogrn}}": settings.get("ogrn") or "",
                "{{designer_kpp}}": settings.get("kpp") or "",
                "{{designer_legal_address}}": settings.get("legal_address") or "",
                "{{designer_bank_name}}": settings.get("bank_name") or "",
                "{{designer_bik}}": settings.get("bik") or "",
                "{{designer_checking_account}}": settings.get("checking_account") or "",
                "{{designer_corr_account}}": settings.get("corr_account") or "",
                "{{designer_phone}}": settings.get("phone") or "",
                "{{designer_email}}": settings.get("email") or "",
            }

            # Подставляем переменные
            text = template_text
            for key, val in replacements.items():
                text = text.replace(key, val)

            # Генерируем docx через python-docx
            from docx import Document
            from docx.shared import Pt, Cm
            from docx.enum.text import WD_ALIGN_PARAGRAPH

            doc = Document()

            # Настройка полей
            section = doc.sections[0]
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(1.5)
            section.top_margin = Cm(2)
            section.bottom_margin = Cm(2)

            # Стиль по умолчанию
            style = doc.styles["Normal"]
            style.font.name = "Times New Roman"
            style.font.size = Pt(12)

            for line in text.split("\n"):
                p = doc.add_paragraph(line)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.space_before = Pt(0)
                # Заголовки разделов — жирный
                if re.match(r"^\d+\.\s+[А-ЯЁ\s]+$", line.strip()):
                    for run in p.runs:
                        run.bold = True
                # Первая строка с ДОГОВОР — по центру, жирный
                if "ДОГОВОР ОКАЗАНИЯ" in line:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for run in p.runs:
                        run.bold = True

            # Сохраняем в байты
            buf = io.BytesIO()
            doc.save(buf)
            buf.seek(0)
            docx_bytes = buf.read()

            # Загружаем в S3
            s3 = get_s3()
            filename = f"docs/contract_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
            s3.put_object(
                Bucket="files",
                Key=filename,
                Body=docx_bytes,
                ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"

            return json_resp({"ok": True, "url": cdn_url})

        return json_resp({"ok": False, "error": "Unknown action"}, 400)

    finally:
        conn.close()
