"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession, clearSession,
  fetchLeads, updateLead, provisionSchool,
  type Lead,
} from "@/lib/adminApi";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  onboarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function StaffLeadsPage() {
  const router = useRouter();
  const session = getSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<number, boolean>>({});

  // Provision modal
  const [provLead, setProvLead] = useState<Lead | null>(null);
  const [provAdminEmail, setProvAdminEmail] = useState("");
  const [provAdminName, setProvAdminName] = useState("");
  const [provLoading, setProvLoading] = useState(false);
  const [provResult, setProvResult] = useState<{ school: { name: string }; admin: { temp_password: string } } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const l = await fetchLeads();
      setLeads(l);
    } catch {
      // token expired — kick to login
      clearSession();
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!session || !session.token) {
      router.replace("/admin/login");
      return;
    }
    load();
  }, []);

  function logout() {
    clearSession();
    router.replace("/admin/login");
  }

  async function handleStatusChange(leadId: number, newStatus: Lead["status"]) {
    try {
      const updated = await updateLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
    } catch {
      alert("Failed to update status");
    }
  }

  async function saveNotes(lead: Lead) {
    const notes = editingNotes[lead.id] ?? lead.admin_notes;
    setSavingNotes(prev => ({ ...prev, [lead.id]: true }));
    try {
      const updated = await updateLead(lead.id, { admin_notes: notes });
      setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
      setEditingNotes(prev => { const n = { ...prev }; delete n[lead.id]; return n; });
    } catch {
      alert("Failed to save notes");
    } finally {
      setSavingNotes(prev => { const n = { ...prev }; delete n[lead.id]; return n; });
    }
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    if (!provLead) return;
    setProvLoading(true);
    try {
      const result = await provisionSchool({
        school_name: provLead.school_name || provLead.name,
        admin_email: provAdminEmail || provLead.email,
        admin_name:  provAdminName,
        lead_id:     provLead.id,
      });
      setProvResult(result);
      setLeads(prev => prev.map(l => l.id === provLead.id ? { ...l, status: "onboarded" } : l));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to provision school");
    } finally {
      setProvLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center">
        <p className="text-ink-muted text-sm">Loading…</p>
      </div>
    );
  }

  const pending   = leads.filter(l => l.status === "pending");
  const contacted = leads.filter(l => l.status === "contacted");
  const onboarded = leads.filter(l => l.status === "onboarded");

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <header className="bg-white border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="w-7 h-7" />
          <span className="font-black text-ink">Skippo</span>
          <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 font-semibold px-2 py-0.5 rounded-full">Sales</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-muted">{session?.name}</span>
          <button onClick={logout} className="text-xs text-ink-muted hover:text-ink transition-colors">Sign out</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending",   count: pending.length,   color: "text-amber-600"   },
            { label: "Contacted", count: contacted.length, color: "text-blue-600"    },
            { label: "Onboarded", count: onboarded.length, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-surface-border rounded-2xl px-4 py-3 shadow-card">
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-xs text-ink-muted font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Leads */}
        <div className="space-y-3">
          {leads.length === 0 && (
            <div className="bg-white border border-surface-border rounded-2xl p-8 text-center shadow-card">
              <p className="text-ink-muted text-sm">No leads assigned to you yet.</p>
            </div>
          )}
          {leads.map(lead => {
            const notes = editingNotes[lead.id] ?? lead.admin_notes;
            return (
              <div key={lead.id} className="bg-white border border-surface-border rounded-2xl p-4 shadow-card">
                <div className="flex flex-wrap items-start gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-ink">{lead.school_name || lead.name}</p>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{lead.name} · {lead.email}</p>
                    {lead.message && (
                      <p className="text-xs text-ink-soft mt-1 italic">"{lead.message}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        📞 {lead.phone}
                      </a>
                    )}

                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value as Lead["status"])}
                      className="text-xs border border-surface-border rounded-lg px-2 py-1.5 text-ink bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="onboarded">Onboarded</option>
                    </select>

                    {lead.status !== "onboarded" && (
                      <button
                        onClick={() => { setProvLead(lead); setProvAdminEmail(lead.email); setProvAdminName(lead.name); setProvResult(null); }}
                        className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Create school
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <textarea
                    value={notes}
                    onChange={e => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                    placeholder="Add notes… (call outcome, follow-up date, etc.)"
                    rows={2}
                    className="w-full text-xs border border-surface-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 text-ink placeholder:text-ink-faint"
                  />
                  {editingNotes[lead.id] !== undefined && editingNotes[lead.id] !== lead.admin_notes && (
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => saveNotes(lead)}
                        disabled={savingNotes[lead.id]}
                        className="text-xs text-brand-600 hover:text-brand-700 font-semibold disabled:opacity-60"
                      >
                        {savingNotes[lead.id] ? "Saving…" : "Save notes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provision Modal */}
      {provLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-heavy">
            {provResult ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h2 className="font-black text-ink text-lg">School created!</h2>
                  <p className="text-sm text-ink-muted mt-1">{provResult.school.name}</p>
                </div>
                <div className="bg-surface-soft border border-surface-border rounded-xl p-3 mb-4">
                  <p className="text-xs text-ink-muted mb-1">Temp password — share with school admin</p>
                  <p className="font-mono text-sm font-bold text-ink break-all">{provResult.admin.temp_password}</p>
                </div>
                <button onClick={() => setProvLead(null)}
                  className="w-full bg-brand-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-brand-700 transition-colors">
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="font-black text-ink text-lg mb-1">Create school profile</h2>
                <p className="text-sm text-ink-muted mb-4">{provLead.school_name || provLead.name}</p>
                <form onSubmit={handleProvision} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Admin email</label>
                    <input type="email" required value={provAdminEmail} onChange={e => setProvAdminEmail(e.target.value)}
                      className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Admin name</label>
                    <input value={provAdminName} onChange={e => setProvAdminName(e.target.value)} placeholder="Principal name"
                      className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setProvLead(null)}
                      className="flex-1 border border-surface-border rounded-xl py-2 text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={provLoading}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-2 rounded-xl text-sm transition-colors">
                      {provLoading ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
