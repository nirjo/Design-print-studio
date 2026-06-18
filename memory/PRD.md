# Aiel Design & Printing Studio — PRD

## Original Problem Statement
T-shirt printing shop website for "Aiel Design&Printing Studio" with 4 product lines:
1. Regular Round Neck (180 GSM Bio-Washed Cotton; Black/White/Navy/Maroon/Olive; ₹299–₹499)
2. Oversized T-Shirt (220–240 GSM, drop shoulder; Beige/Lavender/Coffee Brown/Black; ₹599–₹999)
3. Premium Polo T-Shirt (220 GSM corporate/school; ₹499–₹899)
4. Dry-Fit Sports T-Shirt (Polyester, team uniforms; ₹250–₹450)

Premium display, cart, print-on-demand flow, WhatsApp checkout to 9150234277, responsive, gallery + catalogue.

## User Personas
- **Retail customer** — wants a custom tee with a personal design, browses Shop and orders via WhatsApp.
- **Corporate / School buyer** — needs bulk polos or dry-fits, uses Contact bulk-quote form.
- **Sports team manager** — needs matching dry-fit kits with numbers/names.
- **Studio owner (Aiel)** — receives orders + enquiries on WhatsApp and in MongoDB.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). Routes under `/api`: GET `/products`, GET `/products/{id}`, GET `/gallery?category=`, POST `/orders`, GET `/orders`, POST `/contact`.
- **Frontend**: React 19 + React Router v7 + Tailwind + shadcn/ui + sonner + framer-motion + react-fast-marquee. Cart state in React Context + localStorage (`aiel_cart_v1`).
- **Theme**: Dark CMYK (cyan #00B4FF / magenta #FF1F8F / yellow #FFC400) on jet-black. Fonts: Anton (display), Bricolage Grotesque (body), Italianno (script).

## Tasks Done (2026-02)
- ✅ Backend API: products, gallery, orders (Mongo persisted), contact form
- ✅ Frontend Home: hero with brand nameboard, services marquee, featured products, value props, CTA
- ✅ Shop page with tagline filter
- ✅ Product Detail (color swatch, size, print area, qty, notes, add-to-cart + direct WhatsApp order)
- ✅ Cart drawer with qty edit, customer details, WhatsApp checkout (POST order then open wa.me)
- ✅ Gallery with category filter + lightbox
- ✅ Catalogue page with print-to-PDF stylesheet
- ✅ Contact page with API form + WhatsApp fallback
- ✅ Floating WhatsApp FAB on every page → wa.me/919150234277
- ✅ Tested: backend 8/8 + frontend 10/10 passing (iteration_1.json)

## Backlog (P0/P1/P2)
- **P1** Add product real photos / mockups when client supplies originals.
- **P1** Add design-upload field (image file → object storage) on Product Detail so artwork lands in the order payload.
- **P1** Admin dashboard (login) to manage products & gallery without code changes.
- **P2** Online payment (Razorpay/Stripe) as an alternative to WhatsApp checkout.
- **P2** PDF generation server-side (jsPDF or weasyprint) for a polished downloadable catalogue.
- **P2** SEO meta tags, OpenGraph image, sitemap.
- **P2** WhatsApp Business API automation (currently uses wa.me deep link).

## Next Actions
1. Capture/upload real Aiel product mockups to replace Unsplash placeholders.
2. Implement file upload for customer artwork (object storage integration).
3. Build admin panel for product/gallery CRUD.
