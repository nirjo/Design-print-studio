import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Star, Upload, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { Toaster, toast } from "sonner";
import { BRAND, buildWhatsAppLink } from "../lib/brand";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Google review search by shop name — works even without a Place ID
const GOOGLE_REVIEW_URL = `https://www.google.com/search?q=${encodeURIComponent("Aiel Design and Printing Studio Puducherry")}#lrd=0x0,3`;

export default function Review() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    order_id: sp.get("id") || "",
    phone: sp.get("phone") || "",
    rating: 5,
    text: "",
    photo_url: "",
    allow_showcase: true,
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("Max 25 MB"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "reviews");
      const { data } = await axios.post(`${API}/upload`, fd);
      setForm((f) => ({ ...f, photo_url: data.url }));
      setPhotoPreview(`${process.env.REACT_APP_BACKEND_URL}${data.url}`);
      toast.success("Photo added");
    } catch (e) { toast.error("Upload failed"); }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.phone) { toast.error("Order ID & phone required"); return; }
    setBusy(true);
    try {
      await axios.post(`${API}/reviews`, form);
      setDone(true);
      toast.success("Thank you!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not submit");
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div data-testid="review-success" className="pt-32 pb-20 min-h-[60vh] flex items-center justify-center px-5">
        <div className="max-w-xl w-full border border-ink bg-ink-surface p-10 text-center crop-marks relative">
          <CheckCircle2 className="text-whatsapp mx-auto" size={56} />
          <h1 className="font-display text-5xl uppercase mt-4">Thank You!</h1>
          <p className="text-white/65 mt-3">Your review makes our day. One last favour — drop us a 5★ on Google so other folks find Aiel too.</p>
          <a
            data-testid="google-review-link"
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-cmyk-yellow text-black font-bold px-5 py-3 text-sm uppercase tracking-wider hover:bg-white"
          >
            <Star size={16} /> Review on Google <ExternalLink size={14} />
          </a>
          <div className="mt-3">
            <button onClick={() => navigate("/")} className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-cmyk-cyan">
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="review-page" className="pt-24 md:pt-32 pb-16">
      <Toaster theme="dark" position="top-right" />
      <section className="max-w-2xl mx-auto px-5 md:px-10">
        <div className="text-xs uppercase tracking-[0.3em] text-cmyk-magenta mb-3">/ Leave a Review</div>
        <h1 className="font-display text-5xl md:text-6xl uppercase leading-[0.9]">
          How did <span className="text-cmyk-yellow">we</span> do?
        </h1>
        <p className="mt-3 text-white/60">Your photo + a kind word helps {BRAND.name} keep printing.</p>

        <form onSubmit={submit} className="mt-8 border border-ink bg-ink-surface p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Order ID / short code" value={form.order_id} onChange={(v) => setForm({ ...form, order_id: v })} testid="review-order-id" />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="review-phone" />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2">Rating</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  data-testid={`star-${n}`}
                  onClick={() => setForm({ ...form, rating: n })}
                  className={`p-2 transition-colors ${n <= form.rating ? "text-cmyk-yellow" : "text-white/25 hover:text-white/50"}`}
                >
                  <Star size={32} fill={n <= form.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2">Your words</div>
            <textarea
              data-testid="review-text"
              rows="4"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="What did you love? Quality, turnaround, design help — anything."
              className="w-full bg-ink-black border border-ink p-3 text-sm focus:border-cmyk-cyan outline-none resize-none"
            />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2">Wearing it photo (optional)</div>
            {photoPreview ? (
              <div className="flex items-center gap-3 border border-ink p-3">
                <img src={photoPreview} alt="" className="w-20 h-20 object-cover" />
                <button type="button" onClick={() => { setPhotoPreview(""); setForm((f) => ({ ...f, photo_url: "" })); }} className="text-xs text-cmyk-magenta hover:underline">Remove</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-ink hover:border-cmyk-cyan p-4 cursor-pointer">
                <Upload size={16} />
                <span className="text-sm uppercase tracking-wider">{busy ? "Uploading…" : "Upload Photo"}</span>
                <input data-testid="review-photo" type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              data-testid="review-allow-showcase"
              type="checkbox"
              checked={form.allow_showcase}
              onChange={(e) => setForm({ ...form, allow_showcase: e.target.checked })}
              className="accent-cmyk-yellow"
            />
            Allow Aiel to feature this review & photo on the website
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              data-testid="review-submit"
              type="submit"
              disabled={busy}
              className="flex-1 bg-cmyk-yellow text-black font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50"
            >
              <Send size={16} /> Submit Review
            </button>
            <a
              data-testid="review-skip-wa"
              href={buildWhatsAppLink(`Hi! I just received my Aiel order — wanted to share feedback directly.`)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-whatsapp text-black font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white"
            >
              WhatsApp Instead
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, testid }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2">{label}</div>
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-black border border-ink p-2.5 text-sm focus:border-cmyk-cyan outline-none"
      />
    </div>
  );
}
