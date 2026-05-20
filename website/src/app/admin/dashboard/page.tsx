"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession, clearSession,
  fetchLeads, fetchStaff, updateLead, createStaff, deleteStaff, provisionSchool,
  type Lead, type StaffMember,
} from "@/lib/adminApi";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  onboarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function SuperuserDashboard() {
  const router = useRouter();
  const session = getSession();

  const [tab, setTab] = useState<"staff" | "leads">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add staff form
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Provision modal
  const [provLead, setProvLead] = useState<Lead | null>(null);
  const [provAdminEmail, setProvAdminEmail] = useState("");
  const [provAdminName, setProvAdminName] = useState("");
  const [provLoading, setProvLoading] = useState(false);
  const [provResult, setProvResult] = useState<{ school: { name: string }; admin: { temp_password: string } } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [l, s] = await Promise.all([fetchLeads(), fetchStaff()]);
      setLeads(l);
      setStaff(s);
    } catch {
      setError("Failed to load data. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session || session.role !== "superuser") {
      router.replace("/admin/login");
      return;
    }
    load();
  }, []);

  function logout() {
    clearSession();
    router.replace("/admin/login");
  }

  async function handleAssign(leadId: number, staffId: number | null) {
    try {
      const updated = await updateLead(leadId, { assigned_to: staffId });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
    } catch {
      alert("Failed to assign lead");
    }
  }

  async function handleStatusChange(leadId: number, newStatus: Lead["status"]) {
    try {
      const updated = await updateLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
    } catch {
      alert("Failed to update status");
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const member = await createStaff(newEmail, newName, newPass);
      setStaff(prev => [...prev, { ...member, lead_count: 0 }]);
      setNewEmail(""); setNewName(""); setNewPass("");
      setAddOpen(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add staff");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteStaff(id: number, name: string) {
    if (!confirm(`Remove ${name} from staff? Their assigned leads will become unassigned.`)) return;
    try {
      await deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch {
      alert("Failed to delete staff");
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

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <header className="bg-white border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="w-7 h-7" />
          <span className="font-black text-ink">Skippo Admin</span>
          <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 font-semibold px-2 py-0.5 rounded-full">Superuser</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-muted">{session?.email}</span>
          <button onClick={logout} className="text-xs text-ink-muted hover:text-ink transition-colors">Sign out</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl w-fit mb-6">
          {(["leads", "staff"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                tab === t ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t === "leads" ? `Leads (${leads.length})` : `Staff (${staff.length})`}
            </button>
          ))}
        </div>

        {/* ── LEADS TAB ── */}
        {tab === "leads" && (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-soft text-xs text-ink-muted font-semibold uppercase tracking-wide">
                  <th className="text-left px-4 py-3">School / Contact</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Assigned to</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {leads.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No leads yet.</td></tr>
                )}
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-surface-soft transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{lead.school_name || "—"}</p>
                      <p className="text-xs text-ink-muted">{lead.name} · {lead.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-brand-600 font-medium hover:underline">{lead.phone}</a>
                      ) : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as Lead["status"])}
                        className={`text-xs font-semibold border rounded-lg px-2 py-1 ${STATUS_COLORS[lead.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="onboarded">Onboarded</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.assigned_to?.id ?? ""}
                        onChange={e => handleAssign(lead.id, e.target.value ? Number(e.target.value) : null)}
                        className="text-xs border border-surface-border rounded-lg px-2 py-1 text-ink bg-white"
                      >
                        <option value="">Unassigned</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {lead.status !== "onboarded" && (
                        <button
                          onClick={() => { setProvLead(lead); setProvAdminEmail(lead.email); setProvAdminName(lead.name); setProvResult(null); }}
                          className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                        >
                          Create school
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── STAFF TAB ── */}
        {tab === "staff" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setAddOpen(true)}
                className="text-sm bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl transition-colors"
              >
                + Add staff
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staff.length === 0 && (
                <p className="text-sm text-ink-muted col-span-full">No staff members yet.</p>
              )}
              {staff.map(s => (
                <div key={s.id} className="bg-white border border-surface-border rounded-2xl p-4 shadow-card flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink text-sm">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.email}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{s.lead_count} lead{s.lead_count !== 1 ? "s" : ""} assigned</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(s.id, s.name)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-heavy">
            <h2 className="font-black text-ink text-lg mb-4">Add staff member</h2>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Email</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="staff@skippo.in"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Password</label>
                <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              {addError && <p className="text-xs text-red-600">{addError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAddOpen(false)}
                  className="flex-1 border border-surface-border rounded-xl py-2 text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-2 rounded-xl text-sm transition-colors">
                  {addLoading ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision School Modal */}
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
                  <p className="text-xs text-ink-muted mb-1">Temp password for school admin</p>
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
