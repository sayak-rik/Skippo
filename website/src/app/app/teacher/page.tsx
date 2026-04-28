"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Brain, BookOpen, Users, Mic, MessageSquare,
  CheckCircle2, ArrowRight, Star, Zap, ClipboardList,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

function getTeacherUrl() {
  if (typeof window === "undefined") return "#";
  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//localhost:3002`;
  }
  const base = hostname.replace(/^www\./, "");
  return `${protocol}//teacher.${base}`;
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI lesson planner",
    body: "Type a topic — Skippo generates a full curriculum-aligned lesson plan with objectives, warm-up, activities, and exit ticket in seconds.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart2,
    title: "AI class summary",
    body: "After each session, Skippo analyses attendance and progress notes to generate a class summary, flag weak students, and suggest revision topics.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: Mic,
    title: "Voice observations",
    body: "Speak a quick note about a student — Skippo structures it into a formal observation and saves it to their record automatically.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: MessageSquare,
    title: "Class broadcasts",
    body: "Send tasks, reminders, or announcements to every student and parent in a class in one tap — no group chats, no email chains.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Users,
    title: "Student roster & attendance",
    body: "Your full class list is always one tap away. Mark attendance, view progress history, and write progress notes for individuals.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: ClipboardList,
    title: "Progress notes",
    body: "Log structured observations on any student — academic, behavioural, or extra-curricular. Notes feed directly into the weekly parent digest.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

const LESSON_STEPS = [
  { step: "Objective",      text: "Students understand and apply Pythagoras Theorem to right triangles." },
  { step: "Warm-up (5m)",   text: "Quick quiz on squares and square roots from previous lesson." },
  { step: "Teach (20m)",    text: "Diagram proof, formula derivation, 3 worked examples on board." },
  { step: "Activity (15m)", text: "Partner worksheet — 8 problems increasing in difficulty." },
  { step: "Wrap-up (5m)",   text: "3-2-1 exit ticket: 3 things learned, 2 questions, 1 real-world use." },
];

