import React from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "../lib/brand";

export default function WhatsAppFab() {
  const href = buildWhatsAppLink("Hi Aiel Design & Printing! I'd like to enquire about a custom print.");
  return (
    <a
      data-testid="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 group"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp opacity-60 animate-ping" />
      <span className="relative flex items-center gap-2 bg-whatsapp text-black font-bold pl-4 pr-5 py-3 rounded-full shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
        <MessageCircle size={20} />
        <span className="hidden sm:inline text-sm uppercase tracking-wider">Chat</span>
      </span>
    </a>
  );
}
