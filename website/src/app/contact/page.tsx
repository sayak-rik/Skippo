"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const COUNTRIES = [
  { code: "IN", dial: "+91",  name: "India",         flag: "🇮🇳", digits: 10 },
  { code: "US", dial: "+1",   name: "United States", flag: "🇺🇸", digits: 10 },
  { code: "GB", dial: "+44",  name: "United Kingdom",flag: "🇬🇧", digits: 10 },
  { code: "AE", dial: "+971", name: "UAE",           flag: "🇦🇪", digits: 9  },
  { code: "SG", dial: "+65",  name: "Singapore",     flag: "🇸🇬", digits: 8  },
  { code: "AU", dial: "+61",  name: "Australia",     flag: "🇦🇺", digits: 9  },
  { code: "CA", dial: "+1",   name: "Canada",        flag: "🇨🇦", digits: 10 },
  { code: "NZ", dial: "+64",  name: "New Zealand",   flag: "🇳🇿", digits: 9  },
  { code: "ZA", dial: "+27",  name: "South Africa",  flag: "🇿🇦", digits: 9  },
  { code: "NG", dial: "+234", name: "Nigeria",       flag: "🇳🇬", digits: 10 },
  { code: "BD", dial: "+880", name: "Bangladesh",    flag: "🇧🇩", digits: 10 },
  { code: "PK", dial: "+92",  name: "Pakistan",      flag: "🇵🇰", digits: 10 },
  { code: "LK", dial: "+94",  name: "Sri Lanka",     flag: "🇱🇰", digits: 9  },
  { code: "NP", dial: "+977", name: "Nepal",         flag: "🇳🇵", digits: 10 },
];

function getPhoneError(dial: string, number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const country = COUNTRIES.find(c => c.dial === dial);
  if (country && digits.length !== country.digits) {
    return `${country.name} numbers are ${country.digits} digits`;
  }
  if (!country && (digits.length < 7 || digits.length > 15)) {
    return "Enter a valid phone number";
  }
  return null;
}

const ENQUIRY_TYPES = [
  { label: "Register my school",   icon: "🏫" },
  { label: "Product walkthrough",   icon: "📱" },
  { label: "General question",     icon: "💬" },
  { label: "Partnership",          icon: "🤝" },
  { label: "Support / bug report", icon: "🔧" },
  { label: "Other",                icon: "✉️" },
];

const CONTACT_ITEMS = [
  { icon: Mail,  title: "Email us",  body: "hello@skippo.co.in",   sub: "We respond within 24 hours." },
  { icon: Phone, title: "Call us",   body: "+91 98765 00000",   sub: "Mon–Fri, 9 AM – 6 PM IST"   },
  { icon: MapPin, title: "Office",   body: "Kolkata, West Bengal", sub: "India 🇮🇳"               },
];

