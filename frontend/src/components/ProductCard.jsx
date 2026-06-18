import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ product, index = 0 }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative block bg-ink-surface border border-ink hover:border-cmyk-cyan transition-colors duration-300 fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
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
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {hover && product.colors.map((c) => (
            <span
              key={c}
              title={c}
              className="w-5 h-5 rounded-full border border-white/40"
              style={{ background: product.color_hex?.[c] || "#888" }}
            />
          ))}
        </div>
      </div>
      <div className="p-5 border-t border-ink">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl tracking-wide uppercase leading-tight">{product.name}</h3>
            <p className="text-xs text-white/55 mt-1">{product.fabric}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">From</div>
            <div className="font-display text-2xl text-cmyk-cyan">₹{product.price_min}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
