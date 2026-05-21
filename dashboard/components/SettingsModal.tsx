"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "../lib/api";
import styles from "./dashboard.module.css";
import settingsStyles from "../app/dashboard/settings/settings.module.css";

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
      <img src={logoUrl} alt={name} style={{ width: size, height: size, borderRadius: 12, objectFit: "cover" }} />
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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch<SchoolProfile>("/api/tenancy/school/profile")
      .then(setProfile)
      .catch(() => setError("Failed to load school profile."))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

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

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Settings</h2>
            <p className={styles.modalSubtitle}>Configure your school&apos;s branding and preferences.</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading && (
            <div style={{ color: "var(--ink-dim)", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
              Loading school profile…
            </div>
          )}

          {!loading && !profile && (
            <div style={{ color: "var(--danger)", fontSize: 14 }}>{error || "School profile not found."}</div>
          )}

          {!loading && profile && (
            <>
              {error && (
                <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--danger)", marginBottom: 8 }}>
                  {error}
                </div>
              )}

              {!profile.logo_url && (
                <div className={settingsStyles.setupBanner}>
                  <span className={settingsStyles.setupIcon}>🏫</span>
                  <div>
                    <div className={settingsStyles.setupBannerTitle}>Complete your school profile</div>
                    <div className={settingsStyles.setupBannerText}>
                      Upload your school logo so it appears across the dashboard.
                    </div>
                  </div>
                </div>
              )}

              <section className={settingsStyles.section}>
                <h3 className={settingsStyles.sectionTitle}>School branding</h3>
                <div className={settingsStyles.brandRow}>
                  <SchoolAvatar name={profile.name} logoUrl={profile.logo_url} size={80} />
                  <div className={settingsStyles.brandInfo}>
                    <div className={settingsStyles.brandName}>{profile.name}</div>
                    <div className={settingsStyles.brandSlug}>School ID: {profile.slug}</div>
                    <div className={settingsStyles.uploadActions}>
                      <button
                        className={settingsStyles.uploadBtn}
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading…" : profile.logo_url ? "Replace logo" : "Upload logo"}
                      </button>
                      {profile.logo_url && (
                        <button className={settingsStyles.removeBtn} onClick={handleRemoveLogo}>
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
                    <p className={settingsStyles.uploadHint}>PNG, JPG, or SVG · Recommended 256×256 px · Max 1 MB</p>
                  </div>
                </div>
              </section>

              <section className={settingsStyles.section}>
                <h3 className={settingsStyles.sectionTitle}>Dashboard access</h3>
                <div className={settingsStyles.infoRow}>
                  <span className={settingsStyles.infoLabel}>School ID</span>
                  <code className={settingsStyles.infoValue}>{profile.slug}</code>
                </div>
                <div className={settingsStyles.infoRow}>
                  <span className={settingsStyles.infoLabel}>Dashboard URL</span>
                  <code className={settingsStyles.infoValue}>
                    https://dashboard.skippo.app/login?school={profile.slug}
                  </code>
                </div>
                <p className={settingsStyles.infoNote}>
                  Share the school ID and admin email with staff who need dashboard access.
                </p>
              </section>

              <div className={settingsStyles.saveRow}>
                <button className={settingsStyles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
