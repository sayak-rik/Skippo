"use client";

import {
  motion, useInView, useScroll, useSpring,
  useMotionValue, useTransform, useMotionTemplate,
  AnimatePresence, type Variants,
} from "framer-motion";
import {
  MapPin, Zap, Shield, Users, Bus, Phone, AlertTriangle,
  ClipboardList, LayoutDashboard, GraduationCap, ArrowRight,
  CheckCircle2, Menu, X, Star, Brain,
  TrendingUp, MessageSquare, Route, Activity, School, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

// ── Animation variants ─────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } },
};
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5 } },
};
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ── Navbar ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",     href: "#features"    },
  { label: "How it works", href: "#how-it-works" },
  { label: "For schools",  href: "#for-schools"  },
  { label: "Contact",      href: "/contact"      },
];

function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-brand-600"
        style={{ scaleX }}
      />

      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-xl border-b border-surface-border shadow-sm" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.svg" alt="Skippo" className="w-9 h-9" />
            <span className="text-xl font-black text-ink tracking-tight">Skippo</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href}
                className="text-sm font-bold text-ink/70 hover:text-ink transition-colors tracking-wide">
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-brand-700 border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-all duration-200 active:scale-95">
              Sign In
            </Link>
            <Link href="/signup"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-bold shadow-brand hover:opacity-90 transition-opacity active:scale-95">
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-all">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[68px] z-40 bg-white border-b border-surface-border px-6 py-6 flex flex-col gap-4 md:hidden shadow-lift"
          >
            {NAV_LINKS.map((l, i) => (
              <motion.a key={l.label} href={l.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setMobileOpen(false)}
                className="text-base font-bold text-ink hover:text-brand-600 transition-colors py-1">
                {l.label}
              </motion.a>
            ))}
            <Link href="/signin"
              className="px-5 py-3 rounded-xl border-2 border-brand-200 text-brand-700 text-sm font-bold text-center hover:bg-brand-50 transition-colors">
              Sign In
            </Link>
            <Link href="/signup"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-bold text-center">
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Hero product visual ────────────────────────────────────────────────────────

