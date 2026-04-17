"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 nav-blur transition-all duration-300 ${
        scrolled ? "bg-white/90 border-b border-surface-border shadow-card" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-brand">
            <span className="text-white text-sm font-black">S</span>
          </div>
          <span className="text-lg font-black text-ink tracking-tight">Skippo</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features",   href: "#features"   },
            { label: "How it works", href: "#how-it-works" },
            { label: "For schools", href: "#for-schools" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden md:block text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-brand"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── PhoneMockup ───────────────────────────────────────────────────────────────
// Pure CSS phone frame showing a simplified live-tracking card

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px]">
      {/* Glow */}
      <div className="absolute inset-0 blur-3xl bg-brand-500/20 rounded-full scale-110" />

      {/* Frame */}
      <div className="relative bg-white border-2 border-surface-border rounded-[2.5rem] overflow-hidden shadow-lift">
        {/* Status bar */}
        <div className="h-10 bg-surface-soft flex items-center justify-between px-5 pt-2">
          <span className="text-[10px] font-semibold text-ink-muted">9:41</span>
          <div className="w-16 h-4 bg-ink-faint/30 rounded-full" />
          <div className="flex gap-1">
            {[3, 2, 1].map((i) => (
              <div key={i} className={`w-1 rounded-sm bg-ink-faint/60`} style={{ height: `${4 + i * 3}px` }} />
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 space-y-3 bg-surface-soft">
          {/* Header */}
          <div className="pt-2">
            <p className="text-[10px] text-ink-muted font-medium">Good morning</p>
            <p className="text-sm font-black text-ink">Aarav&apos;s Bus</p>
          </div>

          {/* ETA card */}
          <div className="bg-brand-600 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <p className="text-[9px] font-semibold text-white/70 uppercase tracking-wider">Arriving in</p>
            <p className="text-3xl font-black mt-0.5">8 <span className="text-lg font-semibold text-white/80">min</span></p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse-dot" />
              <p className="text-[9px] font-semibold text-white/80">LIVE · Bus 12 · North Route A</p>
            </div>
          </div>

          {/* Location ping row */}
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-card">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">📍</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink">Lakeview Stop</p>
              <p className="text-[9px] text-ink-muted">Updated 42 seconds ago</p>
            </div>
          </div>

          {/* Driver contact */}
          <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-[10px] font-black text-brand-700">RK</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink">Rohit Kumar</p>
                <p className="text-[9px] text-ink-muted">Your driver</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-xs">📞</span>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-sm mt-0.5">🔔</span>
            <div>
              <p className="text-[10px] font-bold text-amber-900">Aarav boarded safely</p>
              <p className="text-[9px] text-amber-700">Bus 12 at 7:42 AM · Stop confirmed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DriverMockup ──────────────────────────────────────────────────────────────

function DriverMockup() {
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="absolute inset-0 blur-3xl bg-emerald-500/15 rounded-full scale-110" />
      <div className="relative bg-white border-2 border-surface-border rounded-[2.5rem] overflow-hidden shadow-lift">
        <div className="h-10 bg-ink flex items-center justify-between px-5 pt-2">
          <span className="text-[10px] font-semibold text-white/60">9:41</span>
          <div className="w-16 h-4 bg-white/20 rounded-full" />
          <div className="flex gap-1">
            {[3, 2, 1].map((i) => (
              <div key={i} className="w-1 rounded-sm bg-white/40" style={{ height: `${4 + i * 3}px` }} />
            ))}
          </div>
        </div>

        <div className="bg-ink px-4 pb-4 space-y-3">
          <div className="pt-1">
            <p className="text-[9px] text-white/50 font-medium">Driver Dashboard</p>
            <p className="text-sm font-black text-white">Rohit Kumar</p>
          </div>

          {/* Trip active card */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white">Bus 12 · North Route A</p>
              <span className="text-[8px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-base font-black text-white">3/4</p>
                <p className="text-[8px] text-white/50">Boarded</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-base font-black text-green-400">8</p>
                <p className="text-[8px] text-white/50">ETA min</p>
              </div>
            </div>
          </div>

          {/* Roster */}
          <div className="space-y-1.5">
            {[
              { name: "Aarav Roy",  stop: "Lakeview Stop",  status: "boarded", color: "bg-green-500" },
              { name: "Mira Dutta", stop: "Pine Street",    status: "boarded", color: "bg-green-500" },
              { name: "Sia Das",    stop: "City Center",    status: "absent",  color: "bg-amber-500" },
            ].map((s) => (
              <div key={s.name} className="bg-white/8 rounded-lg px-2.5 py-2 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-white truncate">{s.name}</p>
                  <p className="text-[8px] text-white/40 truncate">{s.stop}</p>
                </div>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                  s.status === "boarded" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {s.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* SOS button hint */}
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xs">🚨</span>
            <p className="text-[9px] font-bold text-red-300">SOS always accessible</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────

interface FeatureCardProps {
  emoji: string;
  title: string;
  body: string;
  accent?: string;
  delay?: string;
}

function FeatureCard({ emoji, title, body, accent = "bg-brand-50", delay = "" }: FeatureCardProps) {
  return (
    <div
      className={`bg-surface rounded-3xl border border-surface-border p-6 card-hover animate-fade-up fill-both ${delay}`}
    >
      <div className={`w-11 h-11 ${accent} rounded-2xl flex items-center justify-center mb-4`}>
        <span className="text-xl">{emoji}</span>
      </div>
      <h3 className="text-base font-black text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({ num, title, body, delay = "" }: { num: string; title: string; body: string; delay?: string }) {
  return (
    <div className={`flex gap-5 animate-fade-up fill-both ${delay}`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-brand-600 text-white font-black text-sm flex items-center justify-center shadow-brand">
        {num}
      </div>
      <div className="pt-1">
        <p className="font-black text-ink mb-1">{title}</p>
        <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden hero-grid">
        {/* Background orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-32 w-[500px] h-[500px] bg-violet-400/8 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse-dot" />
                <span className="text-xs font-semibold text-brand-700">Built for Indian schools</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black text-ink leading-[1.05] tracking-tight mb-6 animate-fade-up">
                School transport,{" "}
                <span className="text-gradient">reimagined</span>
                <span className="text-ink">.</span>
              </h1>

              <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-up delay-100 fill-both">
                Skippo connects parents, drivers, and school staff on a single platform —
                live GPS tracking, instant SOS alerts, and seamless daily operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up delay-200 fill-both">
                <Link
                  href="/signup"
                  className="px-6 py-3.5 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-brand"
                >
                  Get your school on Skippo →
                </Link>
                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 bg-surface border border-surface-border text-ink rounded-2xl font-bold text-sm hover:bg-surface-muted transition-colors shadow-card"
                >
                  See how it works
                </a>
              </div>

              {/* Trust bar */}
              <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start animate-fade-up delay-300 fill-both">
                {[
                  { icon: "🏫", label: "Multi-school ready" },
                  { icon: "📍", label: "Real-time GPS" },
                  { icon: "🔒", label: "Safe & private" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mockups */}
            <div className="relative flex gap-6 items-end flex-shrink-0 animate-fade-in delay-400 fill-both">
              <div className="-mb-4"><PhoneMockup /></div>
              <div className="mb-8 hidden sm:block"><DriverMockup /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-surface-border bg-surface py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "60s",    label: "Location refresh rate" },
              { value: "5",      label: "Platform surfaces"     },
              { value: "1-tap",  label: "SOS to all parents"    },
              { value: "∞",      label: "Trip history stored"   },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-gradient mb-1">{s.value}</p>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.2em] mb-3">Everything you need</p>
            <h2 className="text-4xl font-black text-ink tracking-tight">
              Built for every role in the school
            </h2>
            <p className="mt-4 text-ink-muted max-w-xl mx-auto">
              One platform, five surfaces — parents, drivers, teachers, and admins all connected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              emoji="📍"
              title="Live bus tracking"
              body="Parents see the bus position update every 60 seconds. No more anxious waiting at the stop."
              accent="bg-brand-50"
              delay="delay-100"
            />
            <FeatureCard
              emoji="🚨"
              title="One-tap SOS"
              body="Drivers trigger SOS from any screen. All route parents and school admin are alerted in seconds."
              accent="bg-red-50"
              delay="delay-200"
            />
            <FeatureCard
              emoji="🔧"
              title="Breakdown coordination"
              body="Driver reports a breakdown, parents are notified instantly, and nearby school buses can be contacted."
              accent="bg-amber-50"
              delay="delay-300"
            />
            <FeatureCard
              emoji="📋"
              title="Digital student roster"
              body="Board and drop students in two taps. Custom stop overrides set by parents are shown per student."
              accent="bg-emerald-50"
              delay="delay-100"
            />
            <FeatureCard
              emoji="👨‍🏫"
              title="Teacher attendance"
              body="Teachers take attendance on their phone, add notes per student, and parents get progress updates."
              accent="bg-violet-50"
              delay="delay-200"
            />
            <FeatureCard
              emoji="🏫"
              title="Admin dashboard"
              body="School admins manage routes, vehicles, renewals, compliance, and driver approvals from one place."
              accent="bg-sky-50"
              delay="delay-300"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface border-y border-surface-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.2em] mb-3">Simple setup</p>
            <h2 className="text-4xl font-black text-ink tracking-tight">How Skippo works</h2>
            <p className="mt-4 text-ink-muted max-w-xl mx-auto">
              From onboarding to daily operations — everything is designed to be instant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* For schools */}
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex w-14 h-14 rounded-3xl bg-brand-50 items-center justify-center mb-3">
                  <span className="text-2xl">🏫</span>
                </div>
                <h3 className="font-black text-ink text-lg">For schools</h3>
              </div>
              <div className="space-y-6">
                <StepCard num="1" title="Register your school" body="Sign up in minutes with your school details and fleet size." delay="delay-100" />
                <StepCard num="2" title="Add vehicles &amp; routes" body="Configure routes, stops, and vehicle assignments from the dashboard." delay="delay-200" />
                <StepCard num="3" title="Invite drivers &amp; parents" body="Send invite links. Everyone is on board without manual data entry." delay="delay-300" />
              </div>
            </div>

            {/* For parents */}
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex w-14 h-14 rounded-3xl bg-amber-50 items-center justify-center mb-3">
                  <span className="text-2xl">👨‍👩‍👧</span>
                </div>
                <h3 className="font-black text-ink text-lg">For parents</h3>
              </div>
              <div className="space-y-6">
                <StepCard num="1" title="Download the parent app" body="Sign up with your phone number, link your child, and pick their bus route." delay="delay-100" />
                <StepCard num="2" title="Track live, every morning" body="See the bus on a live map. Alerts arrive before the bus does." delay="delay-200" />
                <StepCard num="3" title="Stay informed all day" body="Board/drop confirmations, teacher progress notes, and emergency alerts — all in one place." delay="delay-300" />
              </div>
            </div>

            {/* For drivers */}
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex w-14 h-14 rounded-3xl bg-emerald-50 items-center justify-center mb-3">
                  <span className="text-2xl">🚌</span>
                </div>
                <h3 className="font-black text-ink text-lg">For drivers</h3>
              </div>
              <div className="space-y-6">
                <StepCard num="1" title="Join with your invite code" body="Use the invite token from your school or self-register in under 2 minutes." delay="delay-100" />
                <StepCard num="2" title="Run your route" body="Start a trip, board students with one tap, and drop them at custom stops set by parents." delay="delay-200" />
                <StepCard num="3" title="Safety always covered" body="SOS and Breakdown buttons are one tap away at all times during a trip." delay="delay-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For schools ──────────────────────────────────────────────────── */}
      <section id="for-schools" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.2em] mb-3">Why schools choose Skippo</p>
              <h2 className="text-4xl font-black text-ink tracking-tight mb-6">
                Every morning, every student,{" "}
                <span className="text-gradient">every stop</span>.
              </h2>
              <p className="text-ink-muted leading-relaxed mb-8">
                Managing school transport is complex. Skippo reduces that complexity to a
                few taps — for drivers, parents, and administrators alike.
              </p>

              <div className="space-y-5">
                {[
                  { emoji: "🔄", title: "No missed drops", body: "Automatically alerts parents when a student is still on the bus when the trip ends." },
                  { emoji: "📄", title: "Compliance reminders", body: "Vehicle fitness certificates, insurance, and permit renewals are tracked and surfaced automatically." },
                  { emoji: "📱", title: "Multi-device, multi-vehicle", body: "A driver with multiple bus assignments switches vehicles in two taps. All history is tied to their Aadhaar." },
                  { emoji: "🌐", title: "Works on any device", body: "The web apps work in any browser. Native apps are available for iOS and Android." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 animate-fade-up fill-both">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-base">{item.emoji}</span>
                    </div>
                    <div>
                      <p className="font-black text-ink text-sm mb-0.5">{item.title}</p>
                      <p className="text-sm text-ink-muted leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pricing-style card */}
            <div className="bg-surface rounded-4xl border border-surface-border p-8 shadow-lift">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Early access</p>
              <h3 className="text-3xl font-black text-ink mb-2">
                Free for pilot schools
              </h3>
              <p className="text-ink-muted text-sm mb-8">
                We&apos;re onboarding select schools for our pilot program. No credit card. No commitment.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Up to 10 vehicles included",
                  "Unlimited parent accounts",
                  "Real-time GPS tracking",
                  "SOS & breakdown flows",
                  "Teacher & admin portal",
                  "Priority onboarding support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-ink">
                    <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="block w-full py-4 bg-brand-600 text-white text-center rounded-2xl font-bold hover:bg-brand-700 transition-colors shadow-brand"
              >
                Apply for pilot access →
              </Link>
              <p className="text-center text-xs text-ink-faint mt-4">
                We&apos;ll get in touch within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-brand-600 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-5">
            Ready to transform your school&apos;s transport?
          </h2>
          <p className="text-white/75 mb-8 text-lg leading-relaxed">
            Join the schools already running safer, smarter routes with Skippo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-7 py-4 bg-white text-brand-700 rounded-2xl font-bold hover:bg-brand-50 transition-colors shadow-lg"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/contact"
              className="px-7 py-4 bg-white/15 text-white border border-white/30 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-ink py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                  <span className="text-white text-sm font-black">S</span>
                </div>
                <span className="text-white font-black text-lg">Skippo</span>
              </div>
              <p className="text-ink-faint text-sm leading-relaxed">
                The complete operations platform for school transport.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-2.5">
                {["Features", "How it works", "For schools", "Pricing"].map((l) => (
                  <li key={l}><a href="#" className="text-sm text-ink-faint hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-2.5">
                {[
                  { label: "About",   href: "#"        },
                  { label: "Contact", href: "/contact" },
                  { label: "Privacy", href: "#"        },
                  { label: "Terms",   href: "#"        },
                ].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-ink-faint hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Get started */}
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Get started</p>
              <ul className="space-y-2.5">
                <li><Link href="/signup" className="text-sm text-ink-faint hover:text-white transition-colors">Register your school</Link></li>
                <li><a href="#" className="text-sm text-ink-faint hover:text-white transition-colors">Parent app</a></li>
                <li><a href="#" className="text-sm text-ink-faint hover:text-white transition-colors">Driver app</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ink-faint">© 2026 Skippo. Built in India 🇮🇳</p>
            <p className="text-xs text-ink-faint">Keeping every child safe, every day.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