function LessonPlanDemo() {
  const [visible, setVisible] = useState(false);
  const [typed,   setTyped]   = useState("");
  const topic   = "Pythagoras Theorem — intro & applications";
  const ref     = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(topic.slice(0, i));
      if (i >= topic.length) {
        clearInterval(typer);
        setTimeout(() => setVisible(true), 400);
      }
    }, 38);
    return () => clearInterval(typer);
  }, [inView]);

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-4 bg-violet-100/50 rounded-3xl blur-2xl" />
      <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-muted border-b border-surface-border">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="mx-3 flex-1 bg-white rounded-md h-5 flex items-center px-3 border border-surface-border max-w-xs">
            <span className="text-[10px] text-ink-faint">teacher.skippo.co.in/ai</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-ink-muted">AI Lesson Planner</p>
              <p className="text-sm font-black text-ink">Grade 8 — Mathematics</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
              <Zap size={9} />
              AI · 4 tokens left
            </div>
          </div>

          <div className="bg-surface-muted rounded-xl p-3 border border-surface-border">
            <p className="text-[9px] text-ink-muted mb-1">Topic</p>
            <p className="text-xs font-semibold text-ink min-h-[1rem]">
              {typed}
              {typed.length < topic.length && <span className="animate-pulse">|</span>}
            </p>
          </div>

          <AnimatePresence>
            {visible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                className="space-y-1.5"
              >
                {LESSON_STEPS.map((s, i) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-2.5 bg-violet-50 rounded-lg p-2.5"
                  >
                    <span className="text-[9px] font-black text-violet-600 whitespace-nowrap mt-0.5 w-24 flex-shrink-0">{s.step}</span>
                    <p className="text-[9px] text-ink-muted leading-relaxed">{s.text}</p>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-1 bg-surface-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-violet-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-violet-600 whitespace-nowrap">Plan ready</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ClassSummaryDemo() {
  return (
    <div className="relative bg-white rounded-2xl border border-surface-border shadow-lift overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-ink-muted">AI Class Summary</p>
          <p className="text-sm font-black text-ink">Grade 8B · Today</p>
        </div>
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">Generated</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { v: "32/34",  l: "Attendance", c: "bg-brand-50 text-brand-600" },
          { v: "4",      l: "Need help",  c: "bg-red-50 text-red-600"    },
          { v: "2",      l: "Revise",     c: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.l} className={`${s.c.split(" ")[0]} rounded-xl p-2.5 text-center`}>
            <p className={`text-lg font-black ${s.c.split(" ")[1]}`}>{s.v}</p>
            <p className="text-[8px] font-semibold text-ink-muted">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="bg-surface-soft rounded-xl p-3 border border-surface-border">
          <p className="text-[9px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Summary</p>
          <p className="text-[10px] text-ink leading-relaxed">Class engaged well with the theorem proof. Exit tickets show 85% grasp of the core concept.</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1.5">Students needing attention</p>
          <div className="flex flex-wrap gap-1.5">
            {["Aarav R.", "Priya S.", "Dev K.", "Ananya M."].map((n) => (
              <span key={n} className="text-[9px] font-semibold bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherAppPage() {
  const [teacherUrl, setTeacherUrl] = useState("#");

  useEffect(() => {
    setTeacherUrl(getTeacherUrl());
  }, []);

  const featRef  = useRef<HTMLElement>(null);
  const featView = useInView(featRef, { once: true, margin: "-80px" });
  const demoRef  = useRef<HTMLElement>(null);
  const demoView = useInView(demoRef, { once: true, margin: "-80px" });

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
          <a
            href={teacherUrl}
            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            Open Teacher App
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-violet-50 to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-100/60 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 border border-violet-100 bg-violet-50 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Teacher App</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-ink leading-tight tracking-tight mb-6">
                Less prep.{" "}
                <span className="text-violet-600">More teaching.</span>
              </h1>
              <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-lg">
                Skippo gives teachers an AI co-pilot — lesson plans from a single topic, instant class summaries, voice-to-note observations, and direct parent communication. All in one place.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                {["Web app", "iOS & Android", "AI-powered", "Invite only"].map((tag) => (
                  <span key={tag} className="text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.a
                  href={teacherUrl}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-colors shadow-[0_8px_32px_-4px_rgba(124,58,237,0.40)]"
                >
                  Open Teacher App <ArrowRight size={16} />
                </motion.a>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border-2 border-surface-border text-ink rounded-2xl font-bold hover:border-violet-200 hover:bg-violet-50 transition-colors"
                  >
                    Get your school set up
                  </Link>
                </motion.div>
              </div>
              <p className="text-xs text-ink-faint mt-4">Access is granted by your school admin · No sign-up required</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <LessonPlanDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-surface-border bg-surface-soft py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-5">
            {[
              { value: "15,000+", label: "Teachers active" },
              { value: "< 5s",    label: "Lesson plan generation" },
              { value: "3 hrs",   label: "Weekly prep time saved" },
              { value: "5 AI",    label: "Assists per day, per teacher" },
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
              Your classroom, upgraded.
            </h2>
            <p className="text-lg text-ink-muted max-w-xl mx-auto">
              Everything a teacher needs — from lesson planning to parent communication — without the admin overhead.
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

      {/* AI deep-dive: two demos side by side */}
      <section ref={demoRef} className="py-24 bg-surface-soft border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={demoView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 border border-violet-100 bg-violet-50 rounded-full px-4 py-1.5 mb-6">
              <Brain size={12} className="text-violet-600" />
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-widest">AI features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">
              Powered by Gemini AI.
            </h2>
            <p className="text-lg text-ink-muted max-w-xl mx-auto">
              Each teacher gets 5 AI assists per day. Use them for lesson plans, class summaries, or voice observations — your call.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={demoView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Lesson Plan Generator</p>
              <LessonPlanDemo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={demoView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Class Summary & Insights</p>
              <ClassSummaryDemo />
            </motion.div>
          </div>

          {/* Token callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={demoView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-white border border-surface-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-violet-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-black text-ink mb-1">5 AI assists per teacher per day</p>
              <p className="text-sm text-ink-muted">Each school sets its own AI token budget. The limit resets at midnight — and your school admin can raise it any time.</p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`w-5 h-5 rounded-full border-2 ${i <= 4 ? "bg-violet-500 border-violet-500" : "bg-surface-muted border-surface-border"}`} />
                ))}
              </div>
              <p className="text-[9px] text-ink-muted text-center mt-1">4 used · 1 remaining</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-ink tracking-tight mb-4">Getting started takes minutes.</h2>
            <p className="text-lg text-ink-muted">Your school admin onboards Skippo — you just accept an invite.</p>
          </div>

          <div className="space-y-0">
            {[
              { title: "Your school activates Skippo",  desc: "The school admin signs up and configures your school's account — teachers are added by the admin." },
              { title: "You receive an invite",          desc: "A link arrives via email or SMS. Click it, set up your profile, and your classes are already assigned." },
              { title: "Open the teacher app",           desc: "Access via browser at teacher.skippo.co.in or download the iOS / Android app. Same account, either way." },
              { title: "Use AI from day one",            desc: "Type a topic to generate a lesson plan. Run a class summary after your first session. Your tokens refresh daily." },
            ].map((s, i) => (
              <div key={s.title} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 z-10">
                    {i + 1}
                  </div>
                  {i < 3 && <div className="w-px flex-1 my-2 bg-surface-border" />}
                </div>
                <div className={i < 3 ? "pb-8 pt-1.5" : "pt-1.5"}>
                  <p className="font-black text-ink text-base mb-1">{s.title}</p>
                  <p className="text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
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
            <h2 className="text-3xl font-black text-ink mb-2">Teachers love Skippo</h2>
            <p className="text-ink-muted">From lesson prep to parent updates — all without leaving the app.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I used to spend Sunday evenings writing lesson plans. Now I type the topic on Monday morning and the plan is ready before the bell.",
                name: "Kavya Menon",
                role: "Grade 8 Mathematics, Greenfield Academy",
              },
              {
                quote: "The voice observation feature is a game-changer. I can note something about a student while it's fresh, without stopping the class.",
                name: "Sanjay Patel",
                role: "Grade 6 Science, DPS Hyderabad",
              },
              {
                quote: "Parents actually know what their children are working on because I can send them a note in 10 seconds. Skippo cut my parent email time by 80%.",
                name: "Rekha Krishnan",
                role: "Grade 9 English, Sunrise International",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-surface-border p-6 shadow-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-ink leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-violet-600">{t.name[0]}</span>
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

      {/* CTA */}
      <section className="py-20 bg-violet-600 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Ready to reclaim your prep time?
          </h2>
          <p className="text-white/75 text-lg mb-10">
            Ask your school admin to activate Skippo — or get your school started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href={teacherUrl}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-violet-700 rounded-2xl font-bold hover:bg-violet-50 transition-colors"
            >
              Open Teacher App <ArrowRight size={16} />
            </a>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/15 border border-white/30 text-white rounded-2xl font-bold hover:bg-white/25 transition-colors"
            >
              Get your school set up
            </Link>
          </div>
          <p className="text-white/60 text-xs">
            Already have access?{" "}
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
            <Link href="/app/parent" className="hover:text-ink transition-colors">Parent App</Link>
            <Link href="/app/driver" className="hover:text-ink transition-colors">Driver App</Link>
            <Link href="/signup"     className="hover:text-ink transition-colors">Admin Dashboard</Link>
            <Link href="/contact"    className="hover:text-ink transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-ink-faint">© 2026 Skippo Technologies</p>
        </div>
      </footer>
    </div>
  );
}
