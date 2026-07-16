import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, RotateCcw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const cats = ["All", "T-Shirts", "Mugs", "Caps", "Keychains", "Bags", "Corporate Gifts"];

function GalleryCard({ item, index }) {
  const [flipped, setFlipped] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const handleFlip = (e) => {
    e.stopPropagation();
    setFlipped((f) => !f);
  };

  const handleLightbox = (e) => {
    e.stopPropagation();
    setLightbox(true);
  };

  return (
    <>
      <div
        data-testid={`gallery-item-${item.id}`}
        className="group fade-up"
        style={{
          animationDelay: `${index * 40}ms`,
          perspective: "1000px",
        }}
      >
        <div
          className="relative w-full aspect-square transition-transform duration-700 ease-in-out cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={handleFlip}
        >
          {/* ===== FRONT FACE ===== */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden border border-ink bg-ink-surface"
            style={{ backfaceVisibility: "hidden" }}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-cmyk-yellow">{item.category}</div>
                <div className="font-display text-lg uppercase">{item.title}</div>
              </div>
            </div>
            {/* Flip hint */}
            <div className="absolute top-3 right-3 text-[8px] uppercase tracking-[0.2em] text-white/40 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Tap to flip
            </div>
          </div>

          {/* ===== BACK FACE ===== */}
          <div
            className="absolute inset-0 w-full h-full border border-cmyk-cyan bg-ink-surface overflow-hidden flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* CMYK gradient stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cmyk-cyan via-cmyk-magenta to-cmyk-yellow shrink-0" />

            {/* Blurred background image */}
            <div className="absolute inset-0 opacity-10">
              <img src={item.image} alt="" className="w-full h-full object-cover blur-md" />
            </div>

            <div className="relative flex flex-col items-center justify-center flex-1 p-5 text-center">
              {/* Category pill */}
              <span className="text-[9px] uppercase tracking-[0.25em] bg-cmyk-yellow text-black px-2 py-0.5 font-bold mb-3">
                {item.category}
              </span>

              {/* Title */}
              <h3 className="font-display text-2xl md:text-3xl uppercase leading-tight text-white mb-4">
                {item.title}
              </h3>

              {/* Decorative line */}
              <div className="w-12 h-px bg-cmyk-cyan mb-4" />

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleLightbox}
                  className="flex items-center gap-2 bg-cmyk-cyan text-black font-bold py-2 px-4 uppercase tracking-wider text-[10px] hover:bg-white transition-colors"
                >
                  <Eye size={13} /> Full View
                </button>
                <button
                  onClick={handleFlip}
                  className="p-2 border border-ink hover:border-cmyk-cyan text-white/60 hover:text-cmyk-cyan transition-colors"
                  title="Flip back"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Bottom CMYK dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              <span className="w-2 h-2 bg-cmyk-cyan rounded-full" />
              <span className="w-2 h-2 bg-cmyk-magenta rounded-full" />
              <span className="w-2 h-2 bg-cmyk-yellow rounded-full" />
              <span className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
          onClick={() => setLightbox(false)}
        >
          <div
            className="max-w-4xl w-full border border-ink bg-ink-surface p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={item.image} alt={item.title} className="w-full max-h-[75vh] object-contain" />
            <div className="flex items-center justify-between mt-3 px-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cmyk-yellow">{item.category}</div>
                <div className="font-display text-xl uppercase">{item.title}</div>
              </div>
              <button
                data-testid="lightbox-close"
                onClick={() => setLightbox(false)}
                className="text-sm uppercase tracking-[0.2em] hover:text-cmyk-magenta"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("All");

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
            <GalleryCard key={g.id} item={g} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
