# Aiel Design & Printing Studio — PRD

## Original Problem Statement
T-shirt printing shop website for "Aiel Design&Printing Studio" with 4 product lines, gallery, downloadable catalogue, cart, WhatsApp checkout to 9150234277, responsive premium dark CMYK design.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), routes under `/api`.
  - Public: `/products`, `/products/{id}`, `/gallery`, `/orders`, `/contact`, `/upload`, `/files/{id}`
  - Auth: `/auth/session`, `/auth/me`, `/auth/logout` (Emergent OAuth)
  - Admin: `/admin/products [CRUD]`, `/admin/gallery [CRUD]`, `/admin/orders`, `/admin/contacts`, `/admin/generate-mockup` (Gemini Nano Banana)
- **Storage**: Emergent Object Storage helper (`storage.py`). Files served via `/api/files/{id}`.
- **Frontend**: React 19 + React Router v7. Pages: Home, Shop, ProductDetail, Gallery, Catalogue, Contact, Login, AuthCallback, Admin (protected).
- **Auth**: Emergent-managed Google OAuth, single-tenant via `ADMIN_EMAIL` env. Session cookie `session_token` (httpOnly, SameSite=None, 7-day TTL).
- **Theme**: Dark CMYK (cyan/magenta/yellow on jet-black). Fonts: Anton, Bricolage Grotesque, Italianno.

## Tasks Done (2026-02)
- ✅ Public site: hero, shop, product detail, gallery, catalogue, contact, WhatsApp FAB
- ✅ Cart with WhatsApp checkout, MongoDB persistence, customer email field
- ✅ Customer artwork upload (25 MB) via Emergent Object Storage
- ✅ Real Aiel-branded product mockups generated via Gemini Nano Banana
- ✅ Admin dashboard: Products CRUD, Gallery CRUD, Orders viewer, Contacts viewer, Reviews viewer
- ✅ Admin one-click AI mockup generation
- ✅ Emergent Google OAuth + ProtectedRoute + RBAC
- ✅ Order status workflow (pending → in_print → shipped → delivered + cancelled) with one-click WhatsApp notify + history
- ✅ Customer order tracking page with stage timeline + history
- ✅ Auto-generated PDF invoice (reportlab) with phone-gated public link
- ✅ Customer review collection (5★ + photo + showcase opt-in) auto-promoted to Home reviews section
- ✅ Auto-email PDF invoice on `shipped` status (Resend); manual "Email" button in admin
- ✅ Tested across iterations 1 + 2

## Backlog
- **P1** Multi-admin support
- **P1** Razorpay / Stripe for INR online payments
- **P2** Resend API key wiring (currently env var is empty — system gracefully skips emails until user adds the key)
- **P2** Server-generated PDF for downloadable catalogue
- **P2** SEO / OG meta tags, sitemap

## Next Actions
1. Ask user to paste their `RESEND_API_KEY` so the email send actually fires (currently the system reports `email_status: not_configured`)
2. Multi-admin support
3. Razorpay for INR online payments

## User Personas
- Retail customer (browse + WhatsApp order)
- Bulk / corporate / sports team buyer (Contact form)
- Studio admin (Aiel) — single Gmail login → admin dashboard

## Backlog
- **P1** Multi-admin roles (manager / printer staff)
- **P1** Order status workflow (pending → in-print → shipped → delivered) + WhatsApp customer notifications
- **P2** Online payments (Razorpay / Stripe)
- **P2** Server-generated PDF catalogue (weasyprint)
- **P2** Image color quantization preview (show artwork in chosen tee color)
- **P2** SEO / OG meta tags, sitemap

## Next Actions
1. Order status updates + WhatsApp notifications on status change
2. Add multi-admin support so studio staff can also use the dashboard
3. Online payment integration (Razorpay for INR)
