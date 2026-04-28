"use client";

import { motion, useInView } from "framer-motion";
import {
  MapPin, Bell, Shield, Phone, CheckCircle2, ArrowRight,
  Star, MessageSquare, CreditCard, Bus,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const FEATURES = [
  {
    icon: MapPin,
    title: "Live bus tracking",
    body: "See your child's bus on a live map, updated every 60 seconds. Know exactly where they are, every morning.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: Bell,
    title: "Instant boarding alerts",
    body: "Get notified the moment your child boards and drops off — no more calling the school to confirm.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Shield,
    title: "SOS & emergency alerts",
    body: "If the driver triggers an emergency, you receive an instant alert with location. Help is coordinated within seconds.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: MessageSquare,
    title: "Teacher progress notes",
    body: "Receive weekly AI-generated digest reports: attendance, strengths, areas to work on — in simple language.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: CreditCard,
    title: "Fee payments",
    body: "Pay school fees directly in the app via UPI, cards, or net banking. Get instant digital receipts.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Phone,
    title: "Driver contact",
    body: "Call the driver directly from the app with one tap — no need to find a number or go through the school.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
];

const SCREENSHOTS = [
  {
    label: "Live map",
    color: "bg-brand-600",
    content: (
      <div className="space-y-2 px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[9px] text-white/70">Good morning, Priya</p>
            <p className="text-xs font-black text-white">Aarav&apos;s Bus</p>
          </div>
          <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-300">
            <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />LIVE
          </span>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-white">8</p>
          <p className="text-[9px] text-white/70">min ETA</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-emerald-500/30 rounded-lg p-2 text-center">
            <p className="text-[9px] font-bold text-emerald-200">Stop 4 / 9</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-[9px] font-bold text-white">Call driver</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Alert",
    color: "bg-emerald-600",
    content: (
      <div className="space-y-2 px-3 pt-3 pb-2">
        <div className="bg-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
          <p className="text-2xl">✅</p>
          <p className="text-xs font-black text-white">Aarav has boarded!</p>
          <p className="text-[9px] text-emerald-200">Bus 12 · North Route A · 7:42 AM</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 space-y-1">
          <p className="text-[9px] text-white/70 uppercase tracking-wider font-bold">Today&apos;s trip</p>
          <div className="flex justify-between text-[10px]">
            <span className="text-white/80">Boarded at stop 4</span>
            <span className="text-emerald-300 font-bold">7:42 AM</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-white/80">Estimated drop</span>
            <span className="text-white font-bold">~7:55 AM</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Weekly report",
    color: "bg-violet-600",
    content: (
      <div className="space-y-2 px-3 pt-3 pb-2">
        <div>
          <p className="text-[9px] text-white/70">Weekly digest</p>
          <p className="text-xs font-black text-white">Aarav Roy · Grade 8B</p>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { v: "4/5", l: "Attendance", c: "bg-emerald-500/30 text-emerald-200" },
            { v: "A−", l: "Performance", c: "bg-amber-500/30 text-amber-200" },
            { v: "2", l: "Highlights", c: "bg-violet-500/30 text-violet-200" },
          ].map((s) => (
            <div key={s.l} className={`${s.c} rounded-lg p-2 text-center`}>
              <p className="text-sm font-black">{s.v}</p>
              <p className="text-[7px] font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/10 rounded-xl p-2.5">
          <p className="text-[8px] font-bold text-white/70 uppercase mb-1">Strengths</p>
          <p className="text-[9px] text-white/90 leading-relaxed">Excellent problem-solving in Math. Active participation in Science discussions.</p>
        </div>
      </div>
    ),
  },
];

export default function ParentAppPage() {
  const featRef  = useRef<HTMLElement>(null);
  const featView = useInView(featRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-[68px] border-b border-surface-border flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-ink text-lg">Skippo</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-sm font-bold text-ink-muted hover:text-ink transition-colors">Sign In</Link>
          <Link href="/signup" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-100/50 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 border border-brand-100 bg-brand-50 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-widest">Parent App</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-ink leading-tight tracking-tight mb-6">
                Your child is safe.{" "}
                <span className="text-brand-600">You&apos;ll always know.</span>
              </h1>
              <p className="text-lg text-ink-muted leading-relaxed mb-10 max-w-lg">
                Live bus tracking, instant boarding alerts, teacher updates, and fee payments — everything you need for a stress-free school day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-3.5 bg-ink text-white rounded-2xl font-bold hover:bg-ink/90 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-surface-border text-ink rounded-2xl font-bold hover:border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0"><path d="M3.18 23.76a2 2 0 0 0 2.76.77l11.06-6.39-2.63-2.62-11.19 8.24zM21.37 10.3 18.7 8.72 15.71 12l3.05 3.05 2.6-1.49a2.01 2.01 0 0 0 .01-3.26zM.96 1.04a2 2 0 0 0-.96 1.7v18.52c0 .72.4 1.35.96 1.7l.13.07L13.14 12v-.29L1.09.97.96 1.04zm14.77 13.83L3.18.24A2 2 0 0 0 .96 1.04l11.75 10.96 3-3.13z" fill="#4285F4"/></svg>
                  Google Play
                </a>
              </div>
              <p className="text-xs text-ink-faint">Free to download · Your school provides access</p>
            </motion.div>

            {/* Phone mockups */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex justify-center gap-4"
            >
              {SCREENSHOTS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className={`relative w-[140px] ${i === 1 ? "mt-0" : i === 0 ? "mt-8" : "mt-16"}`}
                >
                  <div className={`rounded-[1.75rem] overflow-hidden border border-white/20 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.2)] ${s.color}`}>
                    <div className="h-6 flex items-center justify-center">
                      <div className="w-10 h-2 bg-black/20 rounded-full" />
                    </div>
                    {s.content}
                    <div className="h-4 flex items-center justify-center pb-1">
                      <div className="w-8 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-surface-border bg-surface-soft py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-5">
            {[
              { value: "50,000+", label: "Parents active" },
              { value: "4.9★",    label: "App Store rating" },
              { value: "< 60s",   label: "Bus update interval" },
              { value: "100%",    label: "SOS delivery rate" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-ink mb-0.5">{s.value}</p>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section ref={featRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">
              Everything a parent needs.
            </h2>
            <p className="text-lg text-ink-muted max-w-xl mx-auto">
              From the moment the bus leaves school until your child is safely home.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={featView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-white border border-surface-border rounded-2xl p-6 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={f.color} />
                  </div>
                  <h3 className="font-black text-ink text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface-soft border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl font-black text-ink mb-2">Parents trust Skippo</h2>
            <p className="text-ink-muted">Rated 4.9 stars across App Store and Google Play.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "I used to call the school every morning to check if the bus had picked up my daughter. Now I just watch the app — it's incredibly reassuring.", name: "Sunita Mehta", school: "Greenfield Academy" },
              { quote: "The boarding alert arrived before my son even texted me. Skippo is the first time tech has actually reduced my parenting anxiety.", name: "Arvind Kumar", school: "DPS Bangalore" },
              { quote: "The weekly report is the best — I know exactly what subjects need more attention without waiting for the PTM.", name: "Priya Nair", school: "Sunrise International" },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-surface-border p-6 shadow-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-ink leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-brand-600">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-600 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Download Skippo today.
          </h2>
          <p className="text-white/75 text-lg mb-10">
            Ask your school to activate Skippo, then download the app and link your child in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-7 py-3.5 bg-white text-ink rounded-2xl font-bold hover:bg-brand-50 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-ink flex-shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-7 py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl font-bold hover:bg-white/25 transition-colors">
              Google Play
            </a>
          </div>
          <p className="text-white/60 text-xs">
            Already have Skippo?{" "}
            <Link href="/signin" className="text-white font-semibold hover:text-white/90 underline underline-offset-2">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Skippo" className="w-7 h-7" />
            <span className="font-black text-ink">Skippo</span>
          </Link>
          <div className="flex gap-6 text-sm text-ink-muted">
            <Link href="/app/driver" className="hover:text-ink transition-colors">Driver App</Link>
            <Link href="/app/teacher" className="hover:text-ink transition-colors">Teacher App</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Admin Dashboard</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-ink-faint">© 2026 Skippo Technologies</p>
        </div>
      </footer>
    </div>
  );
}
