"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CalendarDays, Plus, Trash2, Pencil, X, Sun, Flag, School2,
  BookOpen, Dumbbell, Music2, Users2, MoreHorizontal,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AcademicYear { id: number; name: string; is_current: boolean; }

interface Holiday {
  id: number;
  academic_year_id: number | null;
  name: string;
  date: string;
  holiday_type: "national" | "regional" | "school";
}

interface AcademicEvent {
  id: number;
  academic_year_id: number | null;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: "exam" | "sports" | "cultural" | "parent_meeting" | "other";
}

// ── Lookups ──────────────────────────────────────────────────────────────────

const HOLIDAY_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  national: { label: "National",  color: "#2563eb", bg: "#eff6ff", icon: Flag },
  regional: { label: "Regional",  color: "#7c3aed", bg: "#f5f3ff", icon: Sun },
  school:   { label: "School",    color: "#0891b2", bg: "#e0f2fe", icon: School2 },
};

const EVENT_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  exam:           { label: "Exam",           color: "#dc2626", bg: "#fef2f2", icon: BookOpen },
  sports:         { label: "Sports",         color: "#16a34a", bg: "#f0fdf4", icon: Dumbbell },
  cultural:       { label: "Cultural",       color: "#d97706", bg: "#fffbeb", icon: Music2 },
  parent_meeting: { label: "Parent Meeting", color: "#7c3aed", bg: "#f5f3ff", icon: Users2 },
  other:          { label: "Other",          color: "#64748b", bg: "#f1f5f9", icon: MoreHorizontal },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

function TypeBadge({ meta }: { meta: { label: string; color: string; bg: string } }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg, borderRadius: 999, padding: "2px 9px" }}>
      {meta.label}
    </span>
  );
}

// ── Holiday Drawer ────────────────────────────────────────────────────────────

