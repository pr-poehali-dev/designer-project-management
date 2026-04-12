"""Генерация PDF коммерческого предложения (ReportLab)."""
import json
import os
import uuid
import io
import urllib.request
from datetime import datetime

import psycopg2
import psycopg2.extras
import boto3

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# Шрифты хранятся в S3, загружаются один раз в /tmp
_FONT_S3_KEYS = {
    "DejaVu":      "fonts/DejaVuSans.ttf",
    "DejaVu-Bold": "fonts/DejaVuSans-Bold.ttf",
}
_FONT_CDN_URLS = {
    "DejaVu":      "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf",
    "DejaVu-Bold": "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf",
}
_fonts_registered = False


def _load_font_bytes(name: str) -> bytes:
    """Пробует загрузить шрифт: сначала из S3, потом из CDN, кешируя в /tmp."""
    cache_path = f"/tmp/{name}.ttf"
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 100_000:
        with open(cache_path, "rb") as f:
            return f.read()

    # Сначала попробуем S3
    try:
        s3 = get_s3()
        obj = s3.get_object(Bucket="files", Key=_FONT_S3_KEYS[name])
        data = obj["Body"].read()
        if len(data) > 100_000:
            with open(cache_path, "wb") as f:
                f.write(data)
            return data
    except Exception:
        pass

    # Потом CDN
    url = _FONT_CDN_URLS[name]
    req = urllib.request.Request(url, headers={"User-Agent": "pdf-generator/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()

    # Сохраняем в S3 для будущих вызовов
    try:
        s3 = get_s3()
        s3.put_object(Bucket="files", Key=_FONT_S3_KEYS[name], Body=data, ContentType="font/ttf")
    except Exception:
        pass

    with open(cache_path, "wb") as f:
        f.write(data)
    return data


_font_errors = []


def ensure_fonts():
    global _fonts_registered, _font_errors
    if _fonts_registered:
        return
    for name in _FONT_S3_KEYS:
        try:
            data = _load_font_bytes(name)
            pdfmetrics.registerFont(TTFont(name, io.BytesIO(data)))
            _font_errors.append(f"{name}:ok:{len(data)}")
        except Exception as e:
            _font_errors.append(f"{name}:fail:{str(e)[:120]}")
    _fonts_registered = True


def F(bold=False) -> str:
    name = "DejaVu-Bold" if bold else "DejaVu"
    try:
        pdfmetrics.getFont(name)
        return name
    except Exception:
        return "Helvetica-Bold" if bold else "Helvetica"


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

INK       = colors.HexColor("#111111")
INK_MID   = colors.HexColor("#555555")
INK_FAINT = colors.HexColor("#999999")
SNOW      = colors.HexColor("#F5F5F5")
WHITE     = colors.white
RED       = colors.HexColor("#DC2626")


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3", endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def fetch_project(project_id: int) -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT p.*, c.name as client_name, c.phone as client_phone,
                   c.email as client_email, c.contact_person as client_contact
            FROM projects p LEFT JOIN clients c ON c.id = p.client_id
            WHERE p.id = %s
        """, (project_id,))
        project = dict(cur.fetchone() or {})
        cur.execute(
            "SELECT * FROM work_items WHERE project_id = %s AND sort_order >= 0 ORDER BY sort_order, id",
            (project_id,)
        )
        project["work_items"] = [dict(r) for r in cur.fetchall()]
        return project
    finally:
        conn.close()


def fetch_company() -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM company_info ORDER BY id LIMIT 1")
        row = cur.fetchone()
        return dict(row) if row else {}
    finally:
        conn.close()


def fetch_logo(url: str):
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        buf = io.BytesIO(data)
        img = Image(buf)
        max_w, max_h = 45 * mm, 18 * mm
        ratio = img.imageWidth / max(img.imageHeight, 1)
        if img.imageWidth > max_w:
            img.drawWidth = max_w
            img.drawHeight = max_w / ratio
        if img.drawHeight > max_h:
            img.drawHeight = max_h
            img.drawWidth = max_h * ratio
        return img
    except Exception:
        return None


def fmt_money(val) -> str:
    try:
        v = float(val)
        s = f"{int(v):,}".replace(",", "\u202f") if v == int(v) else f"{v:,.2f}".replace(",", "\u202f")
        return s + "\u202f\u20bd"
    except Exception:
        return str(val) + " \u20bd"


def fmt_qty(val) -> str:
    try:
        v = float(val)
        return str(int(v)) if v == int(v) else str(round(v, 2))
    except Exception:
        return str(val)


def build_pdf(project: dict, company: dict) -> bytes:
    ensure_fonts()

    buf = io.BytesIO()
    W, H = A4
    margin = 20 * mm

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=margin, rightMargin=margin,
        topMargin=14 * mm, bottomMargin=14 * mm,
    )

    usable_w = W - 2 * margin

    def ps(name, **kw):
        defaults = dict(fontName=F(), fontSize=9, leading=13, textColor=INK)
        defaults.update(kw)
        return ParagraphStyle(name, **defaults)

    story = []

    # ── HEADER ──────────────────────────────────────────────────────────────
    company_name = company.get("company_name") or "Ваша компания"
    logo_img = fetch_logo(company.get("logo_url") or "")
    date_str = datetime.now().strftime("%d.%m.%Y")

    contacts = []
    if company.get("contact_phone"):
        contacts.append(company["contact_phone"])
    if company.get("contact_email"):
        contacts.append(company["contact_email"])
    if company.get("legal_address"):
        contacts.append(company["legal_address"])

    left_cell = []
    if logo_img:
        left_cell.append(logo_img)
        left_cell.append(Spacer(1, 5))
    left_cell.append(Paragraph(company_name, ps("cn", fontName=F(True), fontSize=14, leading=17)))
    for c in contacts:
        left_cell.append(Paragraph(c, ps("cc", fontSize=8, textColor=INK_MID, leading=12)))

    right_cell = [
        Paragraph("ДОКУМЕНТ", ps("dl", fontName=F(True), fontSize=7, textColor=INK_FAINT, alignment=TA_RIGHT)),
        Paragraph(date_str, ps("dv", fontSize=9, textColor=INK_MID, alignment=TA_RIGHT)),
    ]

    hdr = Table([[left_cell, right_cell]], colWidths=[usable_w * 0.72, usable_w * 0.28])
    hdr.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=2, color=INK, spaceAfter=18))

    # ── TITLE ───────────────────────────────────────────────────────────────
    project_name = project.get("name") or "Коммерческое предложение"
    client_name = project.get("client_name") or ""
    client_contact = project.get("client_contact") or ""
    to_parts = [p for p in [client_name, client_contact if client_contact != client_name else ""] if p]
    to_line = ", ".join(to_parts)

    title_left = [
        Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", ps("kl", fontName=F(True), fontSize=7, textColor=INK_FAINT, leading=10)),
        Spacer(1, 5),
        Paragraph(project_name, ps("kv", fontName=F(True), fontSize=17, leading=21)),
    ]

    if to_line:
        title_right = [
            Paragraph("ДЛЯ", ps("fl", fontName=F(True), fontSize=7, textColor=INK_FAINT, leading=10, alignment=TA_RIGHT)),
            Spacer(1, 5),
            Paragraph(to_line, ps("fv", fontName=F(True), fontSize=12, leading=15, alignment=TA_RIGHT)),
        ]
        title_tbl = Table([[title_left, title_right]], colWidths=[usable_w * 0.6, usable_w * 0.4])
        title_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, -1), SNOW),
            ("LEFTPADDING", (0, 0), (0, 0), 18),
            ("RIGHTPADDING", (1, 0), (1, 0), 18),
            ("TOPPADDING", (0, 0), (-1, -1), 16),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ]))
    else:
        title_tbl = Table([[title_left]], colWidths=[usable_w])
        title_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SNOW),
            ("LEFTPADDING", (0, 0), (0, 0), 18),
            ("TOPPADDING", (0, 0), (-1, -1), 16),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
        ]))

    story.append(title_tbl)
    story.append(Spacer(1, 22))

    # ── ESTIMATE ────────────────────────────────────────────────────────────
    story.append(Paragraph("СОСТАВ РАБОТ", ps("el", fontName=F(True), fontSize=7, textColor=INK_FAINT, leading=10)))
    story.append(Spacer(1, 8))

    items = project.get("work_items", [])
    subtotal = sum(float(i["quantity"]) * float(i["price"]) for i in items)
    discount_pct = float(project.get("discount_percent") or 0)
    discount_val = subtotal * discount_pct / 100
    total = subtotal - discount_val

    c0 = 18    # #
    c2 = 38    # кол-во
    c3 = 28    # ед.
    c4 = 68    # цена
    c5 = 78    # сумма
    c1 = usable_w - c0 - c2 - c3 - c4 - c5  # название
    col_w = [c0, c1, c2, c3, c4, c5]

    def th(text, align=TA_CENTER):
        return Paragraph(text, ps("th", fontName=F(True), fontSize=8, textColor=WHITE, alignment=align))

    data = [[th("#"), th("Наименование", TA_CENTER), th("Кол"), th("Ед."), th("Цена", TA_RIGHT), th("Сумма", TA_RIGHT)]]

    def td(text, align=TA_CENTER, bold=False, color=INK_MID):
        return Paragraph(text, ps("td", fontName=F(bold), fontSize=9, textColor=color, alignment=align))

    for idx, item in enumerate(items, 1):
        qty = float(item["quantity"])
        price = float(item["price"])
        amount = qty * price
        data.append([
            Paragraph(str(idx), ps("tn", fontSize=8, textColor=INK_FAINT)),
            Paragraph(item["name"], ps("tm")),
            td(fmt_qty(qty)),
            td(item.get("unit", "шт")),
            td(fmt_money(price), TA_RIGHT),
            td(fmt_money(amount), TA_RIGHT, bold=True, color=INK),
        ])

    est_tbl = Table(data, colWidths=col_w, repeatRows=1)
    row_count = len(data)
    est_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, row_count - 1), [WHITE, SNOW]),
        ("LINEBELOW", (0, 1), (-1, row_count - 1), 0.5, colors.HexColor("#EBEBEB")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(est_tbl)

    # Итоги
    def tr(text, bold=False, color=INK_MID, size=9):
        return Paragraph(text, ps("tr", fontName=F(bold), fontSize=size, textColor=color, alignment=TA_RIGHT))

    tot_rows = []
    tot_rows.append(["", "", "", "", tr("Подитого"), tr(fmt_money(subtotal))])
    if discount_pct > 0:
        disc_label = f"Скидка {int(discount_pct) if discount_pct == int(discount_pct) else discount_pct}%"
        tot_rows.append(["", "", "", "", tr(disc_label, color=RED), tr("\u2212" + fmt_money(discount_val), color=RED)])
    tot_rows.append(["", "", "", "", tr("Итого к оплате", bold=True, color=INK, size=12), tr(fmt_money(total), bold=True, color=INK, size=13)])

    tot_tbl = Table(tot_rows, colWidths=col_w)
    n = len(tot_rows)
    tot_tbl.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 2, INK),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEABOVE", (0, n - 1), (-1, n - 1), 0.5, colors.HexColor("#E0E0E0")),
        ("TOPPADDING", (0, n - 1), (-1, n - 1), 10),
        ("BOTTOMPADDING", (0, n - 1), (-1, n - 1), 10),
    ]))
    story.append(tot_tbl)

    # ── FOOTER ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 26))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0E0E0"), spaceAfter=10))

    note = "Предложение действительно 30 дней с даты составления. Стоимость работ может быть скорректирована после детального обсуждения."
    ft = Table(
        [[Paragraph(note, ps("fn", fontSize=8, textColor=INK_FAINT, leading=12)),
          Paragraph(f"от {date_str}", ps("fd", fontSize=8, textColor=INK_FAINT, leading=12, alignment=TA_RIGHT))]],
        colWidths=[usable_w * 0.65, usable_w * 0.35]
    )
    ft.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(ft)

    doc.build(story)
    return buf.getvalue()


def handler(event: dict, context) -> dict:
    """Генерация PDF коммерческого предложения по project_id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    project_id = params.get("project_id")

    if not project_id:
        return {"statusCode": 400, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": False, "error": "project_id required"})}

    project = fetch_project(int(project_id))
    company = fetch_company()

    pdf_bytes = build_pdf(project, company)

    key = f"proposals/kp_{project_id}_{uuid.uuid4().hex[:8]}.pdf"
    s3 = get_s3()
    s3.put_object(
        Bucket="files", Key=key, Body=pdf_bytes,
        ContentType="application/pdf", ACL="public-read",
    )
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    pdf_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200, "headers": CORS_HEADERS,
        "body": json.dumps({"ok": True, "url": pdf_url}),
    }