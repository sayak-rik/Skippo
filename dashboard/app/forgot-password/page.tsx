"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import styles from "../login/login.module.css";

type Step = "form" | "otp" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep]         = useState<Step>("form");
  const [schoolSlug, setSchool] = useState("");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolSlug.trim() || !email.trim()) {
      setError("School ID and email are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset-request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:       email.trim().toLowerCase(),
          school_slug: schoolSlug.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.detail ?? "Request failed.");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP sent to your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset-confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:        email.trim().toLowerCase(),
          school_slug:  schoolSlug.trim().toLowerCase(),
          code:         otp.trim(),
          new_password: password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.detail ?? "Reset failed.");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        <div className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Skippo" className={styles.logoMark} />
          <span className={styles.logoText}>Skippo</span>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
            >
              <h1 className={styles.title}>Reset password</h1>
              <p className={styles.subtitle}>
                Enter your school ID and admin email. We&apos;ll send a one-time code to reset your password.
              </p>
              <form onSubmit={handleRequestOTP} className={styles.form}>
                <label className={styles.label}>
                  School ID
                  <input className={styles.input} type="text" placeholder="e.g. greenfield-public"
                    value={schoolSlug} onChange={e => setSchool(e.target.value)}
                    autoCapitalize="none" autoCorrect="off" required />
                </label>
                <label className={styles.label}>
                  Admin email
                  <input className={styles.input} type="email" placeholder="admin@school.edu.in"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </label>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? "Sending…" : "Send reset code →"}
                </button>
              </form>
              <p className={styles.footer}>
                <a href="/login" className={styles.link}>← Back to sign in</a>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
            >
              <h1 className={styles.title}>Set new password</h1>
              <p className={styles.subtitle}>
                Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
              </p>
              <form onSubmit={handleResetPassword} className={styles.form}>
                <label className={styles.label}>
                  Reset code
                  <input className={`${styles.input} ${styles.inputOtp}`}
                    type="text" inputMode="numeric" maxLength={6}
                    placeholder="• • • • • •"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus required />
                </label>
                <label className={styles.label}>
                  New password
                  <input className={styles.input} type="password" placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </label>
                <label className={styles.label}>
                  Confirm password
                  <input className={styles.input} type="password" placeholder="Repeat new password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </label>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? "Resetting…" : "Reset password"}
                </button>
                <button type="button" className={styles.btnGhost}
                  onClick={() => { setStep("form"); setOtp(""); setError(""); }}>
                  ← Back
                </button>
              </form>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className={styles.title}>Password updated</h1>
              <p className={styles.subtitle}>
                Your password has been reset. You can now sign in with your new password.
              </p>
              <a href="/login" className={styles.btn} style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>
                Sign in →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
