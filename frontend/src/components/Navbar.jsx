import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { BRAND } from "../lib/brand";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { totals, setOpen } = useCart();
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      data-testid="site-navbar"
      className="fixed top-0 inset-x-0 z-40 bg-black/80 backdrop-blur-xl border-b border-ink"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
          <img src={BRAND.assets.circular} alt="Aiel" className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full ring-1 ring-white/10" />
          <div className="leading-tight hidden sm:block">
            <div className="font-display text-lg md:text-xl tracking-wider">AIEL</div>
            <div className="text-[10px] md:text-xs text-white/60 uppercase tracking-[0.25em]">Design • Print</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm uppercase tracking-[0.18em] transition-colors ${isActive ? "text-cmyk-yellow" : "text-white/80 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            data-testid="cart-toggle-btn"
            onClick={() => setOpen(true)}
            className="relative p-2 border border-ink hover:border-cmyk-cyan transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {totals.count > 0 && (
              <span
                data-testid="cart-count-badge"
                className="absolute -top-2 -right-2 bg-cmyk-magenta text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center"
              >
                {totals.count}
              </span>
            )}
          </button>
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setMobile(!mobile)}
            className="md:hidden p-2 border border-ink"
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="md:hidden border-t border-ink bg-ink-black">
          <div className="px-5 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <button
                key={l.to}
                data-testid={`mobile-nav-${l.label.toLowerCase()}`}
                onClick={() => { setMobile(false); navigate(l.to); }}
                className="text-left py-2 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-cmyk-yellow border-b border-ink/60"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
