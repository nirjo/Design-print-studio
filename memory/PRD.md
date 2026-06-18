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
- ✅ Cart with WhatsApp checkout, MongoDB persistence
- ✅ Customer artwork upload (up to 25 MB) via Emergent Object Storage — artwork URL attached to cart line and WhatsApp order message
- ✅ Real Aiel-branded product mockups generated via Gemini Nano Banana for all 4 SKUs (replacing Unsplash placeholders)
- ✅ Admin dashboard: Products CRUD, Gallery CRUD, Orders viewer, Contacts viewer
- ✅ Admin one-click AI mockup generation in product editor (Nano Banana)
- ✅ Emergent Google OAuth + ProtectedRoute + RBAC (is_admin gated by ADMIN_EMAIL)
- ✅ Tested: iteration_1 (10/10 frontend, 8/8 backend) + iteration_2 (4/4 frontend, 23/23 backend)

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
