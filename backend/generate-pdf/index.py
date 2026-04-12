"""Генерация PDF коммерческого предложения (ReportLab) — 3 стиля оформления."""
import json
import os
import uuid
import io
import urllib.request
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
import boto3

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect


_FONT_S3_KEYS = {
    "DejaVu":      "fonts/DejaVuSans.ttf",
    "DejaVu-Bold": "fonts/DejaVuSans-Bold.ttf",
}
_FONT_CDN_URLS = {
    "DejaVu":      "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf",
    "DejaVu-Bold": "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf",
}
_fonts_ok = False

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

W, H = A4
MARGIN = 20 * mm
USABLE = W - 2 * MARGIN


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3", endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def _load_font(name: str) -> bytes:
    cache = f"/tmp/{name}.ttf"
    if os.path.exists(cache) and os.path.getsize(cache) > 100_000:
        with open(cache, "rb") as f:
            return f.read()
    try:
        obj = get_s3().get_object(Bucket="files", Key=_FONT_S3_KEYS[name])
        data = obj["Body"].read()
        if len(data) > 100_000:
            with open(cache, "wb") as f:
                f.write(data)
            return data
    except Exception:
        pass
    url = _FONT_CDN_URLS[name]
    req = urllib.request.Request(url, headers={"User-Agent": "pdf/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
    try:
        get_s3().put_object(Bucket="files", Key=_FONT_S3_KEYS[name], Body=data, ContentType="font/ttf")
    except Exception:
        pass
    with open(cache, "wb") as f:
        f.write(data)
    return data


def ensure_fonts():
    global _fonts_ok
    if _fonts_ok:
        return
    for name in _FONT_S3_KEYS:
        try:
            pdfmetrics.registerFont(TTFont(name, io.BytesIO(_load_font(name))))
        except Exception:
            pass
    _fonts_ok = True


def F(bold=False) -> str:
    n = "DejaVu-Bold" if bold else "DejaVu"
    try:
        pdfmetrics.getFont(n)
        return n
    except Exception:
        return "Helvetica-Bold" if bold else "Helvetica"


def fetch_project(pid: int) -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT p.*, c.name as client_name, c.phone as client_phone,
                   c.email as client_email, c.contact_person as client_contact
            FROM projects p LEFT JOIN clients c ON c.id = p.client_id WHERE p.id = %s
        """, (pid,))
        p = dict(cur.fetchone() or {})
        cur.execute("SELECT * FROM work_items WHERE project_id = %s AND sort_order >= 0 ORDER BY sort_order, id", (pid,))
        p["work_items"] = [dict(r) for r in cur.fetchall()]
        return p
    finally:
        conn.close()


def fetch_company() -> dict:
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM company_info ORDER BY id LIMIT 1")
        return dict(cur.fetchone() or {})
    finally:
        conn.close()


def fetch_logo(url: str, max_w=45, max_h=18):
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
        img = Image(io.BytesIO(data))
        mw, mh = max_w * mm, max_h * mm
        ratio = img.imageWidth / max(img.imageHeight, 1)
        img.drawWidth = min(mw, img.imageWidth)
        img.drawHeight = img.drawWidth / ratio
        if img.drawHeight > mh:
            img.drawHeight = mh
            img.drawWidth = mh * ratio
        return img
    except Exception:
        return None


def fm(val) -> str:
    try:
        v = float(val)
        s = f"{int(v):,}".replace(",", "\u202f") if v == int(v) else f"{v:,.2f}".replace(",", "\u202f")
        return s + "\u202f\u20bd"
    except Exception:
        return str(val)


def fq(val) -> str:
    try:
        v = float(val)
        return str(int(v)) if v == int(v) else str(round(v, 2))
    except Exception:
        return str(val)


def ps(name, **kw):
    d = dict(fontName=F(), fontSize=9, leading=13, textColor=colors.HexColor("#111111"))
    d.update(kw)
    return ParagraphStyle(name, **d)


def color_block(w, h, c):
    d = Drawing(w, h)
    d.add(Rect(0, 0, w, h, fillColor=c, strokeColor=None))
    return d


# ═══════════════════════════════════════════════════════════════════════════════
# СТИЛЬ 1: МИНИМАЛ (чёрно-белый строгий)
# ═══════════════════════════════════════════════════════════════════════════════
def build_minimal(project, company, intro):
    INK = colors.HexColor("#111")
    MID = colors.HexColor("#555")
    FNT = colors.HexColor("#999")
    SNOW = colors.HexColor("#F5F5F5")
    RED = colors.HexColor("#DC2626")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=14*mm, bottomMargin=14*mm)
    story = []

    company_name = company.get("company_name") or ""
    logo = fetch_logo(company.get("logo_url") or "")
    date_str = datetime.now().strftime("%d.%m.%Y")
    contacts = [c for c in [company.get("contact_phone"), company.get("contact_email"), company.get("legal_address")] if c]

    left = []
    if logo:
        left += [logo, Spacer(1, 5)]
    left.append(Paragraph(company_name, ps("cn", fontName=F(True), fontSize=14, leading=17)))
    for c in contacts:
        left.append(Paragraph(c, ps("cc", fontSize=8, textColor=MID, leading=11)))

    right = [Paragraph("ДОКУМЕНТ", ps("dl", fontName=F(True), fontSize=7, textColor=FNT, alignment=TA_RIGHT)),
             Paragraph(date_str, ps("dv", fontSize=9, textColor=MID, alignment=TA_RIGHT))]

    hdr = Table([[left, right]], colWidths=[USABLE*0.72, USABLE*0.28])
    hdr.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("ALIGN",(1,0),(1,0),"RIGHT")]))
    story += [hdr, HRFlowable(width="100%", thickness=2, color=INK, spaceAfter=18)]

    pn = project.get("name") or "Коммерческое предложение"
    cn = project.get("client_name") or ""

    tl = [Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", ps("kl", fontName=F(True), fontSize=7, textColor=FNT)),
          Spacer(1, 5), Paragraph(pn, ps("kv", fontName=F(True), fontSize=17, leading=21))]
    if cn:
        tr_ = [Paragraph("ДЛЯ", ps("fl", fontName=F(True), fontSize=7, textColor=FNT, alignment=TA_RIGHT)),
               Spacer(1, 5), Paragraph(cn, ps("fv", fontName=F(True), fontSize=12, leading=15, alignment=TA_RIGHT))]
        tt = Table([[tl, tr_]], colWidths=[USABLE*0.6, USABLE*0.4])
        tt.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BACKGROUND",(0,0),(-1,-1),SNOW),
                                ("LEFTPADDING",(0,0),(0,0),18),("RIGHTPADDING",(1,0),(1,0),18),
                                ("TOPPADDING",(0,0),(-1,-1),16),("BOTTOMPADDING",(0,0),(-1,-1),16)]))
    else:
        tt = Table([[tl]], colWidths=[USABLE])
        tt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),SNOW),("LEFTPADDING",(0,0),(0,0),18),
                                ("TOPPADDING",(0,0),(-1,-1),16),("BOTTOMPADDING",(0,0),(-1,-1),16)]))
    story += [tt, Spacer(1, 16)]

    if intro:
        story += [Paragraph(intro, ps("intro", fontSize=10, leading=16, textColor=MID)), Spacer(1, 16)]

    story += [Paragraph("СОСТАВ РАБОТ", ps("el", fontName=F(True), fontSize=7, textColor=FNT)), Spacer(1, 8)]
    story += _build_table(project, INK, MID, FNT, SNOW, RED)
    story += _build_footer(date_str, FNT)

    doc.build(story)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════════════════
# СТИЛЬ 2: КОРПОРАТИВНЫЙ (с цветным хедером)
# ═══════════════════════════════════════════════════════════════════════════════
def build_corporate(project, company, intro):
    ACCENT = colors.HexColor("#1E3A5F")
    ACCENT_L = colors.HexColor("#2B5580")
    LIGHT = colors.HexColor("#EDF2F7")
    MID = colors.HexColor("#4A5568")
    FNT = colors.HexColor("#A0AEC0")
    RED = colors.HexColor("#E53E3E")
    WHT = colors.white

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=0, bottomMargin=14*mm)
    story = []

    company_name = company.get("company_name") or ""
    logo = fetch_logo(company.get("logo_url") or "", max_w=50, max_h=20)
    date_str = datetime.now().strftime("%d.%m.%Y")
    contacts = [c for c in [company.get("contact_phone"), company.get("contact_email"), company.get("legal_address")] if c]

    header_content = []
    if logo:
        header_content += [logo, Spacer(1, 6)]
    header_content.append(Paragraph(company_name, ps("cn2", fontName=F(True), fontSize=16, textColor=WHT, leading=20)))
    for c in contacts:
        header_content.append(Paragraph(c, ps("cc2", fontSize=8, textColor=colors.HexColor("#B0C4DE"), leading=11)))

    date_content = [Paragraph(date_str, ps("dt2", fontName=F(True), fontSize=10, textColor=WHT, alignment=TA_RIGHT)),
                    Spacer(1, 4),
                    Paragraph("КОММЕРЧЕСКОЕ<br/>ПРЕДЛОЖЕНИЕ", ps("kp2", fontName=F(True), fontSize=8, textColor=colors.HexColor("#B0C4DE"), alignment=TA_RIGHT, leading=11))]

    hdr = Table([[header_content, date_content]], colWidths=[USABLE*0.65, USABLE*0.35])
    hdr.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("ALIGN",(1,0),(1,0),"RIGHT"),
        ("BACKGROUND",(0,0),(-1,-1),ACCENT),
        ("LEFTPADDING",(0,0),(0,0),24),("RIGHTPADDING",(1,0),(1,0),24),
        ("TOPPADDING",(0,0),(-1,-1),24),("BOTTOMPADDING",(0,0),(-1,-1),24),
    ]))

    full_hdr = Table([[hdr]], colWidths=[USABLE + 2*MARGIN])
    full_hdr.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    story += [full_hdr, Spacer(1, 20)]

    pn = project.get("name") or "Проект"
    cn = project.get("client_name") or ""

    story.append(Paragraph(pn, ps("pn2", fontName=F(True), fontSize=18, leading=22, textColor=ACCENT)))
    if cn:
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Подготовлено для: {cn}", ps("for2", fontSize=11, textColor=MID)))
    story.append(Spacer(1, 16))

    if intro:
        story += [Paragraph(intro, ps("intro2", fontSize=10, leading=16, textColor=MID)), Spacer(1, 16)]

    story += [Paragraph("СОСТАВ РАБОТ И СТОИМОСТЬ", ps("el2", fontName=F(True), fontSize=8, textColor=FNT, leading=10)), Spacer(1, 8)]
    story += _build_table(project, ACCENT, MID, FNT, LIGHT, RED, header_bg=ACCENT)
    story += _build_footer(date_str, FNT)

    doc.build(story)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════════════════
# СТИЛЬ 3: ПРЕЗЕНТАЦИОННЫЙ (с акцентным блоком)
# ═══════════════════════════════════════════════════════════════════════════════
def build_presentation(project, company, intro):
    ACCENT = colors.HexColor("#7C3AED")
    ACCENT_L = colors.HexColor("#EDE9FE")
    MID = colors.HexColor("#4B5563")
    FNT = colors.HexColor("#9CA3AF")
    RED = colors.HexColor("#EF4444")
    WHT = colors.white

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=14*mm, bottomMargin=14*mm)
    story = []

    company_name = company.get("company_name") or ""
    logo = fetch_logo(company.get("logo_url") or "", max_w=40, max_h=16)
    date_str = datetime.now().strftime("%d.%m.%Y")
    contacts = [c for c in [company.get("contact_phone"), company.get("contact_email")] if c]

    left = []
    if logo:
        left += [logo, Spacer(1, 4)]
    left.append(Paragraph(company_name, ps("cn3", fontName=F(True), fontSize=13, leading=16)))
    contacts_str = "  |  ".join(contacts) if contacts else ""
    if contacts_str:
        left.append(Paragraph(contacts_str, ps("cc3", fontSize=8, textColor=FNT, leading=11)))

    hdr = Table([[left, [Paragraph(date_str, ps("dt3", fontSize=9, textColor=FNT, alignment=TA_RIGHT))]]], colWidths=[USABLE*0.7, USABLE*0.3])
    hdr.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("ALIGN",(1,0),(1,0),"RIGHT")]))
    story += [hdr, Spacer(1, 16)]

    pn = project.get("name") or "Коммерческое предложение"
    cn = project.get("client_name") or ""

    hero_content = []
    hero_content.append(Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", ps("kl3", fontName=F(True), fontSize=8, textColor=WHT, leading=10)))
    hero_content.append(Spacer(1, 8))
    hero_content.append(Paragraph(pn, ps("kv3", fontName=F(True), fontSize=20, textColor=WHT, leading=24)))
    if cn:
        hero_content.append(Spacer(1, 10))
        hero_content.append(Paragraph(f"Для {cn}", ps("for3", fontSize=12, textColor=colors.HexColor("#DDD6FE"))))

    hero = Table([[hero_content]], colWidths=[USABLE])
    hero.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),ACCENT),
        ("LEFTPADDING",(0,0),(-1,-1),28),("RIGHTPADDING",(0,0),(-1,-1),28),
        ("TOPPADDING",(0,0),(-1,-1),28),("BOTTOMPADDING",(0,0),(-1,-1),28),
        ("ROUNDEDCORNERS", [10, 10, 10, 10]),
    ]))
    story += [hero, Spacer(1, 20)]

    if intro:
        story += [Paragraph(intro, ps("intro3", fontSize=10, leading=16, textColor=MID)), Spacer(1, 16)]

    story += [Paragraph("ДЕТАЛИЗАЦИЯ", ps("el3", fontName=F(True), fontSize=8, textColor=ACCENT, leading=10)), Spacer(1, 8)]
    story += _build_table(project, ACCENT, MID, FNT, ACCENT_L, RED, header_bg=ACCENT)
    story += _build_footer(date_str, FNT)

    doc.build(story)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════════════════
# ОБЩИЕ КОМПОНЕНТЫ
# ═══════════════════════════════════════════════════════════════════════════════
def _build_table(project, INK, MID, FNT, SNOW, RED, header_bg=None):
    if header_bg is None:
        header_bg = INK
    items = project.get("work_items", [])
    subtotal = sum(float(i["quantity"]) * float(i["price"]) for i in items)
    disc_pct = float(project.get("discount_percent") or 0)
    disc_val = subtotal * disc_pct / 100
    total = subtotal - disc_val

    c0 = 18; c2 = 36; c3 = 26; c4 = 66; c5 = 76
    c1 = USABLE - c0 - c2 - c3 - c4 - c5
    cw = [c0, c1, c2, c3, c4, c5]

    WHT = colors.white
    def th(t, a=TA_CENTER):
        return Paragraph(t, ps("th", fontName=F(True), fontSize=8, textColor=WHT, alignment=a))
    def td(t, a=TA_CENTER, b=False, c=None):
        return Paragraph(t, ps("td", fontName=F(b), fontSize=9, textColor=c or MID, alignment=a))

    data = [[th("#"), th("Наименование", TA_CENTER), th("Кол"), th("Ед."), th("Цена", TA_RIGHT), th("Сумма", TA_RIGHT)]]
    for idx, item in enumerate(items, 1):
        q, p = float(item["quantity"]), float(item["price"])
        data.append([
            Paragraph(str(idx), ps("tn", fontSize=8, textColor=FNT)),
            Paragraph(item["name"], ps("tm")),
            td(fq(q)), td(item.get("unit", "шт")), td(fm(p), TA_RIGHT), td(fm(q*p), TA_RIGHT, True, INK),
        ])

    tbl = Table(data, colWidths=cw, repeatRows=1)
    rc = len(data)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),header_bg),
        ("ROWBACKGROUNDS",(0,1),(-1,rc-1),[colors.white, SNOW]),
        ("LINEBELOW",(0,1),(-1,rc-1),0.5,colors.HexColor("#E8E8E8")),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))

    def tr(t, b=False, c=None, s=9):
        return Paragraph(t, ps("tr", fontName=F(b), fontSize=s, textColor=c or MID, alignment=TA_RIGHT))

    vat_mode = project.get("vat_mode", "none")
    vat_rate = float(project.get("vat_rate") or 20)
    after_disc = subtotal - disc_val
    vat_amt = after_disc * vat_rate / 100 if vat_mode == "added" else (after_disc - after_disc / (1 + vat_rate / 100) if vat_mode == "included" else 0)
    grand_total = after_disc + vat_amt if vat_mode == "added" else after_disc

    tots = [["","","","", tr("Итого"), tr(fm(subtotal))]]
    if disc_pct > 0:
        dl = f"Скидка {int(disc_pct) if disc_pct == int(disc_pct) else disc_pct}%"
        tots.append(["","","","", tr(dl, c=RED), tr("\u2212"+fm(disc_val), c=RED)])
    if vat_mode == "included":
        tots.append(["","","","", tr(f"В т.ч. НДС {int(vat_rate)}%"), tr(fm(round(vat_amt)))])
    elif vat_mode == "added":
        tots.append(["","","","", tr(f"НДС {int(vat_rate)}%"), tr(fm(round(vat_amt)))])
    total_label = "Итого с НДС" if vat_mode == "added" else "Итого к оплате"
    tots.append(["","","","", tr(total_label, True, INK, 12), tr(fm(round(grand_total)), True, INK, 13)])

    tt = Table(tots, colWidths=cw)
    n = len(tots)
    tt.setStyle(TableStyle([
        ("LINEABOVE",(0,0),(-1,0),2,INK),
        ("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("LINEABOVE",(0,n-1),(-1,n-1),0.5,colors.HexColor("#E0E0E0")),
        ("TOPPADDING",(0,n-1),(-1,n-1),10),("BOTTOMPADDING",(0,n-1),(-1,n-1),10),
    ]))

    return [tbl, tt]


def _build_footer(date_str, FNT):
    note = "Предложение действительно 30 дней. Стоимость может быть скорректирована после детального обсуждения."
    valid = (datetime.now() + timedelta(days=30)).strftime("%d.%m.%Y")
    ft = Table(
        [[Paragraph(note, ps("fn", fontSize=8, textColor=FNT, leading=12)),
          Paragraph(f"Действительно до {valid}", ps("fd", fontSize=8, textColor=FNT, leading=12, alignment=TA_RIGHT))]],
        colWidths=[USABLE*0.65, USABLE*0.35]
    )
    ft.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
    return [Spacer(1, 26), HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0E0E0"), spaceAfter=10), ft]


BUILDERS = {
    "minimal": build_minimal,
    "corporate": build_corporate,
    "presentation": build_presentation,
}


def handler(event: dict, context) -> dict:
    """Генерация PDF коммерческого предложения: стиль minimal/corporate/presentation."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    ensure_fonts()

    params = event.get("queryStringParameters") or {}
    project_id = params.get("project_id")
    style = params.get("style", "minimal")

    if not project_id:
        return {"statusCode": 400, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": False, "error": "project_id required"})}

    body = {}
    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")
    intro = body.get("intro", "")

    project = fetch_project(int(project_id))
    company = fetch_company()

    builder = BUILDERS.get(style, build_minimal)
    pdf_bytes = builder(project, company, intro)

    key = f"proposals/kp_{project_id}_{uuid.uuid4().hex[:8]}.pdf"
    s3 = get_s3()
    s3.put_object(Bucket="files", Key=key, Body=pdf_bytes, ContentType="application/pdf", ACL="public-read")
    pdf_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        "statusCode": 200, "headers": CORS_HEADERS,
        "body": json.dumps({"ok": True, "url": pdf_url}),
    }