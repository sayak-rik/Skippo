"use client";

import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  MapPin, Zap, Shield, Users, School, Bus, Phone, AlertTriangle,
  Wrench, ClipboardList, LayoutDashboard, GraduationCap, ArrowRight,
  ChevronDown, CheckCircle2, Menu, X, Star, Sparkles, Brain, Cpu,
  TrendingUp, Eye, MessageSquare, Route, Activity,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

// ── Animation variants ─────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// ── useCountUp ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.8) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = Math.round(duration * 60);
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.min(Math.round(eased * target), target));
      if (frame >= totalFrames) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

// ── 3D Tilt wrapper ──────────────────────────────────────────────────────────

function Tilt3D({ children, className, strength = 10 }: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const rotateX = useSpring(useTransform(yRaw, [-0.5, 0.5], [strength, -strength]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(xRaw, [-0.5, 0.5], [-strength, strength]), { stiffness: 300, damping: 30 });
  const glowX  = useTransform(xRaw, [-0.5, 0.5], [0, 100]);
  const glowY  = useTransform(yRaw, [-0.5, 0.5], [0, 100]);
  const glowBg = useMotionTemplate`radial-gradient(160px circle at ${glowX}% ${glowY}%, rgba(99,102,241,0.12), transparent 70%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    xRaw.set((e.clientX - rect.left) / rect.width - 0.5);
    yRaw.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { xRaw.set(0); yRaw.set(0); }

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
}

// ── Scroll progress bar ───────────────────────────────────────────────────────

function NavProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-brand-500 via-violet-500 to-brand-400"
      style={{ scaleX }}
    />
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",     href: "#features"     },
  { label: "AI Platform",  href: "#ai-platform"  },
  { label: "How it works", href: "#how-it-works"  },
  { label: "For schools",  href: "#for-schools"   },
];

function MagneticLink({ label, href }: { label: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 400, damping: 20 });
  const sy = useSpring(y, { stiffness: 400, damping: 20 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  }
  function handleMouseLeave() { x.set(0); y.set(0); setHovered(false); }

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      className="relative text-sm font-medium text-zinc-400 hover:text-white transition-colors py-1 px-0.5"
    >
      {label}
      <motion.span
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  );
}

function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracker
  useEffect(() => {
    const ids = ["features", "ai-platform", "how-it-works", "for-schools"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <NavProgressBar />

      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 nav-blur transition-all duration-300 ${
          scrolled
            ? "bg-dark/90 border-b border-dark-border shadow-[0_1px_0_0_rgba(255,255,255,0.05)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-brand relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%", skewX: "-20deg" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.4 }}
              />
              <span className="text-white text-sm font-black relative z-10">S</span>
            </motion.div>
            <span className="text-lg font-black text-white tracking-tight">Skippo</span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="hidden sm:flex items-center gap-1 text-[9px] font-bold text-brand-400 bg-brand-950/80 border border-brand-800/50 px-1.5 py-0.5 rounded-full"
            >
              <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
              BETA
            </motion.span>
          </Link>

          {/* Desktop links with magnetic effect */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <div key={l.label} className="relative">
                <MagneticLink label={l.label} href={l.href} />
                {activeSection === l.href.replace("#", "") && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-px left-0 right-0 h-px bg-brand-500"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-2">
              Contact
            </Link>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative"
            >
              <motion.div
                className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-0 blur-sm"
                whileHover={{ opacity: 0.7 }}
                transition={{ duration: 0.2 }}
              />
              <Link
                href="/signup"
                className="relative btn-shine px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-semibold shadow-brand hover:shadow-brand-lg transition-shadow"
              >
                Get beta access
              </Link>
            </motion.div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-dark/95 nav-blur border-b border-dark-border px-5 py-6 flex flex-col gap-4 md:hidden"
          >
            {NAV_LINKS.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setMobileOpen(false)}
                className="text-base font-semibold text-zinc-300 hover:text-white transition-colors py-1"
              >
                {l.label}
              </motion.a>
            ))}
            <div className="pt-2 flex flex-col gap-3 border-t border-dark-border">
              <Link href="/contact" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors py-1">Contact</Link>
              <Link href="/signup" className="px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-bold text-center shadow-brand">
                Get beta access →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Orbit CTA ring animation ───────────────────────────────────────────────────

function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[120, 180, 240].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-brand-500/10"
          style={{ width: size, height: size }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.15, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-brand-500 blur-[1px]"
        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ── Hero section ───────────────────────────────────────────────────────────────

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const spotlightBg = useMotionTemplate`radial-gradient(700px circle at ${mouseX}px ${mouseY}px, rgba(99,102,241,0.12), transparent 70%)`;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const words = ["School", "transport,", "reimagined."];

  // 3D tilt for phone mockups
  const phoneX = useMotionValue(0);
  const phoneY = useMotionValue(0);
  const rotX   = useSpring(useTransform(phoneY, [-300, 300], [8, -8]), { stiffness: 200, damping: 30 });
  const rotY   = useSpring(useTransform(phoneX, [-300, 300], [-8, 8]), { stiffness: 200, damping: 30 });

  function handlePhoneMove(e: React.MouseEvent<HTMLDivElement>) {
    phoneX.set(e.clientX - window.innerWidth / 2);
    phoneY.set(e.clientY - window.innerHeight / 2);
  }

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-dark dark-grid"
    >
      <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ background: spotlightBg }} />

      {/* Gradient mesh blobs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="mesh-blob pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/20"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="mesh-blob pointer-events-none absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/15"
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="mesh-blob pointer-events-none absolute bottom-20 left-1/3 w-[400px] h-[400px] rounded-full bg-brand-800/20"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-28 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 glass border border-brand-500/30 rounded-full px-4 py-1.5 mb-8"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0"
              />
              <span className="text-xs font-semibold text-brand-300">Built for Indian schools · Beta open now</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={staggerFast}
              initial="hidden"
              animate="show"
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight mb-6"
            >
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  variants={fadeUp}
                  className={`inline-block mr-[0.22em] ${i === 2 ? "text-gradient" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Skippo connects parents, drivers, and school staff on one AI-powered platform —
              live GPS, instant SOS alerts, attendance, and seamless daily operations.
            </motion.p>

            {/* ── CTA animation block ──────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10"
            >
              {/* Primary CTA with orbit rings */}
              <div className="relative inline-flex justify-center lg:justify-start">
                <OrbitRings />
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative z-10"
                >
                  <motion.div
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-40 blur-md"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                  <Link
                    href="/signup"
                    className="btn-shine relative flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold text-sm shadow-brand-lg"
                  >
                    Get beta access
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight size={16} />
                    </motion.span>
                  </Link>
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#how-it-works"
                  className="flex items-center justify-center gap-2 px-7 py-4 glass border border-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  See how it works
                </a>
              </motion.div>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.85 }}
              className="flex flex-wrap items-center gap-6 justify-center lg:justify-start"
            >
              {[
                { icon: <Shield size={13} />,  label: "Safe & private"  },
                { icon: <MapPin size={13} />,  label: "Real-time GPS"   },
                { icon: <Zap size={13} />,     label: "60s updates"     },
                { icon: <Brain size={13} />,   label: "AI-powered"      },
              ].map((t) => (
                <motion.div
                  key={t.label}
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors cursor-default"
                >
                  <span className="text-brand-500">{t.icon}</span>
                  {t.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: 3D floating mockups */}
          <div
            className="relative flex-shrink-0 flex items-end gap-5 justify-center"
            onMouseMove={handlePhoneMove}
          >
            <motion.div
              style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <motion.div
                animate={{ y: [0, -14, 0], rotate: [0, 0.4, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <ParentMockup />
              </motion.div>
            </motion.div>

            <motion.div
              style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
              className="hidden sm:block mb-10"
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, -0.4, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <DriverMockup />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-xs font-medium text-zinc-600">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={16} className="text-zinc-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Phone mockups ──────────────────────────────────────────────────────────────

function ParentMockup() {
  return (
    <div className="relative w-[260px]">
      <div className="absolute inset-0 blur-3xl bg-brand-500/20 rounded-full scale-110" />
      <div className="relative bg-dark-card border border-dark-border rounded-[2.5rem] overflow-hidden shadow-heavy">
        <div className="h-9 bg-zinc-900 flex items-center justify-between px-5 pt-2">
          <span className="text-[10px] font-semibold text-zinc-500">9:41</span>
          <div className="w-14 h-3.5 bg-zinc-700 rounded-full" />
          <div className="flex gap-1">
            {[3, 2, 1].map((i) => <div key={i} className="w-1 rounded-sm bg-zinc-500" style={{ height: `${4 + i * 3}px` }} />)}
          </div>
        </div>
        <div className="px-4 pb-6 space-y-3 bg-zinc-900">
          <div className="pt-2">
            <p className="text-[10px] text-zinc-500 font-medium">Good morning</p>
            <p className="text-sm font-black text-white">Aarav&apos;s Bus</p>
          </div>
          <div className="bg-gradient-to-br from-brand-600 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <p className="text-[9px] font-semibold text-white/70 uppercase tracking-wider">Arriving in</p>
            <p className="text-3xl font-black mt-0.5">8 <span className="text-lg font-semibold text-white/80">min</span></p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse-dot" />
              <p className="text-[9px] font-semibold text-white/80">LIVE · Bus 12 · North Route A</p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 flex items-center justify-center flex-shrink-0">
              <MapPin size={14} className="text-brand-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white">Lakeview Stop</p>
              <p className="text-[9px] text-zinc-500">Updated 42 seconds ago</p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center">
                <span className="text-[10px] font-black text-brand-300">RK</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white">Rohit Kumar</p>
                <p className="text-[9px] text-zinc-500">Your driver</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-green-900/50 flex items-center justify-center">
              <Phone size={12} className="text-green-400" />
            </div>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/30 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-300">Aarav boarded safely</p>
              <p className="text-[9px] text-amber-500">Bus 12 at 7:42 AM · Stop confirmed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverMockup() {
  return (
    <div className="relative w-[240px]">
      <div className="absolute inset-0 blur-3xl bg-emerald-500/15 rounded-full scale-110" />
      <div className="relative bg-zinc-900 border border-dark-border rounded-[2.5rem] overflow-hidden shadow-heavy">
        <div className="h-9 bg-zinc-950 flex items-center justify-between px-5 pt-2">
          <span className="text-[10px] font-semibold text-zinc-600">9:41</span>
          <div className="w-14 h-3.5 bg-zinc-700 rounded-full" />
          <div className="flex gap-1">
            {[3, 2, 1].map((i) => <div key={i} className="w-1 rounded-sm bg-zinc-600" style={{ height: `${4 + i * 3}px` }} />)}
          </div>
        </div>
        <div className="bg-zinc-950 px-4 pb-5 space-y-3">
          <div className="pt-1">
            <p className="text-[9px] text-zinc-600 font-medium">Driver Dashboard</p>
            <p className="text-sm font-black text-white">Rohit Kumar</p>
          </div>
          <div className="bg-white/6 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-white">Bus 12 · North Route A</p>
              <span className="text-[8px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/8 rounded-lg p-2 text-center">
                <p className="text-base font-black text-white">3/4</p>
                <p className="text-[8px] text-zinc-500">Boarded</p>
              </div>
              <div className="flex-1 bg-white/8 rounded-lg p-2 text-center">
                <p className="text-base font-black text-green-400">8</p>
                <p className="text-[8px] text-zinc-500">ETA min</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { name: "Aarav Roy",  status: "boarded", color: "bg-green-500" },
              { name: "Mira Dutta", status: "boarded", color: "bg-green-500" },
              { name: "Sia Das",    status: "absent",  color: "bg-amber-500" },
            ].map((s) => (
              <div key={s.name} className="bg-white/5 rounded-lg px-2.5 py-2 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`} />
                <p className="text-[9px] font-bold text-white flex-1">{s.name}</p>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                  s.status === "boarded" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {s.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-red-900/25 border border-red-700/25 rounded-xl p-2.5 flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-400" />
            <p className="text-[9px] font-bold text-red-300">SOS always accessible</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ticker strip ───────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "Live GPS Tracking", "Instant SOS Alerts", "Student Roster Management",
  "Driver Document Renewals", "Parent Notifications", "Trip History",
  "Teacher Attendance", "Compliance Dashboard", "Route Deviation Alerts",
  "AI ETA Prediction", "Custom Stop Overrides", "Unlimited Vehicle Tracking",
];

function TickerStrip() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="border-y border-dark-border bg-dark/60 py-4 overflow-hidden">
      <div className="ticker-wrap">
        <div className="flex gap-12 animate-ticker whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-semibold text-zinc-500">
              <span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AI-First Section ───────────────────────────────────────────────────────────

const AI_FEATURES = [
  {
    icon: TrendingUp,
    title: "Smart ETA prediction",
    body: "AI analyses traffic patterns, historical route data, and real-time pings to give parents accurate arrival times — not just raw GPS.",
    color: "from-brand-600 to-violet-600",
    iconBg: "bg-brand-900/60",
    iconColor: "text-brand-400",
    tag: "Parents",
  },
  {
    icon: Eye,
    title: "Route anomaly detection",
    body: "The AI flags unexpected stops, route deviations, or unusual delays the moment they happen — triggering instant alerts before anyone notices.",
    color: "from-red-600 to-orange-500",
    iconBg: "bg-red-900/50",
    iconColor: "text-red-400",
    tag: "Real-time",
  },
  {
    icon: MessageSquare,
    title: "Teacher AI assistant",
    body: "Teachers get instant attendance summaries, engagement pattern insights, and AI-drafted parent update messages — ready to send in one tap.",
    color: "from-violet-600 to-purple-600",
    iconBg: "bg-violet-900/50",
    iconColor: "text-violet-400",
    tag: "Teachers",
  },
  {
    icon: Activity,
    title: "Live fleet intelligence",
    body: "The dashboard sees every vehicle in real time. AI surfaces outliers — late buses, missing pings, capacity issues — without manual checking.",
    color: "from-emerald-600 to-teal-600",
    iconBg: "bg-emerald-900/50",
    iconColor: "text-emerald-400",
    tag: "Schools",
  },
];

function NeuralDots() {
  const dots = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((i) => {
        const cx = 10 + (i % 6) * 18;
        const cy = 10 + Math.floor(i / 6) * 25;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand-500/30"
            style={{ left: `${cx}%`, top: `${cy}%` }}
            animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.4, 1] }}
            transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.15 }}
          />
        );
      })}
    </div>
  );
}

function AISection() {
  const ref  = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="ai-platform" ref={ref} className="py-24 bg-dark border-t border-dark-border relative overflow-hidden">
      <NeuralDots />
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand-600/8 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-5">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <Cpu size={12} className="text-brand-400" />
            </motion.div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">AI-first platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Built on AI.{" "}
            <span className="text-gradient">Live for everyone.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Skippo&apos;s AI layer works silently in real time — predicting, detecting, and assisting
            so students, teachers, parents, and drivers never have to wait for answers.
          </p>
        </motion.div>

        {/* Feature cards with 3D tilt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Tilt3D
                key={f.title}
                className="relative rounded-3xl border border-dark-border bg-dark-card overflow-hidden group cursor-default"
                strength={6}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                >
                  {/* Gradient top accent */}
                  <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  {/* Subtle gradient bg on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

                  <div className="relative p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={22} className={f.iconColor} />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${f.color} bg-opacity-20 text-white`}>
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>

                    {/* Live indicator */}
                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-zinc-600">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      Running live · no setup required
                    </div>
                  </div>
                </motion.div>
              </Tilt3D>
            );
          })}
        </div>

        {/* Bottom AI CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 relative rounded-3xl border border-brand-500/20 bg-gradient-to-r from-brand-950/60 via-dark-card to-violet-950/40 overflow-hidden p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-full bg-gradient-to-r from-brand-600/10 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-600/10 to-transparent" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={16} className="text-brand-400" />
              <span className="text-sm font-black text-white">AI that learns your school&apos;s patterns</span>
            </div>
            <p className="text-sm text-zinc-400">Every route, every student, every day — the platform gets smarter over time.</p>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="flex-shrink-0 relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-50 blur-sm" />
            <Link
              href="/signup"
              className="relative btn-shine flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-bold rounded-xl"
            >
              Try the AI platform <ArrowRight size={14} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats section ──────────────────────────────────────────────────────────────

const STATS = [
  { value: 60,  suffix: "s",  label: "Location refresh",   accent: "text-brand-400"   },
  { value: 5,   suffix: "",   label: "Platform surfaces",   accent: "text-violet-400"  },
  { value: 100, suffix: "%",  label: "SOS delivery rate",  accent: "text-emerald-400" },
  { value: 24,  suffix: "h",  label: "Onboarding support", accent: "text-amber-400"   },
];

function StatsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const counters = STATS.map((s) => {
    const { count, ref: cRef } = useCountUp(s.value); // eslint-disable-line react-hooks/rules-of-hooks
    return { ...s, count, cRef };
  });

  return (
    <section ref={ref} className="py-20 bg-dark border-b border-dark-border">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {counters.map((s) => (
            <Tilt3D key={s.label} strength={5} className="relative text-center group">
              <motion.div variants={fadeUp} className="relative rounded-2xl border border-transparent hover:border-dark-border p-4 transition-all">
                <p className={`stat-value text-4xl md:text-5xl font-black mb-2 ${s.accent}`}>
                  <motion.span ref={s.cRef as React.RefObject<HTMLSpanElement>}>{s.count}</motion.span>
                  {s.suffix}
                </p>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            </Tilt3D>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Bento features section ─────────────────────────────────────────────────────

const BENTO_FEATURES = [
  { icon: MapPin,         title: "Live bus tracking",       body: "Parents see the bus position update every 60 seconds. No more anxious waiting at the stop.", accent: "from-brand-600 to-violet-600", iconBg: "bg-brand-900/60",   iconColor: "text-brand-400",   col: "md:col-span-2", dark: true },
  { icon: AlertTriangle,  title: "One-tap SOS",             body: "Drivers trigger SOS from any screen. All parents on the route and school admin are alerted in seconds.", accent: "from-red-600 to-orange-600", iconBg: "bg-red-900/40",     iconColor: "text-red-400",     col: "md:col-span-1", dark: true },
  { icon: Wrench,         title: "Breakdown coordination",  body: "Driver reports a breakdown, parents are notified instantly, and nearby buses can be contacted.", accent: "from-amber-600 to-yellow-600", iconBg: "bg-amber-900/40",   iconColor: "text-amber-400",   col: "md:col-span-1", dark: true },
  { icon: ClipboardList,  title: "Digital student roster",  body: "Board and drop students in two taps. Custom stop overrides set by parents are shown per student.", accent: "from-emerald-600 to-teal-600", iconBg: "bg-emerald-900/40", iconColor: "text-emerald-400", col: "md:col-span-1", dark: true },
  { icon: GraduationCap,  title: "Teacher attendance",      body: "Teachers take attendance on their phone, add notes per student, and parents get academic updates.", accent: "from-violet-600 to-purple-600", iconBg: "bg-violet-900/40",  iconColor: "text-violet-400",  col: "md:col-span-1", dark: true },
  { icon: LayoutDashboard, title: "Admin dashboard",        body: "School admins manage routes, vehicles, compliance, messaging, and driver approvals — one place, full control.", accent: "from-sky-600 to-blue-600", iconBg: "bg-sky-900/40",     iconColor: "text-sky-400",     col: "md:col-span-1", dark: true },
];

function FeaturesSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="py-24 bg-dark">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Everything you need</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Built for every role</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">One platform, five surfaces — parents, drivers, teachers, and admins all connected.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BENTO_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Tilt3D
                key={f.title}
                className={`relative rounded-3xl border border-dark-border bg-dark-card overflow-hidden group cursor-default ${f.col}`}
                strength={7}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
                >
                  <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-3xl`} />
                  <div className="relative p-6">
                    <div className={`w-11 h-11 ${f.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={20} className={f.iconColor} />
                    </div>
                    <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>
                  </div>
                </motion.div>
              </Tilt3D>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: School, label: "For schools", color: "from-brand-600 to-violet-600",
    iconBg: "bg-brand-900/40", iconColor: "text-brand-400",
    steps: [
      { title: "Register your school",      body: "Sign up in minutes with your school details and fleet size." },
      { title: "Add vehicles & routes",     body: "Configure routes, stops, and vehicle assignments from the dashboard." },
      { title: "Invite drivers & parents",  body: "Send invite links. Everyone is on board without manual data entry." },
    ],
  },
  {
    icon: Users, label: "For parents", color: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-900/40", iconColor: "text-amber-400",
    steps: [
      { title: "Download the parent app",   body: "Sign up with your phone number, link your child, and pick their bus route." },
      { title: "Track live, every morning", body: "See the bus on a live map. AI alerts arrive before the bus does." },
      { title: "Stay informed all day",     body: "Board/drop confirmations, progress notes, and emergency alerts in one place." },
    ],
  },
  {
    icon: Bus, label: "For drivers", color: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-900/40", iconColor: "text-emerald-400",
    steps: [
      { title: "Join with your invite code", body: "Use the invite token from your school or self-register in under 2 minutes." },
      { title: "Run your route",             body: "Start a trip, board students with one tap, drop at custom stops." },
      { title: "Safety always covered",      body: "SOS and Breakdown buttons are one tap away at all times during a trip." },
    ],
  },
];

function HowItWorksSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-dark border-t border-dark-border">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Simple setup</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">How Skippo works</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">From onboarding to daily operations — everything is designed to be instant.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((role, ri) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.label}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: ri * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex flex-col"
              >
                <div className="flex flex-col items-center mb-8 text-center">
                  <div className={`w-14 h-14 rounded-3xl ${role.iconBg} border border-white/5 flex items-center justify-center mb-3`}>
                    <Icon size={24} className={role.iconColor} />
                  </div>
                  <h3 className="font-black text-white text-lg">{role.label}</h3>
                </div>
                <div className="flex flex-col gap-0">
                  {role.steps.map((step, si) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -16 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: ri * 0.15 + si * 0.1 + 0.2 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${role.color} text-white font-black text-sm flex items-center justify-center shadow-brand z-10`}>
                          {si + 1}
                        </div>
                        {si < role.steps.length - 1 && (
                          <div className="w-px flex-1 my-1 bg-gradient-to-b from-white/10 to-transparent" />
                        )}
                      </div>
                      <div className={`pb-${si < role.steps.length - 1 ? "6" : "0"} pt-1`}>
                        <p className="font-black text-white mb-1 text-sm">{step.title}</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">{step.body}</p>
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

// ── App lifecycle animation section ───────────────────────────────────────────

const LIFECYCLE_SCREENS = [
  {
    id: "login",
    label: "Login",
    emoji: "🔑",
    color: "from-brand-600 to-violet-600",
    title: "Sign in instantly",
    desc: "OTP-based login — no passwords, no friction. Parents and drivers are in within 30 seconds.",
    screen: (
      <div className="space-y-3 px-3">
        <div className="text-center pt-2 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 mx-auto mb-2 flex items-center justify-center">
            <span className="text-white text-sm font-black">S</span>
          </div>
          <p className="text-xs font-black text-white">Welcome to Skippo</p>
          <p className="text-[9px] text-zinc-500">Enter your phone to continue</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">+91</span>
          <div className="w-px h-4 bg-zinc-700" />
          <span className="text-[11px] text-zinc-400">98765 43210</span>
        </div>
        <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-xl p-3 text-center">
          <p className="text-[11px] font-black text-white">Send OTP →</p>
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    emoji: "🏠",
    color: "from-emerald-600 to-teal-600",
    title: "Your child's morning, at a glance",
    desc: "Parents see live bus ETA, boarding confirmation, and driver contact the moment they open the app.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2">
          <p className="text-[9px] text-zinc-500">Good morning, Priya</p>
          <p className="text-xs font-black text-white">Aarav&apos;s Bus</p>
        </div>
        <div className="bg-gradient-to-br from-brand-600 to-violet-600 rounded-xl p-3 text-white">
          <p className="text-[8px] text-white/70 uppercase tracking-wider">Arriving in</p>
          <p className="text-xl font-black">8 <span className="text-xs font-semibold text-white/80">min</span></p>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <p className="text-[8px] font-semibold text-white/80">LIVE · North Route A</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-800 rounded-lg p-2 text-center">
            <p className="text-[9px] font-black text-emerald-400">✓ Boarded</p>
          </div>
          <div className="flex-1 bg-zinc-800 rounded-lg p-2 text-center">
            <p className="text-[9px] font-black text-white">Call driver</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tracking",
    label: "Live Track",
    emoji: "📍",
    color: "from-amber-500 to-orange-500",
    title: "Real-time map, every 60 seconds",
    desc: "The bus marker moves as the driver pings location. Parents always know exactly where it is.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs font-black text-white">Live Tracking</p>
          <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />LIVE
          </span>
        </div>
        <div className="bg-zinc-800 rounded-xl overflow-hidden h-24 relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          <Route size={14} className="text-brand-400 z-10" />
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow-lg shadow-brand-500/50 z-10"
            animate={{ x: [-20, 20, -20], y: [10, -10, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2">
          <MapPin size={10} className="text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-white">Lakeview Stop</p>
            <p className="text-[8px] text-zinc-500">Updated 42s ago</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sos",
    label: "SOS Alert",
    emoji: "🚨",
    color: "from-red-600 to-orange-600",
    title: "Emergency in one tap",
    desc: "Drivers trigger SOS from any screen. All parents on the route receive an instant alert within seconds.",
    screen: (
      <div className="space-y-2 px-3">
        <div className="pt-2">
          <p className="text-xs font-black text-white">Emergency</p>
          <p className="text-[9px] text-zinc-500">One tap, full coverage</p>
        </div>
        <motion.div
          className="rounded-2xl bg-red-500/20 border border-red-500/40 p-4 flex flex-col items-center gap-2"
          animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.4)", "0 0 0px rgba(239,68,68,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle size={20} className="text-red-400" />
          <p className="text-[10px] font-black text-red-300 text-center">SOS · All parents notified</p>
          <p className="text-[8px] text-red-400 text-center">Help is on the way · Stay calm</p>
        </motion.div>
        <div className="bg-zinc-800 rounded-lg p-2">
          <p className="text-[8px] text-zinc-400">28 parents notified · 0:04s delivery</p>
        </div>
      </div>
    ),
  },
];

function AppLifecycleSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-cycle screens
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActive((a) => (a + 1) % LIFECYCLE_SCREENS.length);
          return 0;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const screen = LIFECYCLE_SCREENS[active];

  return (
    <section ref={ref} className="py-24 bg-dark border-t border-dark-border overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-5">
            <Activity size={12} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">App in action</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            See the full journey
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">From login to live tracking to emergency response — the entire experience in one platform.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone frame */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex justify-center"
          >
            <div className="relative w-[260px]">
              {/* Glow */}
              <motion.div
                className={`absolute inset-0 blur-3xl rounded-full scale-110 bg-gradient-to-br ${screen.color} opacity-25`}
                animate={{ opacity: [0.2, 0.35, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Phone shell */}
              <div className="relative bg-dark-card border border-dark-border rounded-[2.5rem] overflow-hidden shadow-heavy">
                {/* Status bar */}
                <div className="h-9 bg-zinc-900 flex items-center justify-between px-5 pt-2">
                  <span className="text-[10px] font-semibold text-zinc-500">9:41</span>
                  <div className="w-14 h-3.5 bg-zinc-700 rounded-full" />
                  <div className="flex gap-1">
                    {[3, 2, 1].map((i) => <div key={i} className="w-1 rounded-sm bg-zinc-500" style={{ height: `${4 + i * 3}px` }} />)}
                  </div>
                </div>

                {/* Screen tabs inside phone */}
                <div className="bg-zinc-900 px-3 pt-2 pb-1 flex gap-1.5">
                  {LIFECYCLE_SCREENS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setActive(i); setProgress(0); }}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-bold transition-all ${
                        active === i
                          ? "bg-gradient-to-r " + s.color + " text-white"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      {s.emoji}
                    </button>
                  ))}
                </div>

                {/* Screen content */}
                <div className="bg-zinc-900 min-h-[260px] py-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {screen.screen}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Progress bar at bottom */}
                <div className="h-1 bg-zinc-800">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${screen.color}`}
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step list */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            className="space-y-4"
          >
            {LIFECYCLE_SCREENS.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => { setActive(i); setProgress(0); }}
                className={`w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                  active === i
                    ? "border-brand-500/40 bg-dark-card"
                    : "border-dark-border bg-transparent hover:bg-dark-card/50"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-base flex-shrink-0`}>
                      {s.emoji}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{s.title}</p>
                      <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
                    </div>
                    {active === i && (
                      <motion.div
                        className="ml-auto"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <span className="flex items-center gap-1 text-[9px] font-bold text-brand-400">
                          <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
                          LIVE
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <AnimatePresence>
                    {active === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-zinc-400 leading-relaxed"
                      >
                        {s.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {active === i && (
                  <div className="h-0.5 bg-zinc-800">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${s.color}`}
                      style={{ width: `${progress}%` }}
                    />
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

