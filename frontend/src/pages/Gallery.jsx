import React, { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const cats = ["All", "T-Shirts", "Mugs", "Caps", "Keychains", "Bags", "Corporate Gifts"];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    axios.get(`${API}/gallery`).then((r) => setItems(r.data)).catch(() => {});
  }, []);

  const filtered = cat === "All" ? items : items.filter((i) => i.category === cat);

  return (
    <div data-testid="gallery-page" className="pt-24 md:pt-32 pb-16">
      <section className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="text-xs uppercase tracking-[0.3em] text-cmyk-magenta mb-3">/ Gallery</div>
        <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9]">
          Our <span className="text-cmyk-cyan">Work</span>, in <span className="font-script normal-case tracking-normal text-cmyk-yellow text-7xl md:text-9xl">color.</span>
        </h1>

        <div className="mt-10 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              data-testid={`gallery-filter-${c.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setCat(c)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${cat === c ? "bg-cmyk-magenta text-white border-cmyk-magenta" : "border-ink text-white/70 hover:border-cmyk-cyan"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((g, i) => (
            <button
              key={g.id}
              data-testid={`gallery-item-${g.id}`}
              onClick={() => setLightbox(g)}
              className="group relative aspect-square overflow-hidden border border-ink bg-ink-surface fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <img src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cmyk-yellow">{g.category}</div>
                  <div className="font-display text-lg uppercase">{g.title}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <div className="max-w-4xl w-full border border-ink bg-ink-surface p-3" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.title} className="w-full max-h-[75vh] object-contain" />
            <div className="flex items-center justify-between mt-3 px-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cmyk-yellow">{lightbox.category}</div>
                <div className="font-display text-xl uppercase">{lightbox.title}</div>
              </div>
              <button data-testid="lightbox-close" onClick={() => setLightbox(null)} className="text-sm uppercase tracking-[0.2em] hover:text-cmyk-magenta">Close ✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
