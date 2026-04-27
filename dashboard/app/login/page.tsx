"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import styles from "./login.module.css";

type Step = "credentials" | "otp" | "done";

export default function LoginPage() {
  const [step, setStep]       = useState<Step>("credentials");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolSlug.trim() || !email.trim()) {
      setError("School ID and email are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request/", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "X-School-Slug": schoolSlug.trim().toLowerCase(),
        },
        body: JSON.stringify({
          contact:     email.trim(),
          channel:     "email",
          role:        "admin",
          school_slug: schoolSlug.trim().toLowerCase(),
          purpose:     "login",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? "Could not send OTP. Check your school ID and email.");
      }
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP sent to your email."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify/", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "X-School-Slug": schoolSlug.trim().toLowerCase(),
        },
        body: JSON.stringify({
          contact:     email.trim(),
          channel:     "email",
          role:        "admin",
          school_slug: schoolSlug.trim().toLowerCase(),
          code:        otp.trim(),
          purpose:     "login",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? "Invalid or expired OTP.");
      }
      const data = await res.json();
      // Store JWT in a cookie so middleware can read it
      document.cookie = `skippo_token=${data.access}; path=/; SameSite=Lax`;
      document.cookie = `skippo_school=${schoolSlug.trim().toLowerCase()}; path=/; SameSite=Lax`;
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Background grid */}
      <div className={styles.grid} />

      {/* Glow blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Skippo" className={styles.logoMark} />
          <span className={styles.logoText}>Skippo</span>
        </div>

        <AnimatePresence mode="wait">
          {step === "credentials" && (
            <motion.div
              key="creds"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className={styles.title}>School dashboard</h1>
              <p className={styles.subtitle}>
                Sign in with your school ID and admin email to access the Skippo dashboard.
              </p>

              <form onSubmit={handleRequestOTP} className={styles.form}>
                <label className={styles.label}>
                  School ID
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. greenfield-public"
                    value={schoolSlug}
                    onChange={e => setSchoolSlug(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                  />
                  <span className={styles.hint}>
                    Your school's unique identifier — provided in the welcome email.
                  </span>
                </label>

                <label className={styles.label}>
                  Admin email
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="admin@school.edu.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  type="submit"
                  className={styles.btn}
                  disabled={loading}
                >
                  {loading ? "Sending OTP…" : "Send OTP →"}
                </button>
              </form>

              <p className={styles.footer}>
                Don&apos;t have access?{" "}
                <a href="https://skippo.in/signup" className={styles.link}>
                  Request school onboarding
                </a>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit OTP to <strong>{email}</strong>.{" "}
                Enter it below to sign in.
              </p>

              <form onSubmit={handleVerifyOTP} className={styles.form}>
                <label className={styles.label}>
                  One-time password
                  <input
                    className={`${styles.input} ${styles.inputOtp}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    required
                  />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  type="submit"
                  className={styles.btn}
                  disabled={loading}
                >
                  {loading ? "Verifying…" : "Verify & sign in"}
                </button>

                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                >
                  ← Back
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
