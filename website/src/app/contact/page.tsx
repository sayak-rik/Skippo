"use client";

import Link from "next/link";
import { useState } from "react";

const ENQUIRY_TYPES = [
  { label: "Register my school",   emoji: "🏫" },
  { label: "General question",     emoji: "💬" },
  { label: "Demo request",         emoji: "📱" },
  { label: "Partnership",          emoji: "🤝" },
  { label: "Support / bug report", emoji: "🔧" },
  { label: "Other",                emoji: "✉️" },
];

export default function ContactPage() {
  const [enquiryType, setEnquiryType] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", school: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function canSubmit() {
    return !!(enquiryType && form.name && form.email && form.message);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1100);
  }

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      {/* Nav */}
      <nav className="h-16 border-b border-surface-border bg-surface/80 nav-blur flex items-center px-6 fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <span className="font-black text-ink">Skippo</span>
        </Link>
        <div className="flex-1" />
        <Link href="/signup" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-brand">
          Get started
        </Link>
      </nav>

      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14 animate-fade-up">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.2em] mb-3">Get in touch</p>
            <h1 className="text-5xl font-black text-ink tracking-tight mb-4">We&apos;d love to hear from you</h1>
            <p className="text-ink-muted max-w-lg mx-auto">
              Whether you want to register your school, request a demo, or just say hello —
              we reply within one business day.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Left: info panels */}
            <div className="lg:col-span-2 space-y-5">
              {[
                {
                  emoji: "📧",
                  title: "Email us",
                  body:  "hello@skippo.in",
                  sub:   "We respond within 24 hours.",
                },
                {
                  emoji: "📞",
                  title: "Call us",
                  body:  "+91 98765 00000",
                  sub:   "Mon–Fri, 9 AM – 6 PM IST",
                },
                {
                  emoji: "🏢",
                  title: "Office",
                  body:  "Kolkata, West Bengal",
                  sub:   "India 🇮🇳",
                },
              ].map((c) => (
                <div key={c.title} className="bg-surface rounded-3xl border border-surface-border p-5 flex gap-4 animate-fade-up fill-both card-hover">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{c.emoji}</span>
                  </div>
                  <div>
                    <p className="font-black text-ink text-sm mb-0.5">{c.title}</p>
                    <p className="text-brand-600 text-sm font-semibold">{c.body}</p>
                    <p className="text-ink-faint text-xs mt-0.5">{c.sub}</p>
                  </div>
                </div>
              ))}

              {/* Quote */}
              <div className="bg-brand-600 rounded-3xl p-6 text-white animate-fade-up fill-both delay-300">
                <p className="text-sm font-medium leading-relaxed text-white/90 mb-4">
                  &ldquo;Skippo reduced our daily transport chaos to a five-minute morning
                  routine. Parents stopped calling to ask where the bus is.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-black">PS</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Priya Sen</p>
                    <p className="text-xs text-white/60">Principal, Sunrise Academy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3">
              {sent ? (
                <div className="bg-surface rounded-4xl border border-surface-border shadow-lift p-10 text-center animate-fade-up">
                  <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-5">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h2 className="text-2xl font-black text-ink mb-3">Message received!</h2>
                  <p className="text-ink-muted mb-8 max-w-sm mx-auto">
                    Thanks, <strong className="text-ink">{form.name}</strong>! We&apos;ll get back to you at{" "}
                    <strong className="text-ink">{form.email}</strong> within one business day.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/" className="px-5 py-2.5 border border-surface-border rounded-xl text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
                      ← Homepage
                    </Link>
                    <Link href="/signup" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-brand">
                      Register school
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-surface rounded-4xl border border-surface-border shadow-lift p-8 space-y-6 animate-fade-up">
                  {/* Enquiry type */}
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-2">
                      What can we help with? <span className="text-brand-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ENQUIRY_TYPES.map((t) => (
                        <button
                          type="button"
                          key={t.label}
                          onClick={() => setEnquiryType(t.label)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            enquiryType === t.label
                              ? "border-brand-600 bg-brand-50 text-brand-700"
                              : "border-surface-border bg-surface text-ink-muted hover:border-brand-200"
                          }`}
                        >
                          <span>{t.emoji}</span>
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name + email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Your name",   key: "name",  type: "text",  placeholder: "Priya Sharma", required: true  },
                      { label: "Work email",  key: "email", type: "email", placeholder: "priya@school.edu", required: true },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-semibold text-ink mb-1.5">
                          {f.label} {f.required && <span className="text-brand-500">*</span>}
                        </label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => set(f.key as keyof typeof form, e.target.value)}
                          placeholder={f.placeholder}
                          required={f.required}
                          className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface text-ink text-sm
                            placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Phone + school */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Phone",        key: "phone",  type: "tel",  placeholder: "+91 98765 43210", required: false },
                      { label: "School name",  key: "school", type: "text", placeholder: "Greenfield Public School", required: false },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-semibold text-ink mb-1.5">
                          {f.label} <span className="text-ink-faint text-xs">(optional)</span>
                        </label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => set(f.key as keyof typeof form, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface text-ink text-sm
                            placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      Message <span className="text-brand-500">*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="Tell us what you're looking for, any questions you have, or just say hello…"
                      rows={4}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface text-ink text-sm
                        placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                        transition-all resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-ink-faint">
                      We reply within <span className="font-semibold text-ink-muted">24 hours</span>.
                    </p>
                    <button
                      type="submit"
                      disabled={!canSubmit() || loading}
                      className="px-7 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm
                        hover:bg-brand-700 transition-colors shadow-brand
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                        flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                          </svg>
                          Sending…
                        </>
                      ) : (
                        "Send message →"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
