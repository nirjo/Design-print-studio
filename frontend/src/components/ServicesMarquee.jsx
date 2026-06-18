import React from "react";
import Marquee from "react-fast-marquee";

const items = [
  { text: "DTF Printing", color: "text-cmyk-cyan" },
  { text: "Sublimation", color: "text-cmyk-magenta" },
  { text: "Vinyl Printing", color: "text-cmyk-yellow" },
  { text: "Premium Quality", color: "text-white" },
  { text: "Fast Service", color: "text-cmyk-cyan" },
  { text: "While You Wait", color: "text-cmyk-magenta" },
  { text: "Corporate Gifts", color: "text-cmyk-yellow" },
  { text: "Team Uniforms", color: "text-white" },
];

export default function ServicesMarquee() {
  return (
    <div data-testid="services-marquee" className="border-y border-ink bg-ink-black py-5 overflow-hidden">
      <Marquee speed={50} gradient={false} pauseOnHover>
        {items.concat(items).map((it, i) => (
          <div key={i} className="flex items-center mx-8">
            <span className={`marquee-row text-2xl md:text-3xl ${it.color}`}>{it.text}</span>
            <span className="ml-8 inline-block w-3 h-3 rounded-full bg-cmyk-yellow" />
          </div>
        ))}
      </Marquee>
    </div>
  );
}
