"""PDF invoice generator for Aiel orders using reportlab."""
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


SHOP = {
    "name": "Aiel Design & Printing Studio",
    "tagline": "Bring Your Ideas to Life",
    "phone": "+91 91502 34277",
    "email": "aielenterprises3321@gmail.com",
    "address": "Puducherry, India",
    "gst": "34GIQPS9151C",
}

CMYK_CYAN = colors.HexColor("#00B4FF")
CMYK_MAGENTA = colors.HexColor("#FF1F8F")
CMYK_YELLOW = colors.HexColor("#FFC400")
INK_DARK = colors.HexColor("#0A0A0A")


def generate_invoice_pdf(order: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=14 * mm, rightMargin=14 * mm,
        topMargin=14 * mm, bottomMargin=14 * mm,
        title=f"Invoice {order['id'][:6].upper()}"
    )
    styles = getSampleStyleSheet()
    LBL = ParagraphStyle("LBL", parent=styles["Normal"], fontSize=7, textColor=colors.grey, leading=10, alignment=0)
    VAL = ParagraphStyle("VAL", parent=styles["Normal"], fontSize=10, textColor=INK_DARK, leading=13)
    SMALL = ParagraphStyle("SMALL", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    story = []

    # ----- Header band -----
    header_data = [[
        Paragraph(f"<b>{SHOP['name']}</b><br/><font size=8 color='#666666'>{SHOP['tagline']}</font>", VAL),
        Paragraph(
            f"<para align=right><font size=22><b>INVOICE</b></font><br/>"
            f"<font size=9 color='#666666'>#{order['id'][:6].upper()}</font></para>",
            VAL,
        ),
    ]]
    htbl = Table(header_data, colWidths=[110 * mm, 70 * mm])
    htbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.5, CMYK_MAGENTA),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(htbl)
    story.append(Spacer(1, 8))

    # CMYK accent row
    accent = Table([[" ", " ", " ", " "]], colWidths=[8, 8, 8, 8], rowHeights=[6])
    accent.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), CMYK_CYAN),
        ("BACKGROUND", (1, 0), (1, 0), CMYK_MAGENTA),
        ("BACKGROUND", (2, 0), (2, 0), CMYK_YELLOW),
        ("BACKGROUND", (3, 0), (3, 0), INK_DARK),
    ]))
    story.append(accent)
    story.append(Spacer(1, 12))

    # ----- Meta -----
    created = order.get("created_at", "")
    if isinstance(created, datetime):
        created = created.isoformat()
    meta_data = [
        [Paragraph("FROM", LBL),
         Paragraph(f"<b>{SHOP['name']}</b><br/>{SHOP['address']}<br/>{SHOP['phone']}<br/>{SHOP['email']}<br/>GSTIN: {SHOP['gst']}", VAL),
         Paragraph("BILL TO", LBL),
         Paragraph(f"<b>{order.get('customer_name','')}</b><br/>{order.get('customer_phone','')}<br/>{order.get('delivery_address','') or '—'}", VAL)],
    ]
    meta_tbl = Table(meta_data, colWidths=[16 * mm, 70 * mm, 18 * mm, 78 * mm])
    meta_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_tbl)

    info_data = [[
        Paragraph(f"<font color='#666666' size=7>INVOICE DATE</font><br/>{str(created)[:10]}", VAL),
        Paragraph(f"<font color='#666666' size=7>STATUS</font><br/><b>{(order.get('status') or 'pending').upper()}</b>", VAL),
        Paragraph(f"<font color='#666666' size=7>CHANNEL</font><br/>{(order.get('channel') or 'whatsapp').upper()}", VAL),
    ]]
    info_tbl = Table(info_data, colWidths=[60 * mm, 60 * mm, 60 * mm])
    info_tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(Spacer(1, 8))
    story.append(info_tbl)
    story.append(Spacer(1, 14))

    # ----- Items table -----
    rows = [["#", "Item", "Color / Size / Print", "Qty", "Rate", "Amount"]]
    subtotal = 0
    for i, it in enumerate(order.get("items", []), start=1):
        line = it["unit_price"] * it["quantity"]
        subtotal += line
        rows.append([
            str(i),
            it["product_name"] + ("\n" + (it.get("notes") or "") if it.get("notes") else ""),
            f"{it.get('color','')} / {it.get('size','')} / {it.get('print_area','')}",
            str(it["quantity"]),
            f"Rs. {it['unit_price']:.0f}",
            f"Rs. {line:.0f}",
        ])

    items_tbl = Table(rows, colWidths=[10 * mm, 60 * mm, 50 * mm, 16 * mm, 22 * mm, 28 * mm], repeatRows=1)
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E5E5")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CCCCCC")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(items_tbl)

    # ----- Totals -----
    total = float(order.get("total_amount", subtotal))
    totals = Table([
        ["Subtotal", f"Rs. {subtotal:.0f}"],
        ["Total Payable", f"Rs. {total:.0f}"],
    ], colWidths=[40 * mm, 40 * mm], hAlign="RIGHT")
    totals.setStyle(TableStyle([
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -2), 9),
        ("FONTSIZE", (0, -1), (-1, -1), 13),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, INK_DARK),
        ("TEXTCOLOR", (-1, -1), (-1, -1), CMYK_MAGENTA),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(Spacer(1, 12))
    story.append(totals)

    # ----- Footer -----
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        f"<font color='#666666' size=8>Thank you for choosing {SHOP['name']}. "
        f"For any questions please WhatsApp us at {SHOP['phone']}. "
        f"Goods once printed cannot be returned unless defective.</font>",
        SMALL,
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"<font color='#999999' size=7>This is a computer-generated invoice. GSTIN: {SHOP['gst']}</font>",
        SMALL,
    ))

    doc.build(story)
    pdf = buf.getvalue()
    buf.close()
    return pdf