export default function ContactPage() {
  const [enquiryType, setEnquiryType] = useState("");
  const [form, setForm]  = useState({ name: "", email: "", countryDial: "+91", phone: "", school: "", message: "" });
  const [sent, setSent]  = useState(false);
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function canSubmit() {
    return !!(enquiryType && form.name && form.email && form.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit()) return;
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      await fetch(`${apiBase}/api/tenancy/interests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiry_type: enquiryType,
          name:    form.name,
          email:   form.email,
          phone:   form.phone ? `${form.countryDial}${form.phone.replace(/\s/g, "")}` : "",
          school:  form.school,
          message: form.message,
        }),
      });
    } catch {
      // Silently continue — user sees success regardless to avoid exposing infra errors
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Nav */}
      <nav className="h-16 border-b border-dark-border bg-dark/80 nav-blur flex items-center px-6 fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-white">Skippo</span>
        </Link>
        <div className="flex-1" />
        <Link
          href="/signup"
          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:shadow-brand transition-shadow"
        >
          Get started
        </Link>
      </nav>

      <div className="pt-28 pb-20 px-5">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Get in touch</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">
              We&apos;d love to hear from you
            </h1>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Whether you want to register your school, get a product walkthrough, or just say hello —
              we reply within one business day.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: info panels */}
            <div className="lg:col-span-2 space-y-4">
              {CONTACT_ITEMS.map((c, i) => {
                const Icon = c.icon;
                return (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                    className="card-hover-dark bg-dark-card border border-dark-border rounded-3xl p-5 flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-brand-900/40 border border-brand-700/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm mb-0.5">{c.title}</p>
                      <p className="text-brand-400 text-sm font-semibold">{c.body}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{c.sub}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Testimonial quote */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative bg-gradient-to-br from-brand-600 to-violet-700 rounded-3xl p-6 overflow-hidden"
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
                <p className="text-sm font-medium leading-relaxed text-white/90 mb-5 relative z-10 italic">
                  &ldquo;Skippo reduced our daily transport chaos to a five-minute morning
                  routine. Parents stopped calling to ask where the bus is.&rdquo;
                </p>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-black text-white">PS</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Priya Sen</p>
                    <p className="text-xs text-white/60">Principal, Sunrise Academy</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-dark-card border border-dark-border rounded-4xl p-10 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-brand-900/50 border border-brand-700/30 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={36} className="text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Message received!</h2>
                    <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                      Thanks, <strong className="text-white">{form.name}</strong>! We&apos;ll get back to you at{" "}
                      <strong className="text-white">{form.email}</strong> within one business day.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link
                        href="/"
                        className="px-5 py-2.5 border border-dark-border rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                      >
                        ← Homepage
                      </Link>
                      <Link
                        href="/signup"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-xl text-sm font-bold shadow-brand"
                      >
                        Register school <ArrowRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-dark-card border border-dark-border rounded-4xl p-8 space-y-6"
                  >
                    {/* Enquiry type */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-2.5">
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
                                ? "border-brand-500 bg-brand-900/40 text-brand-300"
                                : "border-dark-border bg-dark text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span className="truncate">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name + email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { label: "Your name",  key: "name",  type: "text",  placeholder: "Priya Sharma",         required: true  },
                        { label: "Work email", key: "email", type: "email", placeholder: "priya@school.edu",      required: true  },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                            {f.label} {f.required && <span className="text-brand-500">*</span>}
                          </label>
                          <input
                            type={f.type}
                            value={form[f.key as keyof typeof form]}
                            onChange={(e) => set(f.key as keyof typeof form, e.target.value)}
                            placeholder={f.placeholder}
                            required={f.required}
                            className="w-full px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
                              placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                              transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Phone + school */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                          Phone <span className="text-zinc-600 text-xs">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={form.countryDial}
                            onChange={e => set("countryDial", e.target.value)}
                            className="flex-shrink-0 px-3 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
                              focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                            style={{ minWidth: "5.5rem" }}
                          >
                            {COUNTRIES.map(c => (
                              <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => set("phone", e.target.value.replace(/[^\d\s\-]/g, ""))}
                            placeholder={`${COUNTRIES.find(c => c.dial === form.countryDial)?.digits ?? 10}-digit number`}
                            className="flex-1 px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
                              placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                              transition-all"
                          />
                        </div>
                        {form.phone && getPhoneError(form.countryDial, form.phone) && (
                          <p className="text-xs text-red-400 mt-1.5">{getPhoneError(form.countryDial, form.phone)}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                          School name <span className="text-zinc-600 text-xs">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.school}
                          onChange={(e) => set("school", e.target.value)}
                          placeholder="Greenfield Public School"
                          className="w-full px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
                            placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                            transition-all"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                        Message <span className="text-brand-500">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => set("message", e.target.value)}
                        placeholder="Tell us what you're looking for, any questions, or just say hello…"
                        rows={4}
                        required
                        className="w-full px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
                          placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                          transition-all resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-zinc-600">
                        Reply within <span className="font-semibold text-zinc-400">24 hours</span>.
                      </p>
                      <motion.button
                        whileHover={{ scale: canSubmit() && !loading ? 1.03 : 1 }}
                        whileTap={{ scale: canSubmit() && !loading ? 0.97 : 1 }}
                        type="submit"
                        disabled={!canSubmit() || loading}
                        className="btn-shine flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold text-sm
                          shadow-brand hover:shadow-brand-lg transition-shadow
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {loading ? (
                          <><Loader2 size={15} className="animate-spin" /> Sending…</>
                        ) : (
                          <>Send message <ArrowRight size={14} /></>
                        )}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