function HolidayDrawer({ editing, yearId, onClose, onSaved }: {
  editing?: Holiday;
  yearId: number | null;
  onClose: () => void;
  onSaved: (h: Holiday) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    date: editing?.date ?? "",
    holiday_type: editing?.holiday_type ?? "school",
    academic_year_id: yearId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/academics/admin/holidays/${editing.id}/` : "/api/academics/admin/holidays/";
      const data = await apiFetch<Holiday>(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      onSaved(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Academic Calendar</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Holiday" : "Add Holiday"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Holiday name *</label>
          <input style={inputStyle} value={form.name} placeholder="e.g. Republic Day" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Date *</label>
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(HOLIDAY_TYPE_META).map(([k, v]) => (
              <button key={k} onClick={() => setForm(p => ({ ...p, holiday_type: k as any }))}
                style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${form.holiday_type === k ? v.color : "var(--stroke)"}`, background: form.holiday_type === k ? v.bg : "var(--surface)", color: form.holiday_type === k ? v.color : "var(--ink-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={!form.name || !form.date || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.name || !form.date || loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : editing ? "Save changes" : "Add holiday"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Event Drawer ──────────────────────────────────────────────────────────────

function EventDrawer({ editing, yearId, onClose, onSaved }: {
  editing?: AcademicEvent;
  yearId: number | null;
  onClose: () => void;
  onSaved: (e: AcademicEvent) => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    start_date: editing?.start_date ?? "",
    end_date: editing?.end_date ?? "",
    event_type: editing?.event_type ?? "other",
    academic_year_id: yearId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/academics/admin/academic-events/${editing.id}/` : "/api/academics/admin/academic-events/";
      const data = await apiFetch<AcademicEvent>(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      onSaved(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Academic Calendar</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Event" : "Add Event"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Event type</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Object.entries(EVENT_TYPE_META).map(([k, v]) => (
              <button key={k} onClick={() => setForm(p => ({ ...p, event_type: k as any }))}
                style={{ padding: "8px 4px", borderRadius: 9, border: `1px solid ${form.event_type === k ? v.color : "var(--stroke)"}`, background: form.event_type === k ? v.bg : "var(--surface)", color: form.event_type === k ? v.color : "var(--ink-soft)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Title *</label>
          <input style={inputStyle} value={form.title} placeholder="e.g. Annual Sports Day" onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Start date *</label>
            <input style={inputStyle} type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>End date *</label>
            <input style={inputStyle} type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Description <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Details about this event…" style={{ ...inputStyle, resize: "none" }} />
        </div>
        <button onClick={save} disabled={!form.title || !form.start_date || !form.end_date || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.title || loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : editing ? "Save changes" : "Add event"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "holidays" | "events";

export default function AcademicCalendarPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("holidays");
  const [hDrawer, setHDrawer] = useState<{ open: boolean; editing?: Holiday }>({ open: false });
  const [eDrawer, setEDrawer] = useState<{ open: boolean; editing?: AcademicEvent }>({ open: false });

  useEffect(() => {
    apiFetch<AcademicYear[]>("/api/academics/admin/academic-years/")
      .then((d) => {
        const ys = Array.isArray(d) ? d : [];
        setYears(ys);
        const cur = ys.find((y) => y.is_current);
        setSelectedYearId(cur?.id ?? ys[0]?.id ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedYearId === null) { setLoading(false); return; }
    setLoading(true);
    const q = `?academic_year=${selectedYearId}`;
    Promise.all([
      apiFetch<Holiday[]>(`/api/academics/admin/holidays/${q}`),
      apiFetch<AcademicEvent[]>(`/api/academics/admin/academic-events/${q}`),
    ])
      .then(([h, e]) => {
        setHolidays(Array.isArray(h) ? h : []);
        setEvents(Array.isArray(e) ? e : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYearId]);

  async function deleteHoliday(id: number) {
    if (!confirm("Delete this holiday?")) return;
    await apiFetch(`/api/academics/admin/holidays/${id}/`, { method: "DELETE" });
    setHolidays((p) => p.filter((h) => h.id !== id));
  }

  async function deleteEvent(id: number) {
    if (!confirm("Delete this event?")) return;
    await apiFetch(`/api/academics/admin/academic-events/${id}/`, { method: "DELETE" });
    setEvents((p) => p.filter((e) => e.id !== id));
  }

  return (
    <DashboardShell>
      <AnimatePresence>
        {hDrawer.open && (
          <HolidayDrawer editing={hDrawer.editing} yearId={selectedYearId}
            onClose={() => setHDrawer({ open: false })}
            onSaved={(h) => setHolidays((p) => hDrawer.editing ? p.map((x) => x.id === h.id ? h : x) : [...p, h])} />
        )}
        {eDrawer.open && (
          <EventDrawer editing={eDrawer.editing} yearId={selectedYearId}
            onClose={() => setEDrawer({ open: false })}
            onSaved={(e) => setEvents((p) => eDrawer.editing ? p.map((x) => x.id === e.id ? e : x) : [...p, e])} />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 900 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>School Setup</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Academic Calendar</h1>
          </div>
          <button
            onClick={() => tab === "holidays" ? setHDrawer({ open: true }) : setEDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Plus size={16} /> Add {tab === "holidays" ? "Holiday" : "Event"}
          </button>
        </motion.div>

        {/* Year picker + Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <select
            value={selectedYearId ?? ""}
            onChange={(e) => setSelectedYearId(Number(e.target.value))}
            style={{ ...inputStyle, width: "auto", minWidth: 160 }}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}{y.is_current ? " (Current)" : ""}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, padding: 3 }}>
            {([
              { key: "holidays", label: `Holidays (${holidays.length})` },
              { key: "events", label: `Events (${events.length})` },
            ] as const).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: "7px 18px", borderRadius: 8, border: "none", fontWeight: tab === t.key ? 700 : 400, fontSize: 13, cursor: "pointer", background: tab === t.key ? "var(--surface)" : "transparent", color: tab === t.key ? "var(--primary)" : "var(--ink-soft)", boxShadow: tab === t.key ? "var(--shadow-sm)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {tab === "holidays" ? (
            Object.entries(HOLIDAY_TYPE_META).map(([k, v]) => {
              const count = holidays.filter((h) => h.holiday_type === k).length;
              return (
                <div key={k} style={{ background: v.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${v.color}22` }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{count}</p>
                  <p style={{ fontSize: 11, color: v.color, fontWeight: 600 }}>{v.label}</p>
                </div>
              );
            })
          ) : (
            Object.entries(EVENT_TYPE_META).map(([k, v]) => {
              const count = events.filter((e) => e.event_type === k).length;
              return (
                <div key={k} style={{ background: v.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${v.color}22` }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{count}</p>
                  <p style={{ fontSize: 11, color: v.color, fontWeight: 600 }}>{v.label}</p>
                </div>
              );
            })
          )}
        </motion.div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : tab === "holidays" ? (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {holidays.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>🗓️</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No holidays yet</p>
                <button onClick={() => setHDrawer({ open: true })} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add first holiday</button>
              </div>
            ) : (
              holidays.map((h) => {
                const meta = HOLIDAY_TYPE_META[h.holiday_type] ?? HOLIDAY_TYPE_META.school;
                return (
                  <motion.div key={h.id} variants={fade} style={{
                    background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 12,
                    padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <meta.icon size={18} color={meta.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{h.name}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>{fmtDate(h.date)}</p>
                    </div>
                    <TypeBadge meta={meta} />
                    <button onClick={() => setHDrawer({ open: true, editing: h })} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-soft)" }}><Pencil size={13} /></button>
                    <button onClick={() => deleteHoliday(h.id)} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-dim)" }}><Trash2 size={13} /></button>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>📆</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No events yet</p>
                <button onClick={() => setEDrawer({ open: true })} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add first event</button>
              </div>
            ) : (
              events.map((ev) => {
                const meta = EVENT_TYPE_META[ev.event_type] ?? EVENT_TYPE_META.other;
                const multiDay = ev.start_date !== ev.end_date;
                return (
                  <motion.div key={ev.id} variants={fade} style={{
                    background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 12,
                    padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <meta.icon size={18} color={meta.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{ev.title}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: ev.description ? 4 : 0 }}>
                        {multiDay ? `${fmtDate(ev.start_date)} – ${fmtDate(ev.end_date)}` : fmtDate(ev.start_date)}
                      </p>
                      {ev.description && <p style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.5 }}>{ev.description}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                      <TypeBadge meta={meta} />
                      <button onClick={() => setEDrawer({ open: true, editing: ev })} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-soft)" }}><Pencil size={13} /></button>
                      <button onClick={() => deleteEvent(ev.id)} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-dim)" }}><Trash2 size={13} /></button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
