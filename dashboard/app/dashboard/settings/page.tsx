"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../lib/api";
import styles from "./settings.module.css";

type SchoolProfile = {
  name: string;
  slug: string;
  logo_url: string;
  brand_name: string;
  onboarding_complete: boolean;
};

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function SchoolAvatar({ name, logoUrl, size = 64 }: { name: string; logoUrl: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: 12, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.3,
        letterSpacing: -0.5,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<SchoolProfile>("/api/tenancy/school/profile")
      .then(setProfile)
      .catch(() => setError("Failed to load school profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    setError("");

    try {
      const token = getCookie("skippo_token");
      const school = getCookie("skippo_school");
      const form = new FormData();
      form.append("logo", file);

      const res = await fetch("/api/tenancy/school/logo", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(school ? { "X-School-Slug": school } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.detail ?? "Upload failed");
      }
      const data = await res.json();
      setProfile((p) => p ? { ...p, logo_url: data.logo_url } : p);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    if (!profile) return;
    try {
      await apiFetch("/api/tenancy/school/profile", {
        method: "PATCH",
        body: JSON.stringify({ logo_url: "" }),
      });
      setProfile((p) => p ? { ...p, logo_url: "" } : p);
    } catch {
      setError("Failed to remove logo.");
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch<SchoolProfile>("/api/tenancy/school/profile", {
        method: "PATCH",
        body: JSON.stringify({ brand_name: profile.brand_name }),
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ color: "var(--ink-dim)", fontSize: 14, paddingTop: 40, textAlign: "center" }}>
          Loading school profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div style={{ color: "var(--danger)", fontSize: 14 }}>{error || "School profile not found."}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageSubtitle}>
        Configure your school&apos;s branding, identity, and dashboard preferences.
      </p>

      {error && (
        <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* ── First-time setup banner ─────────────────────────────────────── */}
      {!profile.logo_url && (
        <div className={styles.setupBanner}>
          <span className={styles.setupIcon}>🏫</span>
          <div>
            <div className={styles.setupBannerTitle}>Complete your school profile</div>
            <div className={styles.setupBannerText}>
              Upload your school logo so it appears across the dashboard. Until then, your school
              initials are shown as a placeholder.
            </div>
          </div>
        </div>
      )}

      {/* ── School Branding ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>School branding</h2>

        <div className={styles.brandRow}>
          <SchoolAvatar name={profile.name} logoUrl={profile.logo_url} size={80} />

          <div className={styles.brandInfo}>
            <div className={styles.brandName}>{profile.name}</div>
            <div className={styles.brandSlug}>School ID: {profile.slug}</div>
            <div className={styles.uploadActions}>
              <button
                className={styles.uploadBtn}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : profile.logo_url ? "Replace logo" : "Upload logo"}
              </button>
              {profile.logo_url && (
                <button className={styles.removeBtn} onClick={handleRemoveLogo}>
                  Remove
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
            <p className={styles.uploadHint}>
              PNG, JPG, or SVG · Recommended 256 × 256 px · Max 1 MB
            </p>
          </div>
        </div>
      </section>

      {/* ── Dashboard URL ───────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dashboard access</h2>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>School ID (username)</span>
          <code className={styles.infoValue}>{profile.slug}</code>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Dashboard URL</span>
          <code className={styles.infoValue}>
            https://dashboard.skippo.app/login?school={profile.slug}
          </code>
        </div>
        <p className={styles.infoNote}>
          Share the school ID and the admin email with staff who need dashboard access. They log in
          with an OTP sent to their email. Contact Skippo support to reset credentials.
        </p>
      </section>

      {/* ── Save ────────────────────────────────────────────────────────── */}
      <div className={styles.saveRow}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
