"use client";

import Link from "next/link";
import { useState } from "react";

const TOTAL_STEPS = 4;

const SCHOOL_TYPES = ["Primary School", "Secondary School", "Higher Secondary", "K-12 School", "International School", "Other"];

const FLEET_SIZES = [
  { label: "1 – 5 vehicles",    value: "1-5"    },
  { label: "6 – 15 vehicles",   value: "6-15"   },
  { label: "16 – 30 vehicles",  value: "16-30"  },
  { label: "30+ vehicles",      value: "30+"    },
];

type FormData = {
  schoolName:  string;
  city:        string;
  state:       string;
  schoolType:  string;
  adminName:   string;
  email:       string;
  phone:       string;
  fleetSize:   string;
  studentCount:string;
  message:     string;
};

const empty: FormData = {
  schoolName:   "",
  city:         "",
  state:        "",
  schoolType:   "",
  adminName:    "",
  email:        "",
  phone:        "",
  fleetSize:    "",
  studentCount: "",
  message:      "",
};

// ── Reusable input ────────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, type = "text", placeholder = "", required = false,
}: {
  label: string; name: keyof FormData; value: string;
  onChange: (k: keyof FormData, v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-1.5">
        {label} {required && <span className="text-brand-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface text-ink text-sm
          placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-all"
      />
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function Progress({ step }: { step: number }) {
  const labels = ["School", "Admin", "Fleet", "Done"];
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => {
        const idx   = i + 1;
        const done  = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  done    ? "bg-brand-600 text-white shadow-brand" :
                  active  ? "bg-brand-600 text-white shadow-brand ring-4 ring-brand-100" :
                            "bg-surface-muted text-ink-faint border border-surface-border"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 14 12">
                    <path d="M1 6l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : idx}
              </div>
              <span className={`text-xs font-semibold mt-1.5 ${active ? "text-brand-600" : done ? "text-ink-muted" : "text-ink-faint"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 transition-all ${done ? "bg-brand-600" : "bg-surface-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-2xl font-black text-ink mb-1">Tell us about your school</h2>
        <p className="text-sm text-ink-muted">We&apos;ll set up your Skippo workspace based on this.</p>
      </div>
      <Field label="School name"  name="schoolName"  value={data.schoolName}  onChange={set} placeholder="Greenfield Public School" required />
      <div className="grid grid-cols-2 gap-4">
        <Field label="City"  name="city"  value={data.city}  onChange={set} placeholder="Kolkata" required />
        <Field label="State" name="state" value={data.state} onChange={set} placeholder="West Bengal" required />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">
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
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-surface-border bg-surface text-ink-muted hover:border-brand-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-2xl font-black text-ink mb-1">Your contact details</h2>
        <p className="text-sm text-ink-muted">You&apos;ll be the primary admin for your school on Skippo.</p>
      </div>
      <Field label="Full name"    name="adminName" value={data.adminName} onChange={set} placeholder="Priya Sharma"    required />
      <Field label="Work email"   name="email"     value={data.email}     onChange={set} placeholder="principal@greenfield.edu" type="email" required />
      <Field label="Phone number" name="phone"     value={data.phone}     onChange={set} placeholder="+91 98765 43210"  type="tel" required />
    </div>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-2xl font-black text-ink mb-1">Fleet &amp; student details</h2>
        <p className="text-sm text-ink-muted">This helps us configure the right plan for you.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">
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
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-surface-border bg-surface text-ink-muted hover:border-brand-200"
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
        <label className="block text-sm font-semibold text-ink mb-1.5">Anything else we should know? <span className="text-ink-faint">(optional)</span></label>
        <textarea
          value={data.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Special requirements, existing systems, questions…"
          rows={3}
          className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface text-ink text-sm
            placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            transition-all resize-none"
        />
      </div>
    </div>
  );
}

function Step4({ data }: { data: FormData }) {
  return (
    <div className="text-center animate-fade-up">
      <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="text-2xl font-black text-ink mb-3">You&apos;re on the list!</h2>
      <p className="text-ink-muted mb-8 max-w-sm mx-auto">
        Thanks, <strong className="text-ink">{data.adminName || "there"}</strong>! We&apos;ll reach out to{" "}
        <strong className="text-ink">{data.email || "your email"}</strong> within 24 hours to set up{" "}
        <strong className="text-ink">{data.schoolName || "your school"}</strong> on Skippo.
      </p>

      {/* Summary card */}
      <div className="bg-surface-muted rounded-3xl p-5 text-left space-y-3 mb-8">
        {[
          { label: "School",   value: `${data.schoolName}, ${data.city}` },
          { label: "Admin",    value: `${data.adminName} · ${data.email}` },
          { label: "Fleet",    value: FLEET_SIZES.find((s) => s.value === data.fleetSize)?.label ?? data.fleetSize },
          { label: "Students", value: data.studentCount ? `~${data.studentCount} students` : "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span className="text-xs font-bold text-ink-faint w-16 flex-shrink-0 mt-0.5">{row.label}</span>
            <span className="text-sm font-semibold text-ink">{row.value}</span>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="inline-block px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-colors shadow-brand text-sm"
      >
        ← Back to homepage
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [step, setStep]     = useState(1);
  const [data, setDataRaw]  = useState<FormData>(empty);
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
    if (step < TOTAL_STEPS) {
      if (step === TOTAL_STEPS - 1) {
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(TOTAL_STEPS); }, 1200);
      } else {
        setStep((s) => s + 1);
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      {/* Minimal nav */}
      <nav className="h-16 border-b border-surface-border bg-surface flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <span className="font-black text-ink">Skippo</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-surface rounded-4xl border border-surface-border shadow-lift p-8 md:p-10">
            {step < TOTAL_STEPS && <Progress step={step} />}

            {step === 1 && <Step1 data={data} set={set} />}
            {step === 2 && <Step2 data={data} set={set} />}
            {step === 3 && <Step3 data={data} set={set} />}
            {step === 4 && <Step4 data={data} />}

            {step < TOTAL_STEPS && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
                  >
                    ← Back
                  </button>
                ) : (
                  <Link href="/" className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
                    ← Cancel
                  </Link>
                )}

                <button
                  onClick={handleNext}
                  disabled={!canNext() || loading}
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
                      Submitting…
                    </>
                  ) : step === TOTAL_STEPS - 1 ? (
                    "Submit application →"
                  ) : (
                    "Continue →"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          {step < TOTAL_STEPS && (
            <p className="text-center text-xs text-ink-faint mt-5">
              Already have an account?{" "}
              <a href="#" className="text-brand-600 font-semibold hover:underline">Sign in</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
