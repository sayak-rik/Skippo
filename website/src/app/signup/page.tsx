"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TOTAL_STEPS = 4;

const SCHOOL_TYPES = [
  "Primary School", "Secondary School", "Higher Secondary",
  "K-12 School", "International School", "Other",
];

const FLEET_SIZES = [
  { label: "1 – 5 vehicles",   value: "1-5"  },
  { label: "6 – 15 vehicles",  value: "6-15" },
  { label: "16 – 30 vehicles", value: "16-30" },
  { label: "30+ vehicles",     value: "30+"  },
];

type FormData = {
  schoolName:   string;
  city:         string;
  state:        string;
  schoolType:   string;
  adminName:    string;
  email:        string;
  phone:        string;
  fleetSize:    string;
  studentCount: string;
  message:      string;
};

const empty: FormData = {
  schoolName: "", city: "", state: "", schoolType: "",
  adminName: "", email: "", phone: "",
  fleetSize: "", studentCount: "", message: "",
};

// ── Reusable field ─────────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, type = "text", placeholder = "", required = false,
}: {
  label: string; name: keyof FormData; value: string;
  onChange: (k: keyof FormData, v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
        {label} {required ? <span className="text-brand-500">*</span> : <span className="text-zinc-600 text-xs">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
          placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
          transition-all"
      />
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function Progress({ step }: { step: number }) {
  const labels = ["School", "Admin", "Fleet", "Done"];
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => {
        const idx    = i + 1;
        const done   = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.25)" : "none",
                }}
                transition={{ duration: 0.3 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  done   ? "bg-gradient-to-br from-brand-600 to-violet-600 text-white" :
                  active ? "bg-gradient-to-br from-brand-600 to-violet-600 text-white" :
                           "bg-dark-muted text-zinc-600 border border-dark-border"
                }`}
              >
                {done ? <Check size={14} /> : idx}
              </motion.div>
              <span className={`text-xs font-semibold mt-1.5 ${active ? "text-brand-400" : done ? "text-zinc-400" : "text-zinc-600"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-px mb-5 mx-1.5 transition-all duration-500 ${done ? "bg-gradient-to-r from-brand-600 to-violet-600" : "bg-dark-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Steps ──────────────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Request access for your school</h2>
        <p className="text-sm text-zinc-400">We review every school personally. Access is granted after a brief onboarding call.</p>
      </div>
      <Field label="School name" name="schoolName" value={data.schoolName} onChange={set} placeholder="Greenfield Public School" required />
      <div className="grid grid-cols-2 gap-4">
        <Field label="City"  name="city"  value={data.city}  onChange={set} placeholder="Kolkata"      required />
        <Field label="State" name="state" value={data.state} onChange={set} placeholder="West Bengal"  required />
      </div>
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          School type <span className="text-brand-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SCHOOL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("schoolType", t)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all ${
                data.schoolType === t
                  ? "border-brand-500 bg-brand-900/40 text-brand-300"
                  : "border-dark-border bg-dark text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Your contact details</h2>
        <p className="text-sm text-zinc-400">You&apos;ll be the primary admin for your school on Skippo.</p>
      </div>
      <Field label="Full name"    name="adminName" value={data.adminName} onChange={set} placeholder="Priya Sharma"              required />
      <Field label="Work email"   name="email"     value={data.email}     onChange={set} type="email" placeholder="principal@school.edu" required />
      <Field label="Phone number" name="phone"     value={data.phone}     onChange={set} type="tel"   placeholder="+91 98765 43210"     required />
    </motion.div>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Fleet &amp; student details</h2>
        <p className="text-sm text-zinc-400">This helps us configure the right plan for you.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Number of vehicles <span className="text-brand-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FLEET_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set("fleetSize", s.value)}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                data.fleetSize === s.value
                  ? "border-brand-500 bg-brand-900/40 text-brand-300"
                  : "border-dark-border bg-dark text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <Field
        label="Approximate student count"
        name="studentCount"
        value={data.studentCount}
        onChange={set}
        placeholder="e.g. 600"
        type="number"
      />
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
          Anything else we should know? <span className="text-zinc-600 text-xs">(optional)</span>
        </label>
        <textarea
          value={data.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Special requirements, existing systems, questions…"
          rows={3}
          className="w-full px-4 py-3 rounded-2xl border border-dark-border bg-dark text-white text-sm
            placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
            transition-all resize-none"
        />
      </div>
    </motion.div>
  );
}

function Step4({ data }: { data: FormData }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-violet-700 flex items-center justify-center mx-auto mb-6 shadow-brand-lg"
      >
        <CheckCircle2 size={36} className="text-white" />
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">Request received!</h2>
      <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
        Thanks, <strong className="text-white">{data.adminName || "there"}</strong>! Our team will review your application
        and call <strong className="text-white">{data.adminName || "you"}</strong> at{" "}
        <strong className="text-white">{data.phone || "the number you provided"}</strong> within 24–48 hours to discuss
        onboarding <strong className="text-white">{data.schoolName || "your school"}</strong>.
      </p>

      {/* Summary */}
      <div className="bg-dark border border-dark-border rounded-3xl p-5 text-left space-y-3 mb-8">
        {[
          { label: "School",   value: `${data.schoolName}, ${data.city}` },
          { label: "Admin",    value: `${data.adminName} · ${data.email}` },
          { label: "Fleet",    value: FLEET_SIZES.find((s) => s.value === data.fleetSize)?.label ?? data.fleetSize },
          { label: "Students", value: data.studentCount ? `~${data.studentCount} students` : "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span className="text-xs font-bold text-zinc-600 w-16 flex-shrink-0 mt-0.5">{row.label}</span>
            <span className="text-sm font-semibold text-zinc-300">{row.value}</span>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold shadow-brand text-sm"
      >
        ← Back to homepage
      </Link>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [step, setStep]   = useState(1);
  const [data, setDataRaw] = useState<FormData>(empty);
  const [loading, setLoading] = useState(false);

  function set(key: keyof FormData, val: string) {
    setDataRaw((prev) => ({ ...prev, [key]: val }));
  }

  function canNext() {
    if (step === 1) return !!(data.schoolName && data.city && data.state && data.schoolType);
    if (step === 2) return !!(data.adminName && data.email && data.phone);
    if (step === 3) return !!data.fleetSize;
    return true;
  }

  function handleNext() {
    if (step === TOTAL_STEPS - 1) {
      setLoading(true);
      setTimeout(() => { setLoading(false); setStep(TOTAL_STEPS); }, 1400);
    } else if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      {/* Mesh background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="h-16 border-b border-dark-border bg-dark/80 nav-blur flex items-center px-6 relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-white">Skippo</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Pilot badge */}
          {step < TOTAL_STEPS && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" />
              <span className="text-xs font-semibold text-brand-400">Access by approval · Our team will call you back</span>
            </motion.div>
          )}

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative bg-dark-card border border-dark-border rounded-4xl p-8 md:p-10 overflow-hidden"
          >
            {/* Subtle gradient accent */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-600 via-violet-500 to-brand-600" />

            {step < TOTAL_STEPS && <Progress step={step} />}

            <AnimatePresence mode="wait">
              {step === 1 && <Step1 key="s1" data={data} set={set} />}
              {step === 2 && <Step2 key="s2" data={data} set={set} />}
              {step === 3 && <Step3 key="s3" data={data} set={set} />}
              {step === 4 && <Step4 key="s4" data={data} />}
            </AnimatePresence>

            {step < TOTAL_STEPS && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-border">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                ) : (
                  <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
                    ← Cancel
                  </Link>
                )}

                <motion.button
                  whileHover={{ scale: canNext() && !loading ? 1.03 : 1 }}
                  whileTap={{ scale: canNext() && !loading ? 0.97 : 1 }}
                  onClick={handleNext}
                  disabled={!canNext() || loading}
                  className="btn-shine flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold text-sm
                    shadow-brand hover:shadow-brand-lg transition-shadow
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                  ) : step === TOTAL_STEPS - 1 ? (
                    <>Submit application <ArrowRight size={14} /></>
                  ) : (
                    <>Continue <ArrowRight size={14} /></>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>

          {step < TOTAL_STEPS && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-zinc-600 mt-5"
            >
              Already have an account?{" "}
              <Link href="/signin" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">Sign in</Link>
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
