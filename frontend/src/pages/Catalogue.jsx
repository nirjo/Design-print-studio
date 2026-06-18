import React, { useEffect, useState } from "react";
import axios from "axios";
import { Download, Printer, MessageCircle } from "lucide-react";
import { BRAND, buildWhatsAppLink } from "../lib/brand";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Catalogue() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API}/products`).then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const handlePrint = () => window.print();

  return (
    <div data-testid="catalogue-page" className="pt-24 md:pt-32 pb-16">
      <section className="max-w-6xl mx-auto px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 print:hidden">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cmyk-yellow mb-3">/ Catalogue 2026</div>
            <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9]">The <span className="text-cmyk-cyan">Lookbook</span></h1>
            <p className="mt-3 text-white/60 max-w-xl">Browse our full range. Tap "Save as PDF" in the print dialog to download an offline copy.</p>
          </div>
          <div className="flex gap-3">
            <button data-testid="catalogue-print-btn" onClick={handlePrint} className="inline-flex items-center gap-2 bg-cmyk-yellow text-black px-5 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white">
              <Printer size={16} /> Print / PDF
            </button>
            <a data-testid="catalogue-wa-btn" href={buildWhatsAppLink("Hi! Please share the latest Aiel printing catalogue.")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-whatsapp text-black px-5 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white">
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <article id="catalogue-sheet" className="bg-ink-surface border border-ink p-6 md:p-12 print:bg-white print:text-black print:border-0">
          <header className="flex items-center justify-between border-b border-ink print:border-black/30 pb-6">
            <div className="flex items-center gap-4">
              <img src={BRAND.assets.circular} alt="logo" className="h-16 w-16 object-cover rounded-full" />
              <div>
                <div className="font-display text-3xl tracking-wider">AIEL <span className="text-cmyk-magenta print:text-black">DESIGN & PRINTING</span></div>
                <div className="text-xs uppercase tracking-[0.25em] text-white/60 print:text-black/60">Studio · Puducherry · {BRAND.phone}</div>
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow print:text-black hidden md:block">Catalogue / 2026</div>
          </header>

          <h2 className="font-display text-4xl md:text-5xl mt-8 uppercase">T-Shirt Range</h2>
          <p className="text-white/65 print:text-black/70 text-sm max-w-2xl">From everyday basics to premium streetwear and team uniforms — printed in DTF, sublimation or vinyl as your design demands.</p>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p.id} className="border border-ink print:border-black/30 p-4 flex gap-4">
                <img src={p.image} alt={p.name} className="w-28 h-36 object-cover" />
                <div className="flex-1">
                  <div className="font-display text-xl uppercase leading-tight">{p.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-cmyk-yellow print:text-black/60">{p.tagline}</div>
                  <div className="text-xs text-white/70 print:text-black/80 mt-1">{p.fabric}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.colors.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider border border-ink print:border-black/30 px-1.5 py-0.5">
                        <span className="w-2.5 h-2.5 inline-block" style={{ background: p.color_hex?.[c] || "#888" }} /> {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-white/70 print:text-black/80">Sizes: {p.sizes.join(" · ")}</div>
                  <div className="mt-2 font-display text-lg">
                    <span className="text-cmyk-cyan print:text-black">₹{p.price_min}</span>
                    <span className="text-white/40 print:text-black/50"> – </span>
                    <span className="text-cmyk-magenta print:text-black">₹{p.price_max}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl md:text-4xl mt-10 uppercase">Printing Techniques</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { t: "DTF", d: "Vivid full-color transfer for cotton, blends & polyester." },
              { t: "Sublimation", d: "All-over photo prints on polyester. Lifetime fade-free." },
              { t: "Vinyl", d: "Crisp single-color logos, names & numbers for jerseys." },
              { t: "Embroidery", d: "Premium stitched logos for polos & corporate wear." },
            ].map((s) => (
              <div key={s.t} className="border border-ink print:border-black/30 p-4">
                <div className="font-display text-lg uppercase">{s.t}</div>
                <p className="text-xs text-white/65 print:text-black/70 mt-1">{s.d}</p>
              </div>
            ))}
          </div>

          <footer className="mt-10 pt-6 border-t border-ink print:border-black/30 grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="uppercase tracking-[0.2em] text-cmyk-yellow print:text-black/60">Contact</div>
              <div className="mt-1">{BRAND.phone}</div>
              <div>{BRAND.email}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.2em] text-cmyk-yellow print:text-black/60">Studio</div>
              <div className="mt-1">{BRAND.location}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.2em] text-cmyk-yellow print:text-black/60">GST</div>
              <div className="mt-1">{BRAND.gst}</div>
            </div>
          </footer>
        </article>
      </section>

      <style>{`
        @media print {
          body, html, #root { background: white !important; }
          header[data-testid="site-navbar"], footer[data-testid="site-footer"], a[data-testid="whatsapp-fab"], .print\\:hidden { display: none !important; }
          #catalogue-sheet { color: black !important; }
          #catalogue-sheet * { color: inherit; }
        }
      `}</style>
    </div>
  );
}
