"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogin, saveSession } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await adminLogin(email, password);
      saveSession(session);
      router.replace(session.role === "superuser" ? "/admin/dashboard" : "/admin/leads");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-ink text-lg">Skippo</span>
        </Link>

        <div className="bg-white border border-surface-border rounded-2xl p-8 shadow-card">
          <h1 className="text-xl font-black text-ink mb-1">Internal login</h1>
          <p className="text-sm text-ink-muted mb-6">Staff &amp; admin access only.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="you@skippo.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