// ── App surfaces strip ─────────────────────────────────────────────────────────

const APP_SURFACES = [
  { label: "Parent App",  color: "bg-brand-600",  desc: "iOS & Android", sub: "Live tracking, alerts, progress" },
  { label: "Driver App",  color: "bg-emerald-600", desc: "Android-first", sub: "Trip control, SOS, roster"       },
  { label: "Teacher App", color: "bg-violet-600",  desc: "iOS & Android", sub: "Attendance, notes, progress"     },
  { label: "Dashboard",   color: "bg-amber-600",   desc: "Web browser",   sub: "Admin control center"            },
];

function AppSurfacesSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 bg-dark border-t border-dark-border">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-black text-white mb-3">One platform, five surfaces</h2>
          <p className="text-zinc-400">Every role gets a dedicated, purpose-built experience.</p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {APP_SURFACES.map((s) => (
            <Tilt3D key={s.label} strength={8}>
              <motion.div
                variants={fadeUp}
                className="bg-dark-card border border-dark-border rounded-3xl p-5 group cursor-default relative overflow-hidden"
              >
                <div className={`w-10 h-10 ${s.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center shadow-md`}>
                  <Sparkles size={16} className="text-white" />
                </div>
                <p className="font-black text-white text-sm mb-0.5">{s.label}</p>
                <p className="text-xs font-semibold text-zinc-500 mb-2">{s.desc}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.sub}</p>
              </motion.div>
            </Tilt3D>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: "Skippo reduced our daily transport chaos to a five-minute morning routine. Parents stopped calling to ask where the bus is.", name: "Priya Sen",    role: "Principal, Sunrise Academy" },
  { quote: "The SOS button alone is worth it. We had one incident and every parent was notified in under 30 seconds.",                   name: "Rajesh Nair",   role: "Transport Manager, DPS Kochi" },
  { quote: "Our drivers love it. They went from keeping paper rosters to a one-tap digital attendance. Night and day difference.",       name: "Ananya Sharma", role: "Admin, Delhi Modern School" },
  { quote: "Parents trust us more because they can see exactly where their child is. That's priceless for a school.",                   name: "Kiran Mehta",   role: "Director, Greenfield Academy" },
];

function TestimonialsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const items  = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section ref={ref} className="py-24 bg-dark border-t border-dark-border overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Loved by schools across India</h2>
          <p className="text-zinc-400">Hear from the educators and admins who run on Skippo every day.</p>
        </motion.div>
      </div>
      <div className="ticker-wrap">
        <div className="flex gap-5 animate-ticker">
          {items.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-80 bg-dark-card border border-dark-border rounded-3xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-black text-brand-300">{t.name.split(" ").map((n) => n[0]).join("")}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For schools / pilot section ────────────────────────────────────────────────

const PILOT_FEATURES = [
  "Up to 10 vehicles included",
  "Unlimited parent accounts",
  "Real-time GPS tracking",
  "Unlimited vehicular tracking (Beta)",
  "SOS & breakdown flows",
  "AI-powered ETA & anomaly detection",
  "Teacher & admin portal",
  "Priority onboarding support",
];

function ForSchoolsSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="for-schools" ref={ref} className="py-24 bg-dark border-t border-dark-border">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Why schools choose Skippo</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-5">
              Every morning, every student,{" "}
              <span className="text-gradient">every stop</span>.
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-10">
              Managing school transport is complex. Skippo reduces that complexity to a few taps —
              for drivers, parents, and administrators alike.
            </p>

            <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-6">
              {[
                { icon: AlertTriangle, title: "No missed drops",      body: "Automatically alerts parents when a student is still on the bus when the trip ends.", color: "text-red-400",     bg: "bg-red-900/30"     },
                { icon: ClipboardList, title: "Compliance reminders", body: "Vehicle fitness certs, insurance, and permit renewals are tracked and surfaced automatically.", color: "text-amber-400",  bg: "bg-amber-900/30"  },
                { icon: Bus,           title: "Multi-vehicle drivers", body: "A driver with multiple bus assignments switches vehicles in two taps.", color: "text-brand-400",  bg: "bg-brand-900/30"  },
                { icon: Shield,        title: "Works on any device",  body: "Web apps work in any browser. Native apps are available for iOS and Android.", color: "text-emerald-400", bg: "bg-emerald-900/30" },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5`}>
                      <ItemIcon size={16} className={item.color} />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm mb-0.5">{item.title}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right: pilot card */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.96 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <Tilt3D strength={5} className="relative">
              <div className="absolute -inset-[1px] rounded-4xl bg-gradient-to-br from-brand-500/40 via-violet-500/20 to-brand-800/40 blur-sm" />
              <div className="relative bg-dark-card rounded-4xl border border-dark-border p-8 overflow-hidden">
                {/* Animated bg accent */}
                <motion.div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-600/8 blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Beta · Limited spots</p>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2">Free beta access</h3>
                  <p className="text-zinc-400 text-sm mb-3">
                    Beta access includes <span className="text-brand-400 font-bold">unlimited vehicular tracking</span> — all buses, all routes, all the time. No credit card. No commitment.
                  </p>

                  {/* Beta badge */}
                  <div className="inline-flex items-center gap-2 bg-brand-950/60 border border-brand-800/50 rounded-xl px-3 py-2 mb-6">
                    <Zap size={12} className="text-brand-400" />
                    <span className="text-xs font-bold text-brand-300">Beta = Unlimited vehicle tracking unlocked</span>
                  </div>

                  <motion.ul variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className="space-y-3 mb-8">
                    {PILOT_FEATURES.map((f) => (
                      <motion.li key={f} variants={fadeUp} className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className={f.includes("Beta") || f.includes("AI") ? "text-brand-400 flex-shrink-0" : "text-brand-500 flex-shrink-0"} />
                        <span className={f.includes("Beta") ? "text-brand-300 font-semibold" : ""}>{f}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative">
                    <motion.div
                      className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-60 blur-sm"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Link
                      href="/signup"
                      className="btn-shine relative flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-brand-600 to-violet-600 text-white text-center rounded-2xl font-bold hover:shadow-brand-lg transition-shadow"
                    >
                      Get beta access — it&apos;s free
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                  <p className="text-center text-xs text-zinc-600 mt-4">We&apos;ll get in touch within 24 hours.</p>
                </div>
              </div>
            </Tilt3D>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA banner ─────────────────────────────────────────────────────────────────

function CTASection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden bg-dark border-t border-dark-border">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-3xl"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
            Ready to transform your school&apos;s transport?
          </h2>
          <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
            Join the schools already running safer, smarter routes with Skippo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative">
              <motion.div
                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-50 blur-md"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Link
                href="/signup"
                className="btn-shine relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold hover:shadow-brand-lg transition-shadow text-sm"
              >
                Get beta access — it&apos;s free
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 px-8 py-4 glass border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-colors text-sm"
              >
                Talk to the team
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-dark-border py-14">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-brand">
                <span className="text-white text-sm font-black">S</span>
              </div>
              <span className="text-white font-black text-lg">Skippo</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">The AI-powered operations platform for school transport.</p>
          </div>
          <div>
            <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-2.5">
              {["Features", "AI Platform", "How it works", "For schools"].map((l) => (
                <li key={l}><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5">
              {[{ label: "About", href: "#" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "#" }, { label: "Terms", href: "#" }].map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-zinc-500 hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-xs uppercase tracking-widest mb-4">Get started</p>
            <ul className="space-y-2.5">
              <li><Link href="/signup" className="text-sm text-zinc-500 hover:text-white transition-colors">Register your school</Link></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Parent app</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Driver app</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dark-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 Skippo. Built in India 🇮🇳</p>
          <p className="text-xs text-zinc-600">Keeping every child safe, every day.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <Hero />
      <TickerStrip />
      <AISection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AppLifecycleSection />
      <AppSurfacesSection />
      <TestimonialsSection />
      <ForSchoolsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
