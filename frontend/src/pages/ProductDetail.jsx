import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, MessageCircle, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { buildWhatsAppLink } from "../lib/brand";
import { toast, Toaster } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, setOpen } = useCart();
  const [product, setProduct] = useState(null);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [printArea, setPrintArea] = useState("Front");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    axios.get(`${API}/products/${id}`).then((r) => {
      setProduct(r.data);
      setColor(r.data.colors[0]);
      setSize(r.data.sizes[1] || r.data.sizes[0]);
    }).catch(() => {});
  }, [id]);

  if (!product) {
    return <div data-testid="product-loading" className="pt-32 text-center text-white/50">Loading…</div>;
  }

  const price = Math.round((product.price_min + product.price_max) / 2);

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      size,
      color,
      print_area: printArea,
      quantity: qty,
      unit_price: price,
      notes,
    });
    toast.success(`${product.name} added to cart`, { description: `${color} · ${size} · ${printArea} × ${qty}` });
    setOpen(true);
  };

  const handleWhatsApp = () => {
    const msg = `Hi! I'd like to order:\n\n*${product.name}*\nColor: ${color}\nSize: ${size}\nPrint: ${printArea}\nQty: ${qty}\nPrice: ₹${price * qty}\n${notes ? `Notes: ${notes}\n` : ""}\nPlease share confirmation & lead time.`;
    window.open(buildWhatsAppLink(msg), "_blank");
  };

  return (
    <div data-testid="product-detail-page" className="pt-24 md:pt-28 pb-20">
      <Toaster theme="dark" position="top-right" />
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-cmyk-cyan mb-8">
          <ArrowLeft size={14} /> Back to Shop
        </Link>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="relative crop-marks border border-ink bg-ink-surface p-3 sticky top-24">
              <div className="aspect-[4/5] overflow-hidden bg-black">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-6 left-6 flex items-center gap-1">
                <span className="w-3 h-3 bg-cmyk-cyan" />
                <span className="w-3 h-3 bg-cmyk-magenta" />
                <span className="w-3 h-3 bg-cmyk-yellow" />
                <span className="w-3 h-3 bg-white" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {product.tagline && (
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] bg-cmyk-yellow text-black px-2 py-1 font-bold mb-4">{product.tagline}</span>
            )}
            <h1 className="font-display text-5xl md:text-6xl uppercase leading-[0.9]">{product.name}</h1>
            <p className="mt-2 text-sm text-white/55 uppercase tracking-[0.18em]">{product.fabric}</p>
            <p className="mt-4 text-white/70 leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl text-cmyk-cyan">₹{product.price_min}</span>
              <span className="text-white/40">–</span>
              <span className="font-display text-4xl text-cmyk-magenta">₹{product.price_max}</span>
              <span className="text-xs text-white/45 ml-2">(per piece, varies by print area)</span>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Color · <span className="text-white">{color}</span></div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    data-testid={`color-${c.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setColor(c)}
                    className={`swatch ${color === c ? "active" : ""}`}
                    style={{ background: product.color_hex?.[c] || "#888" }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    data-testid={`size-${s}`}
                    onClick={() => setSize(s)}
                    className={`size-btn ${size === s ? "active" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Print Area</div>
                <div className="flex gap-2">
                  {["Front", "Back", "Both"].map((pa) => (
                    <button
                      key={pa}
                      data-testid={`print-area-${pa.toLowerCase()}`}
                      onClick={() => setPrintArea(pa)}
                      className={`flex-1 py-2 text-xs uppercase tracking-[0.18em] border ${printArea === pa ? "bg-cmyk-magenta text-white border-cmyk-magenta" : "border-ink hover:border-cmyk-cyan"}`}
                    >
                      {pa}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Quantity</div>
                <div className="flex items-center border border-ink h-10">
                  <button data-testid="qty-dec" onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 h-full hover:text-cmyk-cyan">−</button>
                  <span data-testid="qty-value" className="flex-1 text-center font-bold">{qty}</span>
                  <button data-testid="qty-inc" onClick={() => setQty(qty + 1)} className="px-3 h-full hover:text-cmyk-cyan">+</button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Design / Notes</div>
              <textarea
                data-testid="product-notes"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your design or paste an Instagram/Drive link. We'll confirm artwork on WhatsApp."
                className="w-full bg-ink-surface border border-ink px-3 py-2 text-sm focus:border-cmyk-cyan outline-none resize-none"
              />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                data-testid="add-to-cart-btn"
                onClick={handleAdd}
                className="flex-1 bg-cmyk-yellow text-black font-bold py-4 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
              >
                <ShoppingBag size={18} /> Add to Cart
              </button>
              <button
                data-testid="whatsapp-order-btn"
                onClick={handleWhatsApp}
                className="flex-1 bg-whatsapp text-black font-bold py-4 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
              >
                <MessageCircle size={18} /> Order on WhatsApp
              </button>
            </div>

            <div className="mt-8 border-t border-ink pt-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-white/50 uppercase tracking-[0.2em] mb-1">Fabric</div>
                <div className="text-white">{product.fabric}</div>
              </div>
              <div>
                <div className="text-white/50 uppercase tracking-[0.2em] mb-1">Available Colors</div>
                <div className="text-white">{product.colors.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
