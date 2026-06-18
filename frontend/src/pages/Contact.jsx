import React, { useState } from "react";
import axios from "axios";
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { BRAND, buildWhatsAppLink } from "../lib/brand";
import { toast, Toaster } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", order_type: "general", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success("Enquiry sent! We'll get back to you on WhatsApp.");
      setForm({ name: "", phone: "", email: "", order_type: "general", message: "" });
    } catch (err) {
      toast.error("Could not send right now. Please use WhatsApp.");
    }
    setBusy(false);
  };

  const waMsg = `*Bulk / Custom Enquiry*\nName: ${form.name}\nPhone: ${form.phone}\nType: ${form.order_type}\n${form.message}`;

  return (
    <div data-testid="contact-page" className="pt-24 md:pt-32 pb-16">
      <Toaster theme="dark" position="top-right" />
      <section className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="text-xs uppercase tracking-[0.3em] text-cmyk-cyan mb-3">/ Get in Touch</div>
        <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9]">
          Let's <span className="text-cmyk-magenta">print</span> something <br />
          <span className="font-script normal-case tracking-normal text-cmyk-yellow text-7xl md:text-9xl">unforgettable.</span>
        </h1>

        <div className="mt-12 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-ink bg-ink-surface p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-cmyk-yellow">WhatsApp / Phone</div>
              <a data-testid="contact-phone" href={buildWhatsAppLink("Hi Aiel!")} target="_blank" rel="noreferrer" className="block mt-2 font-display text-3xl hover:text-cmyk-cyan">{BRAND.phone}</a>
              <div className="text-xs text-white/50 mt-1">Mon – Sun · 9 AM – 9 PM</div>
            </div>
            <div className="border border-ink bg-ink-surface p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-cmyk-yellow">Email</div>
              <a data-testid="contact-email" href={`mailto:${BRAND.email}`} className="block mt-2 font-display text-2xl break-all hover:text-cmyk-cyan">{BRAND.email}</a>
            </div>
            <div className="border border-ink bg-ink-surface p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-cmyk-yellow">Studio</div>
              <div className="mt-2 font-display text-2xl">{BRAND.location}</div>
              <div className="text-xs text-white/50 mt-2">GST: {BRAND.gst}</div>
            </div>
          </div>

          <form data-testid="contact-form" onSubmit={submit} className="lg:col-span-7 border border-ink bg-ink-surface p-6 md:p-10">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your Name" testid="contact-name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Phone" testid="contact-phone-input" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            </div>
            <div className="mt-4">
              <Field label="Email (optional)" testid="contact-email-input" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="mt-4">
              <label className="block text-xs uppercase tracking-[0.2em] text-white/55 mb-2">Order Type</label>
              <select
                data-testid="contact-order-type"
                value={form.order_type}
                onChange={(e) => setForm({ ...form, order_type: e.target.value })}
                className="w-full bg-ink-black border border-ink px-3 py-3 text-sm focus:border-cmyk-cyan outline-none"
              >
                <option value="general">General Enquiry</option>
                <option value="bulk">Bulk Order (50+ pcs)</option>
                <option value="corporate">Corporate / School</option>
                <option value="team">Team / Sports Uniforms</option>
                <option value="design">Custom Design Help</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-xs uppercase tracking-[0.2em] text-white/55 mb-2">Tell us about your project</label>
              <textarea
                data-testid="contact-message"
                rows="5"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-ink-black border border-ink px-3 py-3 text-sm focus:border-cmyk-cyan outline-none resize-none"
                placeholder="Quantity, colors, sizes, deadline, artwork links…"
              />
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button data-testid="contact-submit" type="submit" disabled={busy} className="flex-1 bg-cmyk-yellow text-black font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50">
                <Send size={16} /> Send Enquiry
              </button>
              <a data-testid="contact-wa-direct" href={buildWhatsAppLink(waMsg)} target="_blank" rel="noreferrer" className="flex-1 bg-whatsapp text-black font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white">
                <MessageCircle size={16} /> WhatsApp Instead
              </a>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, testid, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.2em] text-white/55 mb-2">{label}</label>
      <input
        data-testid={testid}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-black border border-ink px-3 py-3 text-sm focus:border-cmyk-cyan outline-none"
      />
    </div>
  );
}
