"""Resend transactional email sender for Aiel Design & Printing Studio."""
import asyncio
import base64
import logging
import os
from typing import Optional

import resend

logger = logging.getLogger(__name__)

SHOP_NAME = "Aiel Design & Printing Studio"
SHOP_PHONE = "+91 91502 34277"
SHOP_EMAIL_REPLY = "aielenterprises3321@gmail.com"


def _configured() -> bool:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    if not key:
        return False
    resend.api_key = key
    return True


def _invoice_html(order: dict) -> str:
    short = order["id"][:6].upper()
    items_rows = ""
    for it in order.get("items", []):
        line = it["unit_price"] * it["quantity"]
        items_rows += (
            "<tr>"
            f"<td style='padding:8px;border-bottom:1px solid #eee;font-size:13px'>{it['product_name']}<br/>"
            f"<span style='color:#888;font-size:11px'>{it.get('color','')} / {it.get('size','')} / {it.get('print_area','')}</span></td>"
            f"<td style='padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:center'>{it['quantity']}</td>"
            f"<td style='padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:right'>Rs. {line:.0f}</td>"
            "</tr>"
        )
    total = float(order.get("total_amount", 0))
    return f"""
<!doctype html><html><body style='font-family:Helvetica,Arial,sans-serif;background:#fafafa;margin:0;padding:24px'>
  <table width='100%' cellpadding='0' cellspacing='0' style='max-width:600px;margin:0 auto;background:white;border:1px solid #eee'>
    <tr>
      <td style='padding:24px;border-bottom:4px solid #FF1F8F'>
        <table width='100%'><tr>
          <td style='font-size:22px;font-weight:bold;color:#0A0A0A;letter-spacing:1px'>AIEL DESIGN &amp; PRINTING</td>
          <td style='text-align:right;font-size:12px;color:#999'>Invoice #{short}</td>
        </tr></table>
        <div style='height:6px;margin-top:10px'>
          <span style='display:inline-block;width:14px;height:6px;background:#00B4FF'></span>
          <span style='display:inline-block;width:14px;height:6px;background:#FF1F8F'></span>
          <span style='display:inline-block;width:14px;height:6px;background:#FFC400'></span>
          <span style='display:inline-block;width:14px;height:6px;background:#0A0A0A'></span>
        </div>
      </td>
    </tr>
    <tr><td style='padding:24px;font-size:14px;color:#222;line-height:1.5'>
      Hi <strong>{order.get('customer_name','')}</strong>,<br/><br/>
      Great news — your order <strong>#{short}</strong> has shipped. The full GST invoice is attached as a PDF.<br/><br/>
      Reply to this email or WhatsApp us at <strong>{SHOP_PHONE}</strong> if you need anything.
    </td></tr>
    <tr><td style='padding:0 24px 24px'>
      <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #eee;border-collapse:collapse'>
        <thead><tr style='background:#0A0A0A;color:white;font-size:11px;letter-spacing:1px'>
          <th style='padding:10px;text-align:left'>ITEM</th>
          <th style='padding:10px;text-align:center'>QTY</th>
          <th style='padding:10px;text-align:right'>AMOUNT</th>
        </tr></thead>
        <tbody>{items_rows}</tbody>
        <tfoot><tr>
          <td colspan='2' style='padding:14px;text-align:right;font-size:13px;color:#555'>Total Payable</td>
          <td style='padding:14px;text-align:right;font-size:18px;font-weight:bold;color:#FF1F8F'>Rs. {total:.0f}</td>
        </tr></tfoot>
      </table>
    </td></tr>
    <tr><td style='padding:18px 24px;background:#fafafa;color:#888;font-size:11px;text-align:center;border-top:1px solid #eee'>
      {SHOP_NAME} · Puducherry · GSTIN 34GIQPS9151C<br/>
      Reply to {SHOP_EMAIL_REPLY} · WhatsApp {SHOP_PHONE}
    </td></tr>
  </table>
</body></html>
"""


async def send_shipping_email(to_email: str, order: dict, pdf_bytes: bytes) -> Optional[str]:
    """Send a shipping notification email with the PDF invoice attached.

    Returns email_id on success, None if skipped (no API key configured or no email)."""
    to_email = (to_email or "").strip()
    if not to_email:
        logger.info("Email skip: no customer_email")
        return None
    if not _configured():
        logger.info("Email skip: RESEND_API_KEY not configured")
        return None

    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    short = order["id"][:6].upper()
    params = {
        "from": f"Aiel Design & Printing <{sender}>",
        "to": [to_email],
        "subject": f"Your Aiel order #{short} has shipped — invoice attached",
        "html": _invoice_html(order),
        "reply_to": SHOP_EMAIL_REPLY,
        "attachments": [{
            "filename": f"Aiel-Invoice-{short}.pdf",
            "content": list(pdf_bytes),  # Resend expects list of ints OR base64 string
            "content_type": "application/pdf",
        }],
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        eid = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info("Sent invoice email %s -> %s", eid, to_email)
        return eid
    except Exception as e:
        logger.error("Resend send failed: %s", e)
        return None
