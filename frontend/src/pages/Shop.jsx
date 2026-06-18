import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const filters = ["All", "Best Seller", "Street Style", "Corporate & School", "Team Uniforms"];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    axios.get(`${API}/products`).then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const filtered = active === "All" ? products : products.filter((p) => p.tagline === active);

  return (
    <div data-testid="shop-page" className="pt-24 md:pt-32 pb-16">
      <section className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="text-xs uppercase tracking-[0.3em] text-cmyk-cyan mb-3">/ Shop</div>
        <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9]">
          The <span className="text-cmyk-magenta">Print</span> Collection
        </h1>
        <p className="mt-4 text-white/60 max-w-2xl">Hand-picked blanks ready to wear your design. Pick a style, drop your artwork on WhatsApp, and we'll print it.</p>

        <div className="mt-10 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              data-testid={`shop-filter-${f.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActive(f)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${active === f ? "bg-cmyk-yellow text-black border-cmyk-yellow" : "border-ink text-white/70 hover:border-cmyk-cyan hover:text-white"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}
