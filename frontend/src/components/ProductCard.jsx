import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, RotateCcw } from "lucide-react";

export default function ProductCard({ product, index = 0 }) {
  const [hover, setHover] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  const handleFlip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFlipped((f) => !f);
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group relative block fade-up"
      style={{
        animationDelay: `${index * 80}ms`,
        perspective: "1200px",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 3D flip container */}
      <div
        className="relative w-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ===== FRONT FACE ===== */}
        <div
          className="relative w-full bg-ink-surface border border-ink hover:border-cmyk-cyan transition-colors duration-300 cursor-pointer"
          style={{ backfaceVisibility: "hidden" }}
          onClick={handleFlip}
        >
          <div className="aspect-[4/5] overflow-hidden bg-black relative">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {product.tagline && (
                <span className="text-[10px] uppercase tracking-[0.18em] bg-cmyk-yellow text-black px-2 py-1 font-bold">
                  {product.tagline}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 p-2 bg-black/70 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={16} />
            </div>
            {/* Color swatches on hover */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              {hover &&
                product.colors.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="w-5 h-5 rounded-full border border-white/40"
                    style={{ background: product.color_hex?.[c] || "#888" }}
                  />
                ))}
            </div>
            {/* Flip hint */}
            <div className="absolute bottom-3 right-3 text-[9px] uppercase tracking-[0.2em] text-white/40 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to flip
            </div>
          </div>
          <div className="p-5 border-t border-ink">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl tracking-wide uppercase leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-white/55 mt-1">{product.fabric}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                  From
                </div>
                <div className="font-display text-2xl text-cmyk-cyan">
                  ₹{product.price_min}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className="absolute inset-0 w-full h-full bg-ink-surface border border-cmyk-cyan overflow-hidden cursor-pointer"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          onClick={handleFlip}
        >
          {/* Decorative header stripe */}
          <div className="h-2 w-full bg-gradient-to-r from-cmyk-cyan via-cmyk-magenta to-cmyk-yellow" />

          <div className="p-5 flex flex-col h-[calc(100%-8px)]">
            {/* Product name */}
            <h3 className="font-display text-3xl uppercase leading-tight text-cmyk-cyan mb-1">
              {product.name}
            </h3>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-4">
              {product.fabric}
            </p>

            {/* Description */}
            <p className="text-sm text-white/70 leading-relaxed mb-5 line-clamp-3">
              {product.description}
            </p>

            {/* Colors */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                Colors
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <div key={c} className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ background: product.color_hex?.[c] || "#888" }}
                    />
                    <span className="text-[11px] text-white/60">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                Sizes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 border border-ink text-white/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">
                Price Range
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl text-cmyk-cyan">
                  ₹{product.price_min}
                </span>
                <span className="text-white/30">–</span>
                <span className="font-display text-2xl text-cmyk-magenta">
                  ₹{product.price_max}
                </span>
                <span className="text-[10px] text-white/40 ml-1">per piece</span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleNavigate}
                className="flex-1 bg-cmyk-yellow text-black font-bold py-3 uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-white transition-colors"
              >
                <ArrowUpRight size={14} /> View Product
              </button>
              <button
                onClick={handleFlip}
                className="p-3 border border-ink hover:border-cmyk-cyan text-white/60 hover:text-cmyk-cyan transition-colors"
                title="Flip back"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