function HeroVisual() {
  return (
    <div className="relative w-full">
      {/* Soft shadow base */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-brand-100/60 via-violet-50/40 to-transparent blur-2xl" />

      {/* Browser chrome wrapper */}
      <div className="relative rounded-2xl overflow-hidden border border-surface-border shadow-[0_32px_80px_-16px_rgba(0,0,0,0.14)]">
        {/* Chrome bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-surface-muted border-b border-surface-border">
          <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400" />
          <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-400" />
          <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400" />
          <div className="mx-2 sm:mx-4 flex-1 bg-white rounded-md h-5 sm:h-6 flex items-center px-2 sm:px-3 border border-surface-border max-w-xs sm:max-w-sm">
            <span className="text-[10px] sm:text-[11px] text-ink-faint">skippo.co.in/dashboard</span>
          </div>
        </div>

        {/* Dashboard interior — sidebar hidden on mobile */}
        <div className="bg-surface-soft flex min-h-[280px] sm:min-h-[360px] lg:min-h-[440px]">
          {/* Sidebar — md+ only */}
          <div className="hidden md:flex md:w-[180px] lg:w-[220px] bg-white border-r border-surface-border p-3 lg:p-4 flex-col space-y-1 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 lg:px-3 py-2 mb-3 lg:mb-4">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white text-[10px] lg:text-[11px] font-black">S</span>
              </div>
              <span className="text-xs lg:text-sm font-black text-ink">Skippo</span>
            </div>
            {[
              { icon: LayoutDashboard, label: "Dashboard",  active: true  },
              { icon: Users,           label: "Students",   active: false },
              { icon: Bus,             label: "Transport",  active: false },
              { icon: GraduationCap,   label: "Classes",    active: false },
              { icon: Zap,             label: "Fees",       active: false },
              { icon: Phone,           label: "Messages",   active: false },
              { icon: TrendingUp,      label: "Analytics",  active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label}
                className={`flex items-center gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-[11px] lg:text-xs font-semibold ${
                  active ? "bg-brand-50 text-brand-600" : "text-ink-muted"
                }`}>
                <Icon size={13} />
                {label}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 space-y-3 lg:space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-ink-muted">Good morning 👋</p>
                <p className="text-sm sm:text-base lg:text-lg font-black text-ink truncate">Greenfield International School</p>
              </div>
              <span className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">12 buses live</span>
                <span className="sm:hidden">12 live</span>
              </span>
            </div>

            {/* Stat cards — 2×2 on mobile, 4 across on lg */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
              {[
                { label: "Attendance",    value: "94.2%",  sub: "+1.8% today",    color: "text-brand-600",   bg: "bg-brand-50"   },
                { label: "Collected",     value: "₹1.45L", sub: "+12% yesterday", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Pending fees",  value: "₹8.76L", sub: "231 students",   color: "text-amber-600",   bg: "bg-amber-50"   },
                { label: "Students",      value: "1,248",  sub: "62 new",         color: "text-violet-600",  bg: "bg-violet-50"  },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-2.5 lg:p-3`}>
                  <p className={`text-base sm:text-lg lg:text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-ink-muted mt-0.5">{s.label}</p>
                  <p className="text-[8px] sm:text-[9px] text-ink-faint mt-0.5 hidden sm:block">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Bottom row — stacks on small, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
              {/* Live tracking map */}
              <div className="sm:col-span-2 bg-white rounded-xl border border-surface-border p-2.5 lg:p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] sm:text-xs font-black text-ink">Live Bus Tracking</p>
                  <span className="text-[9px] font-bold text-emerald-600">LIVE</span>
                </div>
                <div className="relative h-20 sm:h-24 lg:h-28 bg-brand-50 rounded-lg overflow-hidden"
                  style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)", backgroundSize: "20px 20px" }}>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 112">
                    <path d="M 30 90 Q 100 60 160 75 Q 220 90 280 50 Q 340 20 380 40"
                      fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
                  </svg>
                  <motion.div
                    className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-600 border-2 border-white shadow-md flex items-center justify-center"
                    style={{ top: "42%", left: "48%" }}
                    animate={{ x: [-8, 8, -8], y: [4, -4, 4] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Bus size={7} className="text-white" />
                  </motion.div>
                  {[{ l: "8%", t: "76%" }, { l: "42%", t: "62%" }, { l: "72%", t: "38%" }].map((pos, i) => (
                    <div key={i} className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white border-2 border-brand-400 shadow"
                      style={{ left: pos.l, top: pos.t }} />
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl border border-surface-border p-2.5 lg:p-3">
                <p className="text-[11px] sm:text-xs font-black text-ink mb-2">Quick Actions</p>
                <div className="grid grid-cols-3 sm:grid-cols-1 gap-1 sm:gap-1.5">
                  {[
                    { label: "Send alert",  color: "text-brand-600 bg-brand-50" },
                    { label: "Collect fee", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Attendance",  color: "text-violet-600 bg-violet-50" },
                  ].map((a) => (
                    <div key={a.label}
                      className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-semibold text-center sm:text-left ${a.color}`}>
                      <ChevronRight size={9} className="hidden sm:block" />
                      {a.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3D animated background ────────────────────────────────────────────────────

const ORB_CONFIG = [
  { w: 560, h: 560, lx: -8,  ty: -12, depth: 1.4, ca: "rgba(99,102,241,0.14)",  cb: "rgba(124,58,237,0.04)",  t: 22, dl: 0   },
  { w: 440, h: 440, lx: 65,  ty: -8,  depth: 0.9, ca: "rgba(124,58,237,0.10)",  cb: "rgba(99,102,241,0.03)",  t: 28, dl: 3.5 },
  { w: 380, h: 380, lx: 38,  ty: 52,  depth: 0.6, ca: "rgba(99,102,241,0.08)",  cb: "rgba(59,130,246,0.02)",  t: 19, dl: 7   },
  { w: 300, h: 300, lx: 80,  ty: 48,  depth: 1.7, ca: "rgba(167,139,250,0.12)", cb: "rgba(196,181,253,0.03)", t: 24, dl: 1.5 },
  { w: 220, h: 220, lx: 22,  ty: 38,  depth: 0.8, ca: "rgba(99,102,241,0.13)",  cb: "rgba(79,70,229,0.03)",   t: 16, dl: 10  },
  { w: 180, h: 180, lx: 55,  ty: 22,  depth: 2.0, ca: "rgba(139,92,246,0.10)",  cb: "rgba(99,102,241,0.03)",  t: 20, dl: 5   },
  { w: 140, h: 140, lx: 12,  ty: 65,  depth: 1.2, ca: "rgba(79,70,229,0.09)",   cb: "rgba(124,58,237,0.02)",  t: 14, dl: 8   },
];

const RING_CONFIG = [
  { size: 340, lx: "8%",  ty: "18%", rx: 55, ry: -20, t: 18, dl: 0,   opacity: 0.12 },
  { size: 220, lx: "68%", ty: "10%", rx: 40, ry: 15,  t: 24, dl: 2.5, opacity: 0.10 },
  { size: 280, lx: "75%", ty: "55%", rx: 65, ry: 10,  t: 21, dl: 5,   opacity: 0.09 },
  { size: 160, lx: "30%", ty: "62%", rx: 50, ry: -10, t: 16, dl: 7,   opacity: 0.11 },
];

function FloatingOrb({ cfg, springX, springY }: {
  cfg: typeof ORB_CONFIG[0];
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
}) {
  const px = useTransform(springX, [-1, 1], [-cfg.depth * 28, cfg.depth * 28]);
  const py = useTransform(springY, [-1, 1], [-cfg.depth * 18, cfg.depth * 18]);
  return (
    <motion.div className="absolute pointer-events-none" style={{ left: `${cfg.lx}%`, top: `${cfg.ty}%`, x: px, y: py }}>
      <motion.div
        style={{
          width: cfg.w, height: cfg.h,
          background: `radial-gradient(circle at 38% 38%, ${cfg.ca}, ${cfg.cb})`,
          filter: "blur(55px)",
          borderRadius: "50%",
        }}
        animate={{ y: [-18, 18, -18], scale: [1, 1.05, 1], rotate: [0, 8, 0] }}
        transition={{ duration: cfg.t, repeat: Infinity, ease: "easeInOut", delay: cfg.dl }}
      />
    </motion.div>
  );
}

function Ring3D({ cfg, springX, springY }: {
  cfg: typeof RING_CONFIG[0];
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
}) {
  const px = useTransform(springX, [-1, 1], [-12, 12]);
  const py = useTransform(springY, [-1, 1], [-8, 8]);
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: cfg.lx, top: cfg.ty, x: px, y: py }}
    >
      <motion.div
        style={{
          width: cfg.size, height: cfg.size,
          borderRadius: "50%",
          border: `1.5px solid rgba(99,102,241,${cfg.opacity})`,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: [cfg.rx - 20, cfg.rx + 20, cfg.rx - 20],
          rotateY: [cfg.ry, cfg.ry + 360],
          scale: [1, 1.04, 1],
        }}
        transition={{
          rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: cfg.t, repeat: Infinity, ease: "linear", delay: cfg.dl },
          scale:   { duration: cfg.t * 0.7, repeat: Infinity, ease: "easeInOut", delay: cfg.dl },
        }}
      />
    </motion.div>
  );
}

function ParticleField({ springX, springY }: {
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
}) {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: (i * 37 + (i % 5) * 19) % 96,
    y: (i * 29 + (i % 7) * 13) % 92,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
    depth: 0.3 + (i % 5) * 0.35,
    dur: 8 + (i % 7) * 2,
    delay: (i * 0.4) % 6,
  }));
  return (
    <>
      {particles.map((p) => {
        const px = useTransform(springX, [-1, 1], [-p.depth * 20, p.depth * 20]); // eslint-disable-line react-hooks/rules-of-hooks
        const py = useTransform(springY, [-1, 1], [-p.depth * 12, p.depth * 12]); // eslint-disable-line react-hooks/rules-of-hooks
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, x: px, y: py,
              background: `rgba(99,102,241,${0.15 + (p.id % 4) * 0.08})` }}
            animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1], y: [-10, 10, -10] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        );
      })}
    </>
  );
}

function Hero3DBackground({ springX, springY }: {
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
}) {
  const gx  = useTransform(springX, [-1, 1], [35, 65]);
  const gy  = useTransform(springY, [-1, 1], [30, 70]);
  const gBg = useMotionTemplate`radial-gradient(900px circle at ${gx}% ${gy}%, rgba(99,102,241,0.07), transparent 60%)`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Interactive spotlight */}
      <motion.div className="absolute inset-0" style={{ background: gBg }} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      {/* 3D Perspective grid plane at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-72 overflow-hidden"
        style={{ perspective: "600px" }}>
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
            transform: "rotateX(62deg)",
            transformOrigin: "50% 100%",
          }}
          animate={{ backgroundPosition: ["0px 0px", "0px 72px"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        {/* Fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
      </div>

      {/* Floating orbs */}
      {ORB_CONFIG.map((cfg, i) => (
        <FloatingOrb key={i} cfg={cfg} springX={springX} springY={springY} />
      ))}

      {/* 3D rings */}
      {RING_CONFIG.map((cfg, i) => (
        <Ring3D key={i} cfg={cfg} springX={springX} springY={springY} />
      ))}

      {/* Particles */}
      <ParticleField springX={springX} springY={springY} />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 35, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 35, damping: 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2));
    mouseY.set((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2));
  }

  return (
    <section
      className="relative overflow-hidden bg-white pt-32 pb-0"
      onMouseMove={handleMouseMove}
    >
      <Hero3DBackground springX={springX} springY={springY} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Revex-style badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center rounded-full border border-surface-border bg-white shadow-sm overflow-hidden">
            <span className="text-[11px] font-medium text-ink-muted px-4 py-1.5">
              Built with love for
            </span>
            <span className="flex items-center gap-1.5 bg-[#FFB300] text-[#1C2E6E] text-[11px] font-black px-3 py-1.5 tracking-wide uppercase">
              🇮🇳 India
            </span>
          </div>
        </motion.div>

        {/* Massive headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1
            className="font-black uppercase text-ink leading-[0.92] tracking-[-0.03em] block"
            style={{ fontSize: "clamp(52px, 10.5vw, 148px)" }}
          >
            <span className="block">Everything your</span>
            <span className="block">
              school{" "}
              <span
                className="inline-block rounded-[0.2em]"
                style={{
                  background: "#FFB300",
                  color: "#1C2E6E",
                  padding: "0.02em 0.18em 0.06em",
                  lineHeight: "inherit",
                }}
              >
                needs.
              </span>
            </span>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="text-center text-lg text-ink-muted leading-relaxed mb-10 max-w-xl mx-auto"
        >
          Live bus tracking, AI lesson plans, fee collection, and parent alerts — all connected in one platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.38 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-20"
        >
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-ink text-white rounded-2xl font-bold text-sm hover:bg-ink-soft transition-colors active:scale-[0.97]"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-surface-border text-ink rounded-2xl font-bold text-sm hover:border-ink/20 hover:bg-surface-soft transition-all active:scale-[0.97]"
          >
            Explore features
          </a>
        </motion.div>

        {/* Product visual — full width, bleeds into next section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative"
        >
          <HeroVisual />
          {/* Fade-out bottom */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}

// ── Social proof strip ────────────────────────────────────────────────────────

const PROOF_STATS = [
  { value: "500+",  label: "Schools using Skippo"   },
  { value: "60s",   label: "Bus location refresh"   },
  { value: "100%",  label: "SOS delivery rate"       },
  { value: "24h",   label: "Onboarding to live"      },
  { value: "5",     label: "Platform surfaces"       },
];

function SocialProof() {
  return (
    <div className="border-y border-surface-border bg-surface-soft py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-6">
          {PROOF_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl font-black text-ink mb-1">{s.value}</p>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "Live GPS Tracking", "AI Lesson Plans", "Fee Collection", "Mass Parent Calls",
  "SOS Alerts", "Student Roster", "Analytics Dashboard", "Teacher Attendance",
  "Student Feedback", "Class Broadcasts", "Compliance Tracking", "ETA Prediction",
  "Route Alerts", "Parent Notifications", "Driver Management",
];

function TickerStrip() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="bg-ink py-4 overflow-hidden">
      <div style={{ maskImage: "linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%)", WebkitMaskImage: "linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%)" }}>
        <div className="flex gap-10 animate-ticker whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-semibold text-zinc-400">
              <span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section tag component ─────────────────────────────────────────────────────

function SectionTag({ children, color = "brand" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    brand:   "bg-brand-50 border-brand-100 text-brand-600",
    violet:  "bg-violet-50 border-violet-100 text-violet-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber:   "bg-amber-50 border-amber-100 text-amber-600",
  };
  return (
    <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-6 ${colors[color]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      <span className="text-xs font-semibold uppercase tracking-widest">{children}</span>
    </div>
  );
}

// ── Transport feature section ──────────────────────────────────────────────────

function TransportMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-brand-100/50 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-white/70 font-semibold">Bus 12 · North Route A</p>
              <p className="text-base font-black text-white">Morning Trip</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />LIVE
            </span>
          </div>
          {/* Mini map */}
          <div className="relative h-24 bg-brand-700/40 rounded-xl overflow-hidden"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 96">
              <path d="M 20 75 Q 80 50 130 65 Q 180 78 230 40 Q 265 18 285 30"
                fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="5 4" />
            </svg>
            <motion.div
              className="absolute w-5 h-5 rounded-full bg-white border-2 border-brand-400 shadow-lg flex items-center justify-center"
              style={{ top: "52%", left: "44%" }}
              animate={{ x: [-6, 6, -6], y: [4, -4, 4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bus size={8} className="text-brand-600" />
            </motion.div>
          </div>
        </div>

        {/* ETA + student list */}
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-brand-600">8</p>
              <p className="text-[9px] font-semibold text-brand-500">min ETA</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-600">34</p>
              <p className="text-[9px] font-semibold text-emerald-500">boarded</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">2</p>
              <p className="text-[9px] font-semibold text-amber-500">pending</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              { name: "Aarav Roy",   status: "boarded",  c: "bg-emerald-500" },
              { name: "Mira Dutta",  status: "boarded",  c: "bg-emerald-500" },
              { name: "Sia Das",     status: "stop 4",   c: "bg-amber-400"   },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-2.5 bg-surface-soft rounded-lg px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.c}`} />
                <p className="text-xs font-semibold text-ink flex-1">{s.name}</p>
                <span className="text-[9px] text-ink-muted">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-28 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <SectionTag color="brand">Transport &amp; Safety</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-black text-ink leading-tight tracking-tight mb-6">
              Every parent knows where their child is.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-8">
              Live GPS updates every 60 seconds. Board and drop confirmations. One-tap SOS that reaches every parent on the route in seconds.
            </p>
            <motion.ul variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-4 mb-10">
              {[
                "Live bus position updates every 60 seconds",
                "Automatic boarding and drop confirmations",
                "One-tap SOS — 100% parent notification rate",
                "No-show alerts when a student doesn't board",
                "Driver contact directly from the parent app",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-ink-muted">
                  <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Get started <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <TransportMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── AI teaching section ───────────────────────────────────────────────────────

function TeacherMockup() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) setTimeout(() => setVisible(true), 400);
  }, [inView]);

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-4 bg-violet-100/50 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-muted">AI Lesson Planner</p>
            <p className="text-sm font-black text-ink">Grade 8 — Mathematics</p>
          </div>
          <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-full">AI</span>
        </div>

        {/* Prompt input */}
        <div className="bg-surface-muted rounded-xl p-3 border border-surface-border">
          <p className="text-[10px] text-ink-muted mb-1">Topic</p>
          <p className="text-xs font-semibold text-ink">Pythagoras Theorem — introduction &amp; applications</p>
        </div>

        {/* Generated plan */}
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="space-y-2"
            >
              {[
                { step: "Objective",     text: "Students understand and apply Pythagoras Theorem to right triangles." },
                { step: "Warm-up (5m)",  text: "Quick quiz on squares and square roots from previous lesson." },
                { step: "Teach (20m)",   text: "Diagram proof, formula derivation, 3 worked examples on board." },
                { step: "Activity (15m)",text: "Partner worksheet — 8 problems increasing in difficulty." },
                { step: "Wrap-up (5m)",  text: "3-2-1 exit ticket: 3 things learned, 2 questions, 1 real-world use." },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-2.5 bg-violet-50 rounded-lg p-2.5"
                >
                  <span className="text-[9px] font-black text-violet-600 whitespace-nowrap mt-0.5">{s.step}</span>
                  <p className="text-[9px] text-ink-muted leading-relaxed">{s.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-surface-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={visible ? { width: "100%" } : {}}
              transition={{ duration: 1.2, delay: 0.2 }}
            />
          </div>
          <span className="text-[9px] font-bold text-violet-600 whitespace-nowrap">Plan ready</span>
        </div>
      </div>
    </div>
  );
}

function TeacherSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-28 bg-surface-soft border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <TeacherMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <SectionTag color="violet">AI for Teachers</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-black text-ink leading-tight tracking-tight mb-6">
              From topic to lesson plan in seconds.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-8">
              Teachers type a topic — Skippo generates a complete, curriculum-aligned lesson plan instantly. No prep time lost. More time for students.
            </p>
            <motion.ul variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-4 mb-10">
              {[
                "AI generates full lesson plans from a single topic",
                "Answer student questions from home, in real time",
                "Send individual progress notes to every student",
                "Broadcast class tasks and assignments instantly",
                "Mark attendance and track class performance",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-ink-muted">
                  <CheckCircle2 size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">
              Get started <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Fee & Admin section ───────────────────────────────────────────────────────

function FeeMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-emerald-100/50 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden">
        <div className="bg-emerald-600 p-4">
          <p className="text-[10px] text-white/70 font-semibold mb-1">Fee Overview</p>
          <p className="text-3xl font-black text-white">₹12,45,320</p>
          <p className="text-[10px] text-white/70 mt-1">Collected this month</p>
          <div className="mt-3 flex gap-4">
            <div>
              <p className="text-sm font-black text-white">₹8.76L</p>
              <p className="text-[9px] text-white/60">Pending (231)</p>
            </div>
            <div>
              <p className="text-sm font-black text-emerald-200">94.2%</p>
              <p className="text-[9px] text-white/60">Collection rate</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Recent payments */}
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Recent payments</p>
          {[
            { name: "Aarav Roy",   amount: "₹12,000", time: "2m ago",  status: "paid" },
            { name: "Mira Dutta",  amount: "₹8,500",  time: "18m ago", status: "paid" },
            { name: "Arjun Singh", amount: "₹15,000", time: "1h ago",  status: "paid" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-black text-emerald-600">{p.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{p.name}</p>
                <p className="text-[9px] text-ink-muted">{p.time}</p>
              </div>
              <span className="text-xs font-black text-emerald-600">{p.amount}</span>
            </div>
          ))}

          {/* Progress bar */}
          <div className="pt-1">
            <div className="flex justify-between text-[9px] font-semibold text-ink-muted mb-1">
              <span>Collection progress</span>
              <span>94.2%</span>
            </div>
            <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "94.2%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-28 bg-white border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <SectionTag color="emerald">Fees &amp; Administration</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-black text-ink leading-tight tracking-tight mb-6">
              Fee collection that actually works.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-8">
              Define fee structures per class, let parents pay via Razorpay, and watch collection happen automatically. No follow-up calls, no spreadsheets.
            </p>
            <motion.ul variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-4 mb-10">
              {[
                "Custom fee structures per class or student group",
                "Parents pay instantly via Razorpay — UPI, cards, net banking",
                "Automatic receipts and payment confirmations",
                "Pending fee reports with one-click parent reminders",
                "Smart analytics dashboard for admin decisions",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-ink-muted">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Get started <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <FeeMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Parent communication section ──────────────────────────────────────────────

function CommsMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-amber-100/40 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden p-5 space-y-3">
        <div>
          <p className="text-[10px] text-ink-muted">Mass Call Campaign</p>
          <p className="text-sm font-black text-ink">Parent-Teacher Meeting — Thu 24 Apr</p>
        </div>

        {/* Campaign status */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Calls sent",    value: "847", color: "text-brand-600 bg-brand-50"   },
            { label: "Answered",      value: "792", color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending",       value: "55",  color: "text-amber-600 bg-amber-50"   },
          ].map((s) => (
            <div key={s.label} className={`${s.color.split(" ")[1]} rounded-xl p-2.5 text-center`}>
              <p className={`text-xl font-black ${s.color.split(" ")[0]}`}>{s.value}</p>
              <p className="text-[8px] font-semibold text-ink-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notification preview */}
        <div className="bg-surface-soft rounded-xl border border-surface-border p-3 space-y-2">
          <p className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Recent notifications sent</p>
          {[
            { type: "📞", msg: "PTM reminder call delivered",       time: "3m ago"  },
            { type: "✅", msg: "Fee receipt sent to Priya Sharma",  time: "12m ago" },
            { type: "📍", msg: "Bus 7 arrived — 28 parents alerted",time: "1h ago"  },
            { type: "🚨", msg: "SOS cleared — parents notified",    time: "2h ago"  },
          ].map((n) => (
            <div key={n.msg} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{n.type}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-ink truncate">{n.msg}</p>
                <p className="text-[8px] text-ink-faint">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-28 bg-surface-soft border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <CommsMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <SectionTag color="amber">Parent Communication</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-black text-ink leading-tight tracking-tight mb-6">
              Reach every parent in minutes.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-8">
              Schedule AI-driven voice calls to all parents at once. Boarding alerts, fee reminders, PTM invites — one campaign, zero manual effort.
            </p>
            <motion.ul variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-4 mb-10">
              {[
                "AI voice calls delivered to hundreds of parents at once",
                "Automatic boarding and drop notifications",
                "Bulk fee reminders with parent-specific details",
                "Emergency SOS alerts reach all route parents in seconds",
                "Teacher progress notes sent directly to guardians",
              ].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-start gap-3 text-sm text-ink-muted">
                  <CheckCircle2 size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">
              Get started <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: School,       label: "For schools",
    iconBg: "bg-brand-50",  iconColor: "text-brand-600",  stepColor: "bg-brand-600",
    steps: [
      { title: "Sign up your school",      body: "Fill in your details — we review and activate your account within 24 hours."    },
      { title: "Configure routes & fees",  body: "Add teachers, set fee structures by class, and configure your bus routes."       },
      { title: "Operations on autopilot",  body: "Schedule parent calls, track buses live, and get smart analytics daily."        },
    ],
  },
  {
    icon: GraduationCap, label: "For teachers",
    iconBg: "bg-violet-50", iconColor: "text-violet-600", stepColor: "bg-violet-600",
    steps: [
      { title: "Accept your invite",       body: "Your school sends an invite link — set up your classes in minutes."              },
      { title: "Build lessons with AI",    body: "Type a topic, get a complete lesson plan. No prep time required."                },
      { title: "Stay connected anywhere",  body: "Answer questions, send feedback, and broadcast tasks from your phone."           },
    ],
  },
  {
    icon: Users,         label: "For parents",
    iconBg: "bg-amber-50",  iconColor: "text-amber-600",  stepColor: "bg-amber-500",
    steps: [
      { title: "Download the parent app",  body: "Sign up with your phone number, link your child, and select their route."        },
      { title: "Track the bus live",       body: "See the bus on a live map. Alerts arrive before the bus does."                   },
      { title: "Stay informed all day",    body: "Board & drop confirmations, teacher notes, fee receipts — one place."            },
    ],
  },
];

function HowItWorksSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="py-28 bg-white border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <SectionTag>How it works</SectionTag>
          <h2 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">
            Up and running in 24 hours.
          </h2>
          <p className="text-lg text-ink-muted max-w-xl mx-auto">
            From sign-up to live operations — every role has a clear, simple path.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {HOW_IT_WORKS.map((role, ri) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.label}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: ri * 0.15 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-12 h-12 rounded-2xl ${role.iconBg} flex items-center justify-center`}>
                    <Icon size={22} className={role.iconColor} />
                  </div>
                  <h3 className="font-black text-ink text-lg">{role.label}</h3>
                </div>

                <div className="space-y-0">
                  {role.steps.map((step, si) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: ri * 0.15 + si * 0.1 + 0.25 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full ${role.stepColor} text-white font-black text-sm flex items-center justify-center flex-shrink-0 z-10`}>
                          {si + 1}
                        </div>
                        {si < role.steps.length - 1 && (
                          <div className="w-px flex-1 my-1.5 bg-surface-border" />
                        )}
                      </div>
                      <div className={si < role.steps.length - 1 ? "pb-7 pt-1" : "pt-1"}>
                        <p className="font-black text-ink text-sm mb-1">{step.title}</p>
                        <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── App lifecycle interactive ─────────────────────────────────────────────────

const LIFECYCLE_SCREENS = [
  {
    id: "login", label: "Login", emoji: "🔑", color: "bg-brand-600",
    title: "Sign in instantly",
    desc: "OTP-based login — no passwords. Parents and drivers are in within 30 seconds.",
    screen: (
      <div className="space-y-3 px-3">
        <div className="text-center pt-2 pb-3">
          <img src="/logo.svg" alt="Skippo" className="w-10 h-10 mx-auto mb-2" />
          <p className="text-xs font-black text-ink">Welcome to Skippo</p>
          <p className="text-[9px] text-ink-muted">Enter your phone to continue</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-3 flex items-center gap-2 border border-surface-border">
          <span className="text-[11px] text-ink-muted">+91</span>
          <div className="w-px h-4 bg-surface-border" />
          <span className="text-[11px] text-ink">98765 43210</span>
        </div>
        <div className="bg-brand-600 rounded-xl p-3 text-center">
          <p className="text-[11px] font-black text-white">Send OTP →</p>
        </div>
      </div>
    ),
  },
  {
    id: "dashboard", label: "Dashboard", emoji: "🏠", color: "bg-emerald-500",
    title: "Your child's morning, at a glance",
    desc: "Live bus ETA, boarding confirmation, and driver contact — the moment the app opens.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2">
          <p className="text-[9px] text-ink-muted">Good morning, Priya</p>
          <p className="text-xs font-black text-ink">Aarav&apos;s Bus</p>
        </div>
        <div className="bg-brand-600 rounded-xl p-3 text-white">
          <p className="text-[8px] text-white/70 uppercase tracking-wider">Arriving in</p>
          <p className="text-xl font-black">8 <span className="text-xs font-semibold text-white/80">min</span></p>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <p className="text-[8px] font-semibold text-white/80">LIVE · North Route A</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-600">✓ Boarded</p>
          </div>
          <div className="flex-1 bg-surface-muted rounded-lg p-2 text-center border border-surface-border">
            <p className="text-[9px] font-black text-ink">Call driver</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tracking", label: "Live Track", emoji: "📍", color: "bg-amber-500",
    title: "Real-time map, every 60 seconds",
    desc: "The bus marker updates as the driver pings location. Parents always know exactly where it is.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs font-black text-ink">Live Tracking</p>
          <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />LIVE
          </span>
        </div>
        <div className="bg-brand-50 rounded-xl overflow-hidden h-24 relative flex items-center justify-center border border-brand-100"
          style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.1) 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
          <Route size={14} className="text-brand-300 z-10" />
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow-md z-10"
            animate={{ x: [-20, 20, -20], y: [10, -10, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="bg-surface-muted rounded-lg p-2 flex items-center gap-2 border border-surface-border">
          <MapPin size={10} className="text-brand-500 flex-shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-ink">Lakeview Stop</p>
            <p className="text-[8px] text-ink-muted">Updated 42s ago</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sos", label: "SOS Alert", emoji: "🚨", color: "bg-red-500",
    title: "Emergency in one tap",
    desc: "Drivers trigger SOS from any screen. All parents on the route are notified within seconds.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2">
          <p className="text-xs font-black text-ink">Emergency</p>
          <p className="text-[9px] text-ink-muted">One tap, full coverage</p>
        </div>
        <motion.div
          className="rounded-2xl bg-red-50 border border-red-200 p-4 flex flex-col items-center gap-2"
          animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.2)", "0 0 0px rgba(239,68,68,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle size={20} className="text-red-500" />
          <p className="text-[10px] font-black text-red-700 text-center">SOS · All parents notified</p>
          <p className="text-[8px] text-red-500 text-center">Help is on the way · Stay calm</p>
        </motion.div>
        <div className="bg-surface-muted rounded-lg p-2 border border-surface-border">
          <p className="text-[8px] text-ink-muted">28 parents notified · 4s delivery</p>
        </div>
      </div>
    ),
  },
];

function AppLifecycleSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active,   setActive]   = useState(0);
  const [progress, setProgress] = useState(0);

  // Track timer state in a ref so the interval closure is never stale
  const timerRef = useRef({ active: 0, progress: 0 });

  useEffect(() => {
    const t = setInterval(() => {
      timerRef.current.progress += 2;
      if (timerRef.current.progress >= 100) {
        timerRef.current.progress = 0;
        timerRef.current.active = (timerRef.current.active + 1) % LIFECYCLE_SCREENS.length;
        setActive(timerRef.current.active);
      }
      setProgress(timerRef.current.progress);
    }, 60);
    return () => clearInterval(t);
  }, []);

  function goTo(i: number) {
    timerRef.current = { active: i, progress: 0 };
    setActive(i);
    setProgress(0);
  }

  const screen = LIFECYCLE_SCREENS[active];

  return (
    <section ref={ref} className="py-28 bg-surface-soft border-t border-surface-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <SectionTag><Activity size={12} className="inline mr-1" />App in action</SectionTag>
          <h2 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">See the full experience</h2>
          <p className="text-lg text-ink-muted max-w-xl mx-auto">From login to live tracking to emergency response — the entire journey in one platform.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <div className="relative w-[260px]">
              <div className="absolute -inset-8 bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />
              <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-heavy border border-surface-border">
                <div className="h-9 bg-surface-soft flex items-center justify-between px-5 pt-2 border-b border-surface-border">
                  <span className="text-[10px] font-semibold text-ink-muted">9:41</span>
                  <div className="w-14 h-3.5 bg-surface-border rounded-full" />
                  <div className="flex gap-1">
                    {[3, 2, 1].map((i) => (
                      <div key={i} className="w-1 rounded-sm bg-ink-faint" style={{ height: `${4 + i * 3}px` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-surface-soft px-3 pt-2 pb-1 flex gap-1.5 border-b border-surface-border">
                  {LIFECYCLE_SCREENS.map((s, i) => (
                    <button key={s.id} onClick={() => goTo(i)}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-bold transition-all ${active === i ? `${s.color} text-white` : "text-ink-faint hover:text-ink-muted"}`}>
                      {s.emoji}
                    </button>
                  ))}
                </div>
                <div className="bg-white min-h-[260px] py-2">
                  <AnimatePresence mode="wait">
                    <motion.div key={active}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}>
                      {screen.screen}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="h-1 bg-surface-muted">
                  <motion.div className={`h-full ${screen.color}`} style={{ width: `${progress}%` }} transition={{ ease: "linear" }} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-3"
          >
            {LIFECYCLE_SCREENS.map((s, i) => (
              <motion.button key={s.id} onClick={() => goTo(i)}
                className={`w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                  active === i ? "border-brand-200 bg-white shadow-lift" : "border-surface-border bg-transparent hover:bg-white"
                }`}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center text-base flex-shrink-0`}>{s.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-ink text-sm truncate">{s.title}</p>
                      <p className="text-xs text-ink-muted">{s.label}</p>
                    </div>
                    {active === i && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 flex-shrink-0">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />LIVE
                      </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {active === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-ink-muted leading-relaxed mt-2">
                        {s.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {active === i && (
                  <div className="h-0.5 bg-surface-muted">
                    <motion.div className={`h-full ${s.color}`} style={{ width: `${progress}%` }} />
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: "Skippo turned our daily transport chaos into a five-minute morning routine. Parents stopped calling to ask where the bus is.",      name: "Priya Sen",    role: "Principal, Sunrise Academy",     initial: "PS" },
  { quote: "The SOS feature alone changed everything. One incident, and every parent was notified in under 30 seconds.",                        name: "Rajesh Nair",  role: "Transport Manager, DPS Kochi",   initial: "RN" },
  { quote: "Our drivers went from paper rosters to one-tap digital attendance. The difference is night and day.",                               name: "Ananya Sharma",role: "Admin, Delhi Modern School",     initial: "AS" },
  { quote: "Parents trust us more because they can see exactly where their child is, every step of the way.",                                   name: "Kiran Mehta",  role: "Director, Greenfield Academy",   initial: "KM" },
];

function TestimonialsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const items  = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section ref={ref} className="py-28 bg-white border-t border-surface-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}
          </div>
          <h2 className="text-4xl font-black text-ink mb-3">Schools love Skippo</h2>
          <p className="text-lg text-ink-muted">Hear from the educators and admins who run on it every day.</p>
        </motion.div>
      </div>
      <div style={{ maskImage: "linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)", WebkitMaskImage: "linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)", overflow: "hidden" }}>
        <div className="flex gap-6 animate-ticker">
          {items.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-[360px] bg-white border border-surface-border rounded-2xl p-7 shadow-card">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => <Star key={j} size={13} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-ink leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-black text-brand-600">{t.initial}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For schools / pricing ─────────────────────────────────────────────────────

const SCHOOL_FEATURES = [
  "Unlimited parent accounts",
  "Real-time GPS tracking — all routes",
  "SOS & breakdown emergency flows",
  "AI-powered ETA & anomaly detection",
  "AI lesson plans for all teachers",
  "Fee collection via Razorpay",
  "Mass AI voice calls to guardians",
  "Admin analytics dashboard",
  "Priority onboarding & support",
];

function ForSchoolsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="for-schools" ref={ref} className="py-28 bg-surface-soft border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Left — why */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <SectionTag>Why schools choose Skippo</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-black text-ink leading-tight tracking-tight mb-6">
              Every morning. Every student.{" "}
              <span style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Every stop.
              </span>
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-10">
              Managing a school is complex. Skippo reduces that complexity to a few taps — for drivers, parents, teachers, and administrators alike.
            </p>

            <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-6">
              {[
                { icon: AlertTriangle, title: "No missed drops",       body: "Automatically alerts parents when a student is still on the bus when the trip ends.", color: "text-red-600",     bg: "bg-red-50"     },
                { icon: ClipboardList, title: "Compliance on autopilot",body: "Vehicle fitness certificates, insurance, and permit renewals — tracked and surfaced automatically.", color: "text-amber-600", bg: "bg-amber-50" },
                { icon: Bus,           title: "Multi-vehicle drivers",  body: "A driver with multiple bus assignments switches vehicles in two taps.", color: "text-brand-600", bg: "bg-brand-50" },
                { icon: Shield,        title: "Works everywhere",       body: "Web apps in any browser. Native iOS & Android apps for parents, teachers, and drivers.", color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <ItemIcon size={18} className={item.color} />
                    </div>
                    <div>
                      <p className="font-black text-ink text-sm mb-0.5">{item.title}</p>
                      <p className="text-sm text-ink-muted leading-relaxed">{item.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right — what's included */}
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="relative bg-white rounded-3xl border border-surface-border p-8 shadow-lift overflow-hidden">
              <div className="absolute top-0 right-0 w-56 h-56 bg-brand-50 rounded-full -translate-y-28 translate-x-28 pointer-events-none" />
              <div className="relative">
                <h3 className="text-2xl font-black text-ink mb-2">What&apos;s included</h3>
                <p className="text-ink-muted text-sm mb-7">
                  Everything your school needs to run — transport, academics, fees, and parent communication — in a single subscription.
                </p>

                <ul className="space-y-3.5 mb-8">
                  {SCHOOL_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-ink-muted">
                      <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/signup"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-colors shadow-brand">
                    Get Started<ArrowRight size={16} />
                  </Link>
                </motion.div>
                <p className="text-center text-xs text-ink-faint mt-4">No pre payment required · We&apos;ll set you up within 24 hours</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function CTASection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-brand-600" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 16, repeat: Infinity, delay: 3 }}
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-400 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-white/70 font-semibold text-sm uppercase tracking-widest mb-6">Join 500+ schools across India</p>
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Ready to transform how your school runs?
          </h2>
          <p className="text-white/75 text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
            Live in 24 hours. Every bus, every student, every parent — connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link href="/signup"
                className="flex items-center justify-center gap-2 px-10 py-4 bg-white text-brand-700 rounded-2xl font-bold text-base hover:bg-brand-50 transition-colors shadow-lg">
                Get Started<ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/contact"
                className="flex items-center justify-center gap-2 px-10 py-4 bg-white/10 border border-white/25 text-white rounded-2xl font-bold text-base hover:bg-white/20 transition-colors">
                Talk to the team
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-white border-t border-surface-border py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
              <span className="text-ink font-black text-xl">Skippo</span>
            </div>
            <p className="text-ink-muted text-sm leading-relaxed max-w-xs">
              The all-in-one operations platform for schools — transport, academics, fees, and parent communication.
            </p>
          </div>
          <div>
            <p className="text-ink font-bold text-xs uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              {[
                { label: "Features",     href: "#features"     },
                { label: "How it works", href: "#how-it-works" },
                { label: "For schools",  href: "#for-schools"  },
              ].map((l) => (
                <li key={l.label}><a href={l.href} className="text-sm text-ink-muted hover:text-ink transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-ink font-bold text-xs uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-3">
              {[{ label: "About", href: "#" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }].map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-ink-muted hover:text-ink transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-ink font-bold text-xs uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-3">
              {[
                { label: "Parent App",      href: "/app/parent"  },
                { label: "Driver App",      href: "/app/driver"  },
                { label: "Teacher App",     href: "/app/teacher" },
                { label: "Admin Dashboard", href: "/signup"      },
              ].map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-ink-muted hover:text-ink transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-faint">© 2026 Skippo Technologies Pvt. Ltd. Built in India 🇮🇳</p>
          <p className="text-xs text-ink-faint">Keeping every child safe, every day.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <TickerStrip />
      <TransportSection />
      <TeacherSection />
      <FeeSection />
      <CommsSection />
      <HowItWorksSection />
      <AppLifecycleSection />
      <TestimonialsSection />
      <ForSchoolsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
