"use client";

import { motion, useInView } from "framer-motion";
import {
  MapPin, Users, CheckCircle2, AlertTriangle, Navigation,
  ClipboardList, Phone, Star, Bus,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const FEATURES = [
  {
    icon: Navigation,
    title: "Turn-by-turn navigation",
    body: "Built-in navigation optimised for your assigned route — no external app needed. Just follow the stops.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: Users,
    title: "Digital student roster",
    body: "See every student assigned to today's trip. Mark boarding and drop-offs with a single tap — no paper, no radio.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: AlertTriangle,
    title: "One-tap SOS",
    body: "In an emergency, hit SOS. The school admin and all parents on the route are notified instantly with your live location.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: MapPin,
    title: "Auto GPS ping",
    body: "Your location is shared with parents and admin every 60 seconds — automatically, in the background.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: ClipboardList,
    title: "Trip logs",
    body: "Every trip is recorded — start time, stop sequence, boarding confirmations, end time. Compliance made effortless.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Bus,
    title: "Multi-vehicle support",
    body: "Assigned to more than one bus? Switch vehicles in two taps. Your roster and route update automatically.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
];

const TRIP_STEPS = [
  { step: 1, title: "Start trip",       desc: "Open the app, confirm your vehicle, tap Start Trip. GPS tracking begins." },
  { step: 2, title: "Board students",   desc: "At each stop, students appear on screen. Tap to confirm boarding in one touch." },
  { step: 3, title: "Drop & confirm",   desc: "Mark drops as you go. Parents receive instant notifications for each one." },
  { step: 4, title: "End & log",        desc: "Tap End Trip. The full log is saved automatically for school records." },
];

export default function DriverAppPage() {
  const featRef  = useRef<HTMLElement>(null);
  const featView = useInView(featRef, { once: true, margin: "-80px" });
  const stepsRef  = useRef<HTMLElement>(null);
  const stepsView = useInView(stepsRef, { once: true, margin: "-80px" });

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
            For Schools
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 border border-emerald-100 bg-emerald-50 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Driver App</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-ink leading-tight tracking-tight mb-6">
                Your route.<br />
                <span className="text-emerald-600">Digital and simple.</span>
              </h1>
              <p className="text-lg text-ink-muted leading-relaxed mb-10 max-w-lg">
                Manage boarding, track stops, send SOS, and log every trip — all from one app. No paperwork, no radio calls.
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
                  className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-surface-border text-ink rounded-2xl font-bold hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0"><path d="M3.18 23.76a2 2 0 0 0 2.76.77l11.06-6.39-2.63-2.62-11.19 8.24zM21.37 10.3 18.7 8.72 15.71 12l3.05 3.05 2.6-1.49a2.01 2.01 0 0 0 .01-3.26zM.96 1.04a2 2 0 0 0-.96 1.7v18.52c0 .72.4 1.35.96 1.7l.13.07L13.14 12v-.29L1.09.97.96 1.04zm14.77 13.83L3.18.24A2 2 0 0 0 .96 1.04l11.75 10.96 3-3.13z" fill="#4285F4"/></svg>
                  Google Play
                </a>
              </div>
              <p className="text-xs text-ink-faint">Provided by your school · No setup needed</p>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="relative w-[220px]">
                <div className="absolute -inset-8 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
                <div className="relative bg-emerald-600 rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)]">
                  <div className="h-8 flex items-center justify-center">
                    <div className="w-14 h-2.5 bg-black/20 rounded-full" />
                  </div>
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-white/70">Good morning, Ravi</p>
                        <p className="text-sm font-black text-white">Bus 12 · Morning trip</p>
                      </div>
                      <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-200">
                        <span className="w-1 h-1 rounded-full bg-emerald-200 animate-pulse" />LIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { v: "34",  l: "Students", c: "bg-white/20" },
                        { v: "9",   l: "Stops",    c: "bg-white/20" },
                        { v: "7:55", l: "ETA",     c: "bg-white/20" },
                      ].map((s) => (
                        <div key={s.l} className={`${s.c} rounded-xl p-2.5 text-center`}>
                          <p className="text-sm font-black text-white">{s.v}</p>
                          <p className="text-[7px] text-white/70 font-semibold">{s.l}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Student roster</p>
                      {[
                        { name: "Aarav Roy",   stop: "Stop 4", status: "waiting",  dot: "bg-amber-300" },
                        { name: "Mira Dutta",  stop: "Stop 5", status: "boarded",  dot: "bg-emerald-300" },
                        { name: "Riya Singh",  stop: "Stop 6", status: "boarded",  dot: "bg-emerald-300" },
                      ].map((s) => (
                        <div key={s.name} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          <p className="text-[9px] font-semibold text-white flex-1 truncate">{s.name}</p>
                          <span className="text-[7px] text-white/60">{s.stop}</span>
                        </div>
                      ))}
                    </div>

                    <motion.div
                      className="bg-red-500 rounded-2xl p-3 text-center"
                      animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 16px rgba(239,68,68,0.4)", "0 0 0px rgba(239,68,68,0)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-[11px] font-black text-white">🚨 SOS Emergency</p>
                    </motion.div>
                  </div>
                  <div className="h-5 flex items-center justify-center">
                    <div className="w-8 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-surface-border bg-surface-soft py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-5">
            {[
              { value: "10,000+", label: "Drivers active" },
              { value: "< 30s",   label: "SOS response time" },
              { value: "Zero",    label: "Missed boarding logs" },
              { value: "4.8★",    label: "Driver satisfaction" },
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
              Built for drivers.
            </h2>
            <p className="text-lg text-ink-muted max-w-xl mx-auto">
              Simple enough to use while focused on driving. Powerful enough to replace every paper log.
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

      {/* How a trip works */}
      <section ref={stepsRef} className="py-24 bg-surface-soft border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stepsView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-black text-ink tracking-tight mb-4">How a trip works</h2>
            <p className="text-lg text-ink-muted">From engine start to final drop — four steps, fully digital.</p>
          </motion.div>

          <div className="space-y-0">
            {TRIP_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -16 }}
                animate={stepsView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex gap-5"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 z-10">
                    {s.step}
                  </div>
                  {i < TRIP_STEPS.length - 1 && <div className="w-px flex-1 my-2 bg-surface-border" />}
                </div>
                <div className={i < TRIP_STEPS.length - 1 ? "pb-8 pt-1.5" : "pt-1.5"}>
                  <p className="font-black text-ink text-base mb-1">{s.title}</p>
                  <p className="text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl font-black text-ink mb-2">Drivers prefer Skippo</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Before Skippo I was managing paper lists at every stop. Now I just tap a name — takes two seconds and parents are notified automatically.", name: "Ravi Kumar", school: "DPS Delhi Driver" },
              { quote: "The SOS button gives me real confidence. I know that if anything goes wrong, help is a single tap away.", name: "Suresh Babu", school: "Greenfield Academy Driver" },
              { quote: "I have four different routes across the week. Skippo switches my roster automatically when I confirm my vehicle. Never had it this easy.", name: "Mohammed Rafiq", school: "Sunrise International Driver" },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-surface-border rounded-2xl p-6 shadow-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-ink leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-emerald-600">{t.name[0]}</span>
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
      <section className="py-20 bg-emerald-600 relative overflow-hidden">
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Ready to go digital?
          </h2>
          <p className="text-white/75 text-lg mb-10">
            Ask your school admin to activate Skippo. The app will be ready on your first assigned trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-7 py-3.5 bg-white text-ink rounded-2xl font-bold hover:bg-emerald-50 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-ink flex-shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-7 py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl font-bold hover:bg-white/25 transition-colors">
              Google Play
            </a>
          </div>
          <p className="text-white/60 text-xs">
            Is your school not on Skippo yet?{" "}
            <Link href="/signup" className="text-white font-semibold hover:text-white/90 underline underline-offset-2">
              Get them started
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
            <Link href="/app/parent" className="hover:text-ink transition-colors">Parent App</Link>
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
