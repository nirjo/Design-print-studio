import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, Package, Printer, Truck, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { buildWhatsAppLink } from "../lib/brand";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STAGES = [
  { v: "pending", label: "Received", icon: Package, color: "text-white" },
  { v: "in_print", label: "In Print", icon: Printer, color: "text-cmyk-cyan" },
  { v: "shipped", label: "Shipped", icon: Truck, color: "text-cmyk-magenta" },
  { v: "delivered", label: "Delivered", icon: CheckCircle2, color: "text-whatsapp" },
];

export default function Track() {
  const [sp, setSp] = useSearchParams();
  const [orderId, setOrderId] = useState(sp.get("id") || "");
  const [phone, setPhone] = useState(sp.get("phone") || "");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const lookup = async (e) => {
    if (e) e.preventDefault();
    if (!orderId || !phone) { toast.error("Order ID and phone required"); return; }
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const { data } = await axios.post(`${API}/orders/track`, { order_id: orderId.trim(), phone: phone.trim() });
      setOrder(data);
      setSp({ id: orderId.trim(), phone: phone.trim() });
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not find order");
    }
    setBusy(false);
  };

  // Auto-lookup if URL has ?id= and ?phone=
  useEffect(() => {
    if (sp.get("id") && sp.get("phone") && !order && !busy) lookup();
  }, []);

  const cancelled = order?.status === "cancelled";
  const currentIndex = STAGES.findIndex((s) => s.v === order?.status);

  return (
    <div data-testid="track-page" className="pt-24 md:pt-32 pb-16">
      <Toaster theme="dark" position="top-right" />
      <section className="max-w-4xl mx-auto px-5 md:px-10">
        <div className="text-xs uppercase tracking-[0.3em] text-cmyk-cyan mb-3">/ Track Order</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-[0.9]">
          Where&apos;s <span className="text-cmyk-magenta">my</span> print?
        </h1>
        <p className="mt-3 text-white/60 max-w-xl">Enter your order ID (or the 6-character short code we sent on WhatsApp) along with your phone number.</p>

        <form onSubmit={lookup} className="mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-3 border border-ink bg-ink-surface p-4 crop-marks relative">
          <input
            data-testid="track-order-id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID or 6-char code"
            className="bg-ink-black border border-ink px-3 py-3 text-sm focus:border-cmyk-cyan outline-none"
          />
          <input
            data-testid="track-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (10 digits)"
            className="bg-ink-black border border-ink px-3 py-3 text-sm focus:border-cmyk-cyan outline-none"
          />
          <button
            data-testid="track-submit"
            disabled={busy}
            className="bg-cmyk-yellow text-black font-bold px-5 py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50"
          >
            <Search size={16} /> {busy ? "Tracking…" : "Track"}
          </button>
        </form>

        {error && (
          <div data-testid="track-error" className="mt-5 border border-cmyk-magenta/60 text-cmyk-magenta text-sm px-4 py-3 uppercase tracking-wider">
            {error}
          </div>
        )}

        {order && (
          <div data-testid="track-result" className="mt-10 space-y-8">
            <div className="border border-ink bg-ink-surface p-6">
              <div className="flex flex-wrap justify-between gap-4 items-start">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-white/55">Order</div>
                  <div className="font-display text-3xl">#{order.short_id}</div>
                  <div className="text-xs text-white/60 mt-1">Placed {String(order.created_at).slice(0, 16)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/55">Total</div>
                  <div className="font-display text-3xl text-cmyk-yellow">₹{order.total_amount}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {!cancelled ? (
              <div className="relative">
                <div className="grid grid-cols-4 gap-3">
                  {STAGES.map((s, i) => {
                    const done = i <= currentIndex;
                    const active = i === currentIndex;
                    const Icon = s.icon;
                    return (
                      <div key={s.v} data-testid={`stage-${s.v}`} className={`relative border ${done ? "border-cmyk-yellow" : "border-ink"} bg-ink-surface p-4 text-center`}>
                        <Icon size={26} className={`mx-auto ${done ? s.color : "text-white/25"}`} />
                        <div className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${done ? "text-white" : "text-white/40"}`}>{s.label}</div>
                        {active && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-cmyk-yellow text-black text-[9px] uppercase tracking-widest font-bold px-2 py-0.5">Current</div>}
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-ink -z-10" />
              </div>
            ) : (
              <div data-testid="stage-cancelled" className="border border-cmyk-magenta/50 bg-ink-surface p-6 flex items-center gap-3">
                <XCircle className="text-cmyk-magenta" size={28} />
                <div>
                  <div className="font-display text-2xl uppercase">Order Cancelled</div>
                  <div className="text-xs text-white/60">Please contact us if this was a mistake.</div>
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow mb-3">Items</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {order.items?.map((it, i) => (
                  <div key={i} className="border border-ink bg-ink-surface p-3">
                    <div className="font-display text-base uppercase">{it.product_name}</div>
                    <div className="text-xs text-white/60 mt-1">{it.color} · {it.size} · {it.print_area} × {it.quantity}</div>
                    <div className="text-cmyk-cyan font-display text-lg mt-1">₹{it.unit_price * it.quantity}</div>
                    {it.notes && <div className="mt-1 text-[11px] text-white/55">{it.notes}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {Array.isArray(order.status_history) && order.status_history.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow mb-3">Updates</div>
                <ol className="space-y-2">
                  {order.status_history.map((h, i) => (
                    <li key={i} className="border-l-2 border-cmyk-cyan pl-3 text-sm">
                      <div className="font-display uppercase text-base">{h.status.replace("_", " ")}</div>
                      <div className="text-xs text-white/55">{String(h.at).slice(0, 16)}{h.note ? ` · ${h.note}` : ""}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <a
              data-testid="track-whatsapp"
              href={buildWhatsAppLink(`Hi! I have a question about my order #${order.short_id}.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-whatsapp text-black font-bold px-5 py-3 text-sm uppercase tracking-wider hover:bg-white"
            >
              <MessageCircle size={16} /> Ask About This Order
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
