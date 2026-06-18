import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Sparkles, Zap, Shield, Truck, Star } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ServicesMarquee from "../components/ServicesMarquee";
import { BRAND } from "../lib/brand";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`${API}/products`).then((r) => setProducts(r.data)).catch(() => {});
    axios.get(`${API}/reviews/public?limit=6`).then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page" className="pt-16 md:pt-20">
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden ink-splatter">
        <div className="absolute inset-0 halftone opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-black" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-20 grid lg:grid-cols-12 gap-10 items-center w-full">
          <div className="lg:col-span-7 fade-up">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60 mb-6">
              <span className="w-8 h-px bg-cmyk-yellow" />
              Puducherry · Print Studio
            </div>
            <h1 className="font-display text-[14vw] sm:text-[10vw] lg:text-[7.2vw] leading-[0.85] uppercase">
              <span className="block">BRING YOUR</span>
              <span className="block text-cmyk-magenta">IDEAS</span>
              <span className="block">
                TO <span className="font-script normal-case tracking-normal text-cmyk-yellow text-[18vw] sm:text-[13vw] lg:text-[9vw] align-middle">Life</span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-white/70 text-base md:text-lg leading-relaxed">
              Premium custom t-shirts, oversized streetwear, corporate polos & dry-fit team kits — designed, printed and shipped from our Puducherry studio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                data-testid="hero-shop-btn"
                className="group inline-flex items-center gap-2 bg-cmyk-yellow text-black px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors shadow-cmyk-magenta"
              >
                Shop Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/catalogue"
                data-testid="hero-catalogue-btn"
                className="inline-flex items-center gap-2 border border-white px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors"
              >
                View Catalogue
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              {[
                { v: "180+", l: "GSM Cotton" },
                { v: "4", l: "Print Techniques" },
                { v: "24h", l: "Quick Turn" },
                { v: "100%", l: "Made In India" },
              ].map((s, i) => (
                <div key={i} className="border-l-2 border-cmyk-cyan pl-3">
                  <div className="font-display text-2xl md:text-3xl text-white">{s.v}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative fade-up" style={{ animationDelay: "200ms" }}>
            <div className="relative crop-marks bg-ink-surface border border-ink p-4">
              <img src={BRAND.assets.nameboard} alt="Aiel Design & Printing" className="w-full h-auto object-contain" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-cmyk-magenta text-black px-4 py-2 font-bold text-xs uppercase tracking-widest rotate-[-4deg] shadow-cmyk-yellow">
              Design · Print · Personalize
            </div>
          </div>
        </div>
      </section>

      <ServicesMarquee />

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cmyk-cyan mb-3">/ Catalog</div>
            <h2 className="font-display text-5xl md:text-7xl uppercase leading-[0.9]">Wear <span className="text-cmyk-magenta">your</span> story.</h2>
          </div>
          <Link to="/shop" data-testid="featured-view-all" className="self-start inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-cmyk-yellow hover:text-white">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Sparkles, t: "DTF & Sublimation", d: "Vivid, durable prints that survive wash after wash.", c: "text-cmyk-cyan" },
            { icon: Zap, t: "Fast Turnaround", d: "Same-day options. Bulk orders shipped in 72 hours.", c: "text-cmyk-magenta" },
            { icon: Shield, t: "Premium Fabric", d: "Bio-washed 180–240 GSM cotton & engineered polyester.", c: "text-cmyk-yellow" },
            { icon: Truck, t: "All-India Delivery", d: "Free shipping on bulk orders above ₹5,000.", c: "text-white" },
          ].map((f, i) => (
            <div key={i} className="border border-ink bg-ink-surface p-6 hover:border-cmyk-cyan transition-colors">
              <f.icon className={`${f.c}`} size={28} />
              <div className="font-display text-2xl uppercase mt-4 tracking-wide">{f.t}</div>
              <p className="text-sm text-white/60 mt-2">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative my-16 mx-5 md:mx-10">
        <div className="relative crop-marks border border-ink bg-ink-surface p-10 md:p-16 overflow-hidden">
          <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-cmyk-yellow opacity-20 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-cmyk-magenta mb-3">/ Bulk & Corporate</div>
              <h3 className="font-display text-4xl md:text-6xl uppercase leading-[0.95]">
                Team kits, school uniforms, corporate gifts —<br />
                <span className="font-script text-5xl md:text-7xl text-cmyk-yellow normal-case tracking-normal">we print at scale.</span>
              </h3>
            </div>
            <div className="md:text-right">
              <p className="text-white/65 mb-6">Send us your artwork &amp; quantity — we&apos;ll quote within an hour on WhatsApp.</p>
              <Link to="/contact" data-testid="bulk-quote-btn" className="inline-flex items-center gap-2 bg-cmyk-cyan text-black px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white">
                Get a Bulk Quote <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section data-testid="reviews-section" className="max-w-7xl mx-auto px-5 md:px-10 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-cmyk-yellow mb-3">/ Real customers</div>
              <h2 className="font-display text-5xl md:text-7xl uppercase leading-[0.9]">Worn & <span className="text-cmyk-cyan">loved</span>.</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div key={r.id} data-testid={`review-card-${r.id}`} className="border border-ink bg-ink-surface p-5 fade-up">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={n <= r.rating ? "text-cmyk-yellow" : "text-white/15"} fill={n <= r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                {r.photo_url && (
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${r.photo_url}`} alt="" className="w-full h-48 object-cover mb-3 border border-ink" />
                )}
                {r.text && <p className="text-sm text-white/80 leading-relaxed">&ldquo;{r.text}&rdquo;</p>}
                <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/45">— {r.customer_name || "Customer"}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
