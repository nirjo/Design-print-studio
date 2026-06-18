import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Plus, Trash2, Save, LogOut, Sparkles, Upload, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TABS = ["products", "gallery", "orders", "contacts"];

const EMPTY_PRODUCT = {
  id: "",
  name: "",
  tagline: "",
  fabric: "",
  description: "",
  colors: [],
  color_hex: {},
  sizes: ["S", "M", "L", "XL"],
  price_min: 0,
  price_max: 0,
  image: "",
  gallery: [],
  is_active: true,
};

export default function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [galleryEdit, setGalleryEdit] = useState(null);

  const reload = async () => {
    const [p, g, o, c] = await Promise.allSettled([
      axios.get(`${API}/products`),
      axios.get(`${API}/gallery`),
      axios.get(`${API}/admin/orders`, { withCredentials: true }),
      axios.get(`${API}/admin/contacts`, { withCredentials: true }),
    ]);
    if (p.status === "fulfilled") setProducts(p.value.data);
    if (g.status === "fulfilled") setGallery(g.value.data);
    if (o.status === "fulfilled") setOrders(o.value.data);
    if (c.status === "fulfilled") setContacts(c.value.data);
  };

  useEffect(() => { reload(); }, []);

  return (
    <div data-testid="admin-page" className="pt-24 md:pt-28 pb-16">
      <Toaster theme="dark" position="top-right" />
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cmyk-yellow mb-2">/ Studio Dashboard</div>
            <h1 className="font-display text-5xl md:text-6xl uppercase">Admin <span className="text-cmyk-magenta">Console</span></h1>
            <div className="text-sm text-white/60 mt-2">Signed in as <span className="text-white">{user?.email}</span></div>
          </div>
          <button data-testid="admin-logout" onClick={logout} className="inline-flex items-center gap-2 border border-ink hover:border-cmyk-magenta px-4 py-2 text-xs uppercase tracking-[0.2em]">
            <LogOut size={14} /> Logout
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-ink">
          {TABS.map((t) => (
            <button
              key={t}
              data-testid={`admin-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs uppercase tracking-[0.22em] ${tab === t ? "text-cmyk-yellow border-b-2 border-cmyk-yellow" : "text-white/55 hover:text-white"}`}
            >
              {t} {t === "products" ? `(${products.length})` : t === "gallery" ? `(${gallery.length})` : t === "orders" ? `(${orders.length})` : `(${contacts.length})`}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "products" && (
            <ProductsTab
              products={products}
              onEdit={setEditing}
              onNew={() => setEditing({ ...EMPTY_PRODUCT, id: `product-${Date.now()}` })}
              onReload={reload}
            />
          )}
          {tab === "gallery" && (
            <GalleryTab items={gallery} onEdit={setGalleryEdit} onNew={() => setGalleryEdit({ id: "", category: "T-Shirts", title: "", image: "" })} onReload={reload} />
          )}
          {tab === "orders" && <OrdersTab orders={orders} />}
          {tab === "contacts" && <ContactsTab contacts={contacts} />}
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
          isNew={!products.some((p) => p.id === editing.id)}
        />
      )}
      {galleryEdit && (
        <GalleryEditor
          item={galleryEdit}
          onClose={() => setGalleryEdit(null)}
          onSaved={async () => { setGalleryEdit(null); await reload(); }}
          isNew={!gallery.some((g) => g.id === galleryEdit.id)}
        />
      )}
    </div>
  );
}

