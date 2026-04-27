"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import styles from "../../../components/dashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus = "pending" | "contacted" | "onboarded";

interface Lead {
  id: number;
  enquiry_type: string;
  name: string;
  email: string;
  phone: string;
  school_name: string;
  message: string;
  status: LeadStatus;
  admin_notes: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find(r => r.startsWith("skippo_token="))?.split("=")[1] ?? "";
}

function statusColor(s: LeadStatus) {
  if (s === "pending")   return { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" };
  if (s === "contacted") return { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" };
  return                        { bg: "#d1fae5", text: "#065f46", dot: "#10b981" };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Provision modal ───────────────────────────────────────────────────────────

function ProvisionModal({ lead, onClose, onSuccess }: {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [schoolName,  setSchoolName]  = useState(lead?.school_name ?? "");
  const [schoolSlug,  setSchoolSlug]  = useState("");
  const [adminEmail,  setAdminEmail]  = useState(lead?.email ?? "");
  const [adminName,   setAdminName]   = useState(lead?.name ?? "");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState<{ school: string; slug: string; email: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolName || !adminEmail) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/tenancy/admin/schools/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          school_name: schoolName,
          school_slug: schoolSlug || undefined,
          admin_email: adminEmail,
          admin_name:  adminName,
          lead_id:     lead?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Something went wrong");
      setDone({ school: data.school.name, slug: data.school.slug, email: data.admin.email });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>School created!</h2>
            <p style={{ color: "#6b7280", marginBottom: 4 }}><strong>{done.school}</strong></p>
            <p style={{ color: "#6b7280", marginBottom: 4 }}>Login ID (school slug): <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 6 }}>{done.slug}</code></p>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>Admin email: <strong>{done.email}</strong></p>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>The admin can now log in at the dashboard using their school ID and email. They'll receive an OTP to their inbox.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: "10px 28px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Create school account</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "School name *",         value: schoolName,  set: setSchoolName,  type: "text",  placeholder: "Greenfield Public School" },
                { label: "School slug (login ID)", value: schoolSlug,  set: setSchoolSlug,  type: "text",  placeholder: "auto-generated from name" },
                { label: "Admin name",             value: adminName,   set: setAdminName,   type: "text",  placeholder: "Priya Sharma" },
                { label: "Admin email *",          value: adminEmail,  set: setAdminEmail,  type: "email", placeholder: "admin@school.edu.in" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#374151" }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || !schoolName || !adminEmail}
                style={{ padding: "12px", background: loading ? "#a5b4fc" : "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 14, marginTop: 4 }}
              >
                {loading ? "Creating…" : "Create school & send invite"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<LeadStatus | "all">("all");
  const [selected,     setSelected]     = useState<Lead | null>(null);
  const [showProvision, setShowProvision] = useState(false);
  const [notesEdit,    setNotesEdit]    = useState<{ [id: number]: string }>({});

  async function fetchLeads() {
    try {
      const url = filter === "all" ? `${API}/api/tenancy/admin/interests/` : `${API}/api/tenancy/admin/interests/?status=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setLeads(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(lead: Lead, newStatus: LeadStatus) {
    await fetch(`${API}/api/tenancy/admin/interests/${lead.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchLeads();
  }

  async function saveNotes(lead: Lead) {
    const notes = notesEdit[lead.id] ?? lead.admin_notes;
    await fetch(`${API}/api/tenancy/admin/interests/${lead.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ admin_notes: notes }),
    });
    fetchLeads();
    setSelected(null);
  }

  const counts = {
    all:       leads.length,
    pending:   leads.filter(l => l.status === "pending").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    onboarded: leads.filter(l => l.status === "onboarded").length,
  };

  return (
    <DashboardShell>
      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Registration Interests</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Schools and individuals who submitted the contact form.</p>
          </div>
          <button
            onClick={() => { setSelected(null); setShowProvision(true); }}
            style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            + New school
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["all", "pending", "contacted", "onboarded"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
                borderColor: filter === f ? "#4f46e5" : "#e5e7eb",
                background:  filter === f ? "#eef2ff" : "#fff",
                color:       filter === f ? "#4f46e5" : "#6b7280",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Loading…</p>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p>No leads yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leads.map(lead => {
              const col = statusColor(lead.status);
              return (
                <div
                  key={lead.id}
                  style={{ background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}
                >
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#4f46e5", fontSize: 15, flexShrink: 0 }}>
                    {lead.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{lead.name}</span>
                      {lead.enquiry_type && (
                        <span style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{lead.enquiry_type}</span>
                      )}
                    </div>
                    <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
                    {lead.school_name && <p style={{ color: "#374151", fontSize: 13, fontWeight: 600 }}>🏫 {lead.school_name}</p>}
                    {lead.message && <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 480 }}>{lead.message}</p>}
                    <p style={{ color: "#d1d5db", fontSize: 11, marginTop: 6 }}>{fmt(lead.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {/* Status badge + changer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, background: col.bg, color: col.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: col.dot, display: "inline-block" }} />
                        {lead.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      {lead.status !== "contacted" && (
                        <button onClick={() => updateStatus(lead, "contacted")}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
                          Mark contacted
                        </button>
                      )}
                      {lead.status !== "onboarded" && (
                        <button onClick={() => { setSelected(lead); setShowProvision(true); }}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1.5px solid #a7f3d0", background: "#ecfdf5", color: "#065f46", fontWeight: 600, cursor: "pointer" }}>
                          Create account
                        </button>
                      )}
                      <button onClick={() => setSelected(lead)}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                        Notes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes drawer */}
        {selected && !showProvision && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxWidth: 520 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Notes — {selected.name}</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>✕</button>
              </div>
              <textarea
                rows={5}
                defaultValue={selected.admin_notes}
                onChange={e => setNotesEdit(n => ({ ...n, [selected.id]: e.target.value }))}
                placeholder="Add internal notes about this lead…"
                style={{ width: "100%", padding: "12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => saveNotes(selected)}
                  style={{ flex: 1, padding: 10, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                  Save notes
                </button>
                <button onClick={() => setSelected(null)}
                  style={{ padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Provision modal */}
        {showProvision && (
          <ProvisionModal
            lead={selected}
            onClose={() => { setShowProvision(false); setSelected(null); }}
            onSuccess={() => fetchLeads()}
          />
        )}
      </div>
    </DashboardShell>
  );
}
