import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, MessageCircle, ArrowLeft, Upload, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { buildWhatsAppLink } from "../lib/brand";
import { toast, Toaster } from "sonner";
import FlipCard from "../components/FlipCard";
import whiteShirt from "../assets/shirts/white.png";
import blackShirt from "../assets/shirts/black.png";
import redShirt from "../assets/shirts/red.png";
import royalblueShirt from "../assets/shirts/royalblue.png";
import yellowShirt from "../assets/shirts/yellow.png";


const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, setOpen } = useCart();
  const [showSurprise, setShowSurprise] = useState(false);
  const [discount, setDiscount] = useState(null);
  const [product, setProduct] = useState(null);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [printArea, setPrintArea] = useState("Front");
  const [notes, setNotes] = useState("");
  const [artwork, setArtwork] = useState(null); // { id, url, name }
  const [uploading, setUploading] = useState(false);

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
  const artworkAbsolute = artwork ? `${process.env.REACT_APP_BACKEND_URL}${artwork.url}` : "";

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("File too large (25 MB max)"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "artwork");
      const { data } = await axios.post(`${API}/upload`, fd);
      setArtwork({ id: data.id, url: data.url, name: file.name });
      toast.success("Artwork uploaded");
    } catch (e) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

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
      artwork_url: artwork?.url || "",
    });
    toast.success(`${product.name} added to cart`, { description: `${color} · ${size} · ${printArea} × ${qty}` });
    setOpen(true);
  };

  const handleWhatsApp = () => {
    const lines = [
      `Hi! I'd like to order:`,
      ``,
      `*${product.name}*`,
      `Color: ${color}`,
      `Size: ${size}`,
      `Print: ${printArea}`,
      `Qty: ${qty}`,
      `Price: ₹${price * qty}`,
    ];
    if (notes) lines.push(`Notes: ${notes}`);
    if (artwork) lines.push(`Artwork: ${process.env.REACT_APP_BACKEND_URL}${artwork.url}`);
    lines.push("", "Please share confirmation & lead time.");
    window.open(buildWhatsAppLink(lines.join("\n")), "_blank");
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
              <FlipCard
                front={
                  <img
                    src={{
                      white: whiteShirt,
                      black: blackShirt,
                      red: redShirt,
                      royalblue: royalblueShirt,
                      yellow: yellowShirt,
                    }[color] || whiteShirt}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                }
                back={
                  <div className="flex items-center justify-center h-full bg-white">
                    <span className="text-xl font-bold text-gray-700">Scratch Here</span>
                  </div>
                }
                flipped={showSurprise}
                onClick={() => setShowSurprise(!showSurprise)}
              />
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/70 px-3 py-1.5 border border-white/10">
                <span
                  className="w-4 h-4 rounded-full border border-white/40"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/80">
                  {color ? color.charAt(0).toUpperCase() + color.slice(1) : ""}
                </span>
              </div>
              {artwork && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img src={artworkAbsolute} alt="Your artwork" className="max-w-[45%] max-h-[40%] drop-shadow-2xl" />
                </div>
              )}
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
              <span className="text-xs text-white/45 ml-2">(per piece)</span>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Color · <span className="text-white">{color}</span></div>
              <div className="flex flex-wrap gap-3">
                {['black','white','royalblue','red','yellow'].map((c) => (
                  <button
                    key={c}
                    data-testid={`color-${c}`}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${color === c ? 'border-cmyk-cyan shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} data-testid={`size-${s}`} onClick={() => setSize(s)} className={`size-btn ${size === s ? "active" : ""}`}>
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
                    <button key={pa} data-testid={`print-area-${pa.toLowerCase()}`} onClick={() => setPrintArea(pa)}
                      className={`flex-1 py-2 text-xs uppercase tracking-[0.18em] border ${printArea === pa ? "bg-cmyk-magenta text-white border-cmyk-magenta" : "border-ink hover:border-cmyk-cyan"}`}>
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

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Your Artwork <span className="text-white/35">(optional, up to 25 MB)</span></div>
              {artwork ? (
                <div className="flex items-center gap-3 border border-ink bg-ink-surface p-3">
                  <img src={artworkAbsolute} alt="" className="w-14 h-14 object-cover bg-white" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{artwork.name}</div>
                    <div className="text-[11px] text-cmyk-cyan">Preview added to mockup</div>
                  </div>
                  <button data-testid="artwork-remove" onClick={() => setArtwork(null)} className="p-2 text-white/60 hover:text-cmyk-magenta"><X size={16} /></button>
                </div>
              ) : (
                <label data-testid="artwork-upload-label" className="flex items-center justify-center gap-2 border-2 border-dashed border-ink hover:border-cmyk-cyan p-5 cursor-pointer">
                  <Upload size={18} />
                  <span className="text-sm uppercase tracking-wider">{uploading ? "Uploading…" : "Upload PNG / JPG / PDF"}</span>
                  <input data-testid="artwork-input" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-3">Design Notes</div>
              <textarea
                data-testid="product-notes"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Position (chest / back / sleeve), colors, font, sizes, deadline…"
                className="w-full bg-ink-surface border border-ink px-3 py-2 text-sm focus:border-cmyk-cyan outline-none resize-none"
              />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button data-testid="add-to-cart-btn" onClick={handleAdd}
                className="flex-1 bg-cmyk-yellow text-black font-bold py-4 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors">
                <ShoppingBag size={18} /> Add to Cart
              </button>
              <button data-testid="whatsapp-order-btn" onClick={handleWhatsApp}
                className="flex-1 bg-whatsapp text-black font-bold py-4 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors">
                <MessageCircle size={18} /> Order on WhatsApp
              </button>
              <button data-testid="surprise-card-btn" onClick={() => {
                  const d = Math.floor(Math.random()*46)+5;
                  setDiscount(d);
                  setShowSurprise(true);
                }}
                className="flex-1 bg-cmyk-cyan text-black font-bold py-4 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors">
                🎁 Surprise Card
              </button>
            </div>

            {showSurprise && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50" onClick={() => setShowSurprise(false)}>
                <FlipCard
                  front={
                    <div className="flex items-center justify-center w-full h-full bg-gray-300">
                      <span className="text-xl font-bold text-gray-700 cursor-pointer" onClick={() => setShowSurprise(true)}>Scratch Here</span>
                    </div>
                  }
                  back={
                    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
                      <h2 className="text-2xl font-bold mb-4">Your Discount</h2>
                      <p className="text-xl">You get <span className="text-cmyk-cyan font-extrabold">{discount}%</span> off!</p>
                      <button onClick={() => setShowSurprise(false)} className="mt-4 px-4 py-2 bg-cmyk-magenta text-white hover:bg-cmyk-cyan">Close</button>
                    </div>
                  }
                  flipped={showSurprise}
                  onClick={() => setShowSurprise(!showSurprise)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