function ProductsTab({ products, onEdit, onNew, onReload }) {
  const del = async (id) => {
    if (!window.confirm(`Delete ${id}?`)) return;
    try { await axios.delete(`${API}/admin/products/${id}`, { withCredentials: true }); toast.success("Deleted"); onReload(); }
    catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div>
      <button data-testid="add-product-btn" onClick={onNew} className="inline-flex items-center gap-2 bg-cmyk-yellow text-black font-bold px-4 py-2 text-xs uppercase tracking-wider hover:bg-white mb-6">
        <Plus size={14} /> Add Product
      </button>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div key={p.id} className="border border-ink bg-ink-surface flex">
            <img src={p.image} alt={p.name} className="w-28 h-36 object-cover" />
            <div className="p-3 flex-1 flex flex-col">
              <div className="font-display text-lg uppercase">{p.name}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-cmyk-yellow">{p.tagline}</div>
              <div className="text-xs text-white/55 mt-1">₹{p.price_min}–{p.price_max} · {p.colors?.length} colors</div>
              <div className="mt-auto pt-3 flex gap-2">
                <button data-testid={`edit-product-${p.id}`} onClick={() => onEdit({ ...p })} className="flex-1 border border-ink hover:border-cmyk-cyan px-2 py-1.5 text-[11px] uppercase tracking-wider">Edit</button>
                <button data-testid={`delete-product-${p.id}`} onClick={() => del(p.id)} className="border border-ink hover:border-cmyk-magenta px-2 py-1.5 text-[11px] text-cmyk-magenta"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ product, onClose, onSaved, isNew }) {
  const [p, setP] = useState(product);
  const [busy, setBusy] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");

  const set = (k, v) => setP({ ...p, [k]: v });

  const save = async () => {
    setBusy(true);
    try {
      if (isNew) await axios.post(`${API}/admin/products`, p, { withCredentials: true });
      else await axios.put(`${API}/admin/products/${p.id}`, p, { withCredentials: true });
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    }
    setBusy(false);
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "products");
    const { data } = await axios.post(`${API}/upload`, fd, { withCredentials: true });
    set("image", `${process.env.REACT_APP_BACKEND_URL}${data.url}`);
    toast.success("Image uploaded");
  };

  const generateMockup = async () => {
    if (!genPrompt) { toast.error("Enter a prompt"); return; }
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/admin/generate-mockup`, { product_id: p.id, prompt: genPrompt }, { withCredentials: true });
      set("image", `${process.env.REACT_APP_BACKEND_URL}${data.url}`);
      toast.success("Mockup generated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Generation failed");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div data-testid="product-editor" className="w-full max-w-3xl bg-ink-black border border-ink my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-ink">
          <div className="font-display text-2xl uppercase">{isNew ? "New" : "Edit"} Product</div>
          <button data-testid="editor-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <Row>
            <Input label="ID (slug)" testid="ed-id" value={p.id} onChange={(v) => set("id", v)} disabled={!isNew} />
            <Input label="Name" testid="ed-name" value={p.name} onChange={(v) => set("name", v)} />
          </Row>
          <Row>
            <Input label="Tagline" testid="ed-tagline" value={p.tagline} onChange={(v) => set("tagline", v)} />
            <Input label="Fabric" testid="ed-fabric" value={p.fabric} onChange={(v) => set("fabric", v)} />
          </Row>
          <Field label="Description">
            <textarea data-testid="ed-desc" value={p.description} onChange={(e) => set("description", e.target.value)} rows="3" className="w-full bg-ink-surface border border-ink p-2 text-sm" />
          </Field>
          <Row>
            <Input label="Colors (comma)" testid="ed-colors" value={p.colors.join(", ")} onChange={(v) => set("colors", v.split(",").map(s => s.trim()).filter(Boolean))} />
            <Input label="Sizes (comma)" testid="ed-sizes" value={p.sizes.join(", ")} onChange={(v) => set("sizes", v.split(",").map(s => s.trim()).filter(Boolean))} />
          </Row>
          <Field label="Color Hex (one per line: Color=#hex)">
            <textarea
              data-testid="ed-color-hex"
              value={Object.entries(p.color_hex || {}).map(([k, v]) => `${k}=${v}`).join("\n")}
              onChange={(e) => {
                const map = {};
                e.target.value.split("\n").forEach((l) => { const [k, v] = l.split("="); if (k && v) map[k.trim()] = v.trim(); });
                set("color_hex", map);
              }}
              rows="4"
              className="w-full bg-ink-surface border border-ink p-2 text-sm font-mono"
            />
          </Field>
          <Row>
            <Input type="number" label="Price Min" testid="ed-price-min" value={p.price_min} onChange={(v) => set("price_min", Number(v))} />
            <Input type="number" label="Price Max" testid="ed-price-max" value={p.price_max} onChange={(v) => set("price_max", Number(v))} />
          </Row>

          <Field label="Product Image">
            {p.image && <img src={p.image} alt="" className="w-32 h-40 object-cover border border-ink mb-2" />}
            <div className="flex gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 border border-ink px-3 py-2 text-xs uppercase tracking-wider cursor-pointer hover:border-cmyk-cyan">
                <Upload size={14} /> Upload
                <input data-testid="ed-image-file" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </label>
              <input data-testid="ed-image-url" value={p.image} onChange={(e) => set("image", e.target.value)} placeholder="Or paste URL" className="flex-1 bg-ink-surface border border-ink px-2 py-2 text-xs" />
            </div>
            <div className="mt-3 border-t border-ink pt-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cmyk-magenta mb-2">AI Mockup (Gemini Nano Banana)</div>
              <textarea
                data-testid="ed-gen-prompt"
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                rows="2"
                placeholder="e.g. Studio photograph of a premium black 180 GSM bio-washed cotton round-neck t-shirt on a wooden hanger, soft front lighting, dark background, ultra realistic, 4k"
                className="w-full bg-ink-surface border border-ink p-2 text-xs"
              />
              <button data-testid="ed-gen-btn" disabled={busy} onClick={generateMockup} className="mt-2 inline-flex items-center gap-2 bg-cmyk-magenta text-white font-bold px-3 py-2 text-xs uppercase tracking-wider disabled:opacity-50">
                <Sparkles size={14} /> Generate Mockup
              </button>
            </div>
          </Field>
        </div>
        <div className="p-4 border-t border-ink flex justify-end gap-2">
          <button data-testid="editor-cancel" onClick={onClose} className="border border-ink px-4 py-2 text-xs uppercase tracking-wider">Cancel</button>
          <button data-testid="editor-save" disabled={busy} onClick={save} className="bg-cmyk-yellow text-black font-bold px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryTab({ items, onEdit, onNew, onReload }) {
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await axios.delete(`${API}/admin/gallery/${id}`, { withCredentials: true }); toast.success("Deleted"); onReload(); }
    catch (e) { toast.error("Delete failed"); }
  };
  return (
    <div>
      <button data-testid="add-gallery-btn" onClick={onNew} className="inline-flex items-center gap-2 bg-cmyk-yellow text-black font-bold px-4 py-2 text-xs uppercase tracking-wider hover:bg-white mb-6">
        <Plus size={14} /> Add Gallery Item
      </button>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((g) => (
          <div key={g.id} className="border border-ink bg-ink-surface">
            <img src={g.image} alt={g.title} className="w-full aspect-square object-cover" />
            <div className="p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cmyk-yellow">{g.category}</div>
              <div className="font-display text-base uppercase truncate">{g.title}</div>
              <div className="mt-2 flex gap-2">
                <button data-testid={`edit-gallery-${g.id}`} onClick={() => onEdit({ ...g })} className="flex-1 border border-ink hover:border-cmyk-cyan px-2 py-1 text-[11px] uppercase">Edit</button>
                <button data-testid={`delete-gallery-${g.id}`} onClick={() => del(g.id)} className="border border-ink hover:border-cmyk-magenta px-2 py-1 text-[11px] text-cmyk-magenta"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryEditor({ item, onClose, onSaved, isNew }) {
  const [g, setG] = useState({ ...item, id: item.id || `g_${Date.now()}` });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setG({ ...g, [k]: v });

  const upload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "gallery");
    const { data } = await axios.post(`${API}/upload`, fd, { withCredentials: true });
    set("image", `${process.env.REACT_APP_BACKEND_URL}${data.url}`);
    toast.success("Image uploaded");
  };

  const save = async () => {
    setBusy(true);
    try {
      if (isNew) await axios.post(`${API}/admin/gallery`, g, { withCredentials: true });
      else await axios.put(`${API}/admin/gallery/${g.id}`, g, { withCredentials: true });
      toast.success("Saved");
      onSaved();
    } catch (e) { toast.error("Save failed"); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div data-testid="gallery-editor" className="w-full max-w-md bg-ink-black border border-ink" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-ink">
          <div className="font-display text-2xl uppercase">{isNew ? "New" : "Edit"} Gallery Item</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <Input label="Title" testid="ge-title" value={g.title} onChange={(v) => set("title", v)} />
          <Field label="Category">
            <select data-testid="ge-category" value={g.category} onChange={(e) => set("category", e.target.value)} className="w-full bg-ink-surface border border-ink p-2 text-sm">
              {["T-Shirts", "Mugs", "Caps", "Keychains", "Bags", "Corporate Gifts"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Image">
            {g.image && <img src={g.image} alt="" className="w-full aspect-square object-cover border border-ink mb-2" />}
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-2 border border-ink px-3 py-2 text-xs uppercase tracking-wider cursor-pointer hover:border-cmyk-cyan">
                <Upload size={14} /> Upload
                <input data-testid="ge-file" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              <input data-testid="ge-image-url" value={g.image} onChange={(e) => set("image", e.target.value)} placeholder="Or paste URL" className="flex-1 bg-ink-surface border border-ink px-2 py-2 text-xs" />
            </div>
          </Field>
        </div>
        <div className="p-4 border-t border-ink flex justify-end gap-2">
          <button onClick={onClose} className="border border-ink px-4 py-2 text-xs uppercase tracking-wider">Cancel</button>
          <button data-testid="ge-save" disabled={busy} onClick={save} className="bg-cmyk-yellow text-black font-bold px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders }) {
  return (
    <div data-testid="orders-list" className="space-y-3">
      {orders.length === 0 && <div className="text-white/45 text-sm">No orders yet.</div>}
      {orders.map((o) => (
        <div key={o.id} className="border border-ink bg-ink-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg uppercase">{o.customer_name}</div>
              <div className="text-xs text-white/60">{o.customer_phone} · {o.items?.length} items · ₹{o.total_amount}</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cmyk-yellow">{o.status} · {String(o.created_at).slice(0, 16)}</div>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {o.items?.map((it, i) => (
              <div key={i} className="text-xs text-white/70 border border-ink p-2">
                {it.product_name} · {it.color} / {it.size} / {it.print_area} × {it.quantity} = ₹{it.unit_price * it.quantity}
                {it.artwork_url && <a className="block mt-1 text-cmyk-cyan break-all" href={`${process.env.REACT_APP_BACKEND_URL}${it.artwork_url}`} target="_blank" rel="noreferrer">Artwork ↗</a>}
                {it.notes && <div className="mt-1 text-white/50">{it.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactsTab({ contacts }) {
  return (
    <div data-testid="contacts-list" className="space-y-3">
      {contacts.length === 0 && <div className="text-white/45 text-sm">No enquiries yet.</div>}
      {contacts.map((c) => (
        <div key={c.id} className="border border-ink bg-ink-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg uppercase">{c.name} · <span className="text-cmyk-yellow text-sm">{c.order_type}</span></div>
              <div className="text-xs text-white/60">{c.phone} · {c.email}</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{String(c.created_at).slice(0, 16)}</div>
          </div>
          <p className="text-sm text-white/75 mt-2">{c.message}</p>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2">{label}</div>
      {children}
    </div>
  );
}
function Input({ label, testid, value, onChange, type = "text", disabled }) {
  return (
    <Field label={label}>
      <input data-testid={testid} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full bg-ink-surface border border-ink p-2 text-sm disabled:opacity-50" />
    </Field>
  );
}
function Row({ children }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
