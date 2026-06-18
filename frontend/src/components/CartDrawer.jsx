import React, { useState } from "react";
import { X, Trash2, MessageCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { buildWhatsAppLink, formatCartMessage } from "../lib/brand";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartDrawer() {
  const { items, totals, open, setOpen, updateItem, removeItem, clear } = useCart();
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });

  const submitOrder = async () => {
    if (items.length === 0) return;
    let trackingId = "";
    try {
      const { data } = await axios.post(`${API}/orders`, {
        customer_name: customer.name || "Guest",
        customer_phone: customer.phone || "Not provided",
        customer_email: customer.email || "",
        delivery_address: customer.address || "",
        items: items.map(({ key, ...rest }) => rest),
        total_amount: totals.amount,
        channel: "whatsapp",
      });
      trackingId = (data?.id || "").slice(0, 6).toUpperCase();
    } catch (e) {
      console.warn("Order save failed", e?.message);
    }
    const msg = formatCartMessage(items, customer, trackingId);
    window.open(buildWhatsAppLink(msg), "_blank");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        data-testid="cart-drawer"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-ink-black border-l border-ink transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink">
          <div className="font-display text-xl tracking-wider">YOUR CART <span className="text-cmyk-yellow">({totals.count})</span></div>
          <button data-testid="cart-close-btn" onClick={() => setOpen(false)} className="p-2 hover:text-cmyk-magenta"><X size={20} /></button>
        </div>

        <div className="h-[calc(100%-16rem)] overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 text-white/50">
              <div className="font-display text-3xl text-white/40 mb-2">EMPTY</div>
              <p className="text-sm">Add a tee, polo or dry-fit and we&apos;ll print it.</p>
            </div>
          )}
          {items.map((it) => (
            <div key={it.key} data-testid={`cart-item-${it.key}`} className="border border-ink p-3 flex gap-3 bg-ink-surface">
              <div className="flex-1">
                <div className="font-display text-base tracking-wide uppercase">{it.product_name}</div>
                <div className="text-xs text-white/60 mt-1">{it.color} · {it.size} · {it.print_area}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button data-testid={`qty-dec-${it.key}`} onClick={() => updateItem(it.key, { quantity: Math.max(1, it.quantity - 1) })} className="w-7 h-7 border border-ink hover:border-cmyk-cyan">−</button>
                  <span className="w-8 text-center text-sm">{it.quantity}</span>
                  <button data-testid={`qty-inc-${it.key}`} onClick={() => updateItem(it.key, { quantity: it.quantity + 1 })} className="w-7 h-7 border border-ink hover:border-cmyk-cyan">+</button>
                  <div className="ml-auto text-cmyk-cyan font-display text-lg">₹{it.unit_price * it.quantity}</div>
                </div>
              </div>
              <button data-testid={`cart-remove-${it.key}`} onClick={() => removeItem(it.key)} className="self-start text-white/40 hover:text-cmyk-magenta"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 border-t border-ink bg-ink-black space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              data-testid="cart-customer-name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="Your name"
              className="bg-ink-surface border border-ink px-3 py-2 text-sm focus:border-cmyk-cyan outline-none"
            />
            <input
              data-testid="cart-customer-phone"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="Phone"
              className="bg-ink-surface border border-ink px-3 py-2 text-sm focus:border-cmyk-cyan outline-none"
            />
          </div>
          <input
            data-testid="cart-customer-email"
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="Email (optional — receive invoice PDF)"
            className="w-full bg-ink-surface border border-ink px-3 py-2 text-sm focus:border-cmyk-cyan outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Total</span>
            <span data-testid="cart-total" className="font-display text-3xl text-cmyk-yellow">₹{totals.amount}</span>
          </div>
          <button
            data-testid="checkout-whatsapp-btn"
            disabled={items.length === 0}
            onClick={submitOrder}
            className="w-full bg-whatsapp text-black font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-white transition-colors"
          >
            <MessageCircle size={18} /> Checkout via WhatsApp
          </button>
          {items.length > 0 && (
            <button data-testid="cart-clear-btn" onClick={clear} className="w-full text-xs text-white/40 hover:text-cmyk-magenta">Clear Cart</button>
          )}
        </div>
      </aside>
    </>
  );
}
