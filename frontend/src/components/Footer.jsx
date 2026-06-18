import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { BRAND, buildWhatsAppLink } from "../lib/brand";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative mt-24 border-t border-ink bg-ink-black overflow-hidden">
      <div className="absolute inset-0 halftone opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-10 py-16">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="font-display text-5xl md:text-7xl leading-[0.9] tracking-wide">
              BRING <span className="text-cmyk-magenta">YOUR</span>
              <br />
              IDEAS <span className="text-cmyk-cyan">TO</span>
              <br />
              <span className="font-script text-6xl md:text-8xl text-cmyk-yellow normal-case tracking-normal">Life.</span>
            </div>
            <p className="mt-6 text-white/60 max-w-md text-sm leading-relaxed">
              Custom apparel, corporate gifting, sublimation, vinyl & DTF printing — straight from our studio in Puducherry.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow mb-4">Shop</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-cmyk-cyan">All Products</Link></li>
              <li><Link to="/catalogue" className="hover:text-cmyk-cyan">Catalogue</Link></li>
              <li><Link to="/gallery" className="hover:text-cmyk-cyan">Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-cmyk-cyan">Bulk Quote</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow mb-4">Studio</div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><Phone size={16} className="mt-0.5 text-cmyk-magenta" /><a data-testid="footer-phone" href={buildWhatsAppLink("Hi! I want to know more about Aiel Design & Printing.")} target="_blank" rel="noreferrer" className="hover:text-cmyk-cyan">{BRAND.phone}</a></li>
              <li className="flex items-start gap-3"><Mail size={16} className="mt-0.5 text-cmyk-magenta" /><a data-testid="footer-email" href={`mailto:${BRAND.email}`} className="hover:text-cmyk-cyan break-all">{BRAND.email}</a></li>
              <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 text-cmyk-magenta" /><span>{BRAND.location}</span></li>
              <li className="text-xs text-white/40 pt-2">GST: {BRAND.gst}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ink flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-white/40">
          <div>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-cmyk-cyan"></span>
            <span className="inline-block w-2.5 h-2.5 bg-cmyk-magenta"></span>
            <span className="inline-block w-2.5 h-2.5 bg-cmyk-yellow"></span>
            <span className="inline-block w-2.5 h-2.5 bg-white"></span>
            <span className="ml-2 uppercase tracking-[0.2em]">CMYK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
