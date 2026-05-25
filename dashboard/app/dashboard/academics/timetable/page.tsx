"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Clock3, Plus, Save, Trash2, X, ChevronDown, BookOpen, Users, AlertCircle,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";
import { useIsMobile } from "../../../../lib/useIsMobile";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classroom { id: number; name: string; section: string; }
interface Subject    { id: number; name: string; code: string; }
interface Teacher    { id: number; name: string; employee_code: string; }

interface Timetable {
  id: number;
  classroom: number;
  classroom_name: string;
  academic_year: number | null;
  label: string;
  is_active: boolean;
  slots: SlotData[];
}

interface SlotData {
  id?: number;
  weekday: number;
  period_number: number;
  starts_at: string;
  ends_at: string;
  slot_type: "regular" | "break" | "assembly" | "free";
  subject: number | null;
  subject_name?: string;
  teacher: number | null;
  teacher_name?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SLOT_TYPE_META = {
  regular:  { label: "Lesson",   color: "#2563eb", bg: "#eff6ff" },
  break:    { label: "Break",    color: "#16a34a", bg: "#f0fdf4" },
  assembly: { label: "Assembly", color: "#7c3aed", bg: "#f5f3ff" },
  free:     { label: "Free",     color: "#94a3b8", bg: "#f8fafc" },
};

const DEFAULT_PERIODS = [
  { period: 1, start: "08:00", end: "08:45" },
  { period: 2, start: "08:45", end: "09:30" },
  { period: 3, start: "09:30", end: "10:15" },
  { period: 4, start: "10:30", end: "11:15" },
  { period: 5, start: "11:15", end: "12:00" },
  { period: 6, start: "12:00", end: "12:45" },
  { period: 7, start: "13:30", end: "14:15" },
  { period: 8, start: "14:15", end: "15:00" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--ink)", outline: "none", width: "100%",
};

// ── Slot Cell (desktop) ────────────────────────────────────────────────────────

function SlotCell({
  slot, subjects, teachers, onChange,
}: {
  slot: SlotData | null;
  subjects: Subject[];
  teachers: Teacher[];
  onChange: (s: Partial<SlotData> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const meta = slot ? SLOT_TYPE_META[slot.slot_type] : null;

  return (
    <div ref={ref} style={{ position: "relative", height: "100%" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          minHeight: 64, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
          background: meta ? meta.bg : "var(--surface-raised)",
          border: `1px solid ${meta ? meta.color + "33" : "var(--stroke)"}`,
          transition: "all 0.15s",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = meta ? meta.color + "33" : "var(--stroke)"; }}
      >
        {slot ? (
          <>
            {slot.slot_type !== "regular" ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: meta!.color, textTransform: "capitalize" }}>
                {SLOT_TYPE_META[slot.slot_type].label}
              </span>
            ) : (
              <>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {slot.subject_name || subjects.find(s => s.id === slot.subject)?.name || "—"}
                </span>
                {(slot.teacher_name || slot.teacher) && (
                  <span style={{ fontSize: 10, color: "var(--ink-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slot.teacher_name || teachers.find(t => t.id === slot.teacher)?.name || ""}
                  </span>
                )}
              </>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--ink-dim)", textAlign: "center" }}>
            <Plus size={12} style={{ display: "block", margin: "0 auto 2px" }} /> Add
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
              width: 240, background: "var(--surface)", border: "1px solid var(--stroke)",
              borderRadius: 12, padding: 14, boxShadow: "var(--shadow-lg)",
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {(Object.entries(SLOT_TYPE_META) as [string, any][]).map(([k, v]) => (
                <button key={k} onClick={() => onChange({ slot_type: k as any })}
                  style={{ padding: "5px 0", borderRadius: 6, border: `1px solid ${(slot?.slot_type ?? "regular") === k ? v.color : "var(--stroke)"}`, background: (slot?.slot_type ?? "regular") === k ? v.bg : "var(--surface)", color: (slot?.slot_type ?? "regular") === k ? v.color : "var(--ink-soft)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {v.label}
                </button>
              ))}
            </div>
            {(!slot || slot.slot_type === "regular") && (
              <>
                <select value={slot?.subject ?? ""} onChange={(e) => onChange({ subject: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
                  <option value="">— Subject —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={slot?.teacher ?? ""} onChange={(e) => onChange({ teacher: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
                  <option value="">— Teacher —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { onChange(null); setOpen(false); }}
                style={{ flex: 1, padding: "6px", borderRadius: 7, border: "1px solid var(--stroke)", background: "var(--surface-raised)", color: "var(--ink-soft)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Trash2 size={11} /> Clear
              </button>
              <button onClick={() => setOpen(false)}
                style={{ flex: 2, padding: "6px", borderRadius: 7, border: "none", background: "var(--primary)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Period Row Header ──────────────────────────────────────────────────────────

function PeriodHeader({ period, start, end, onTimeChange, onDelete }: {
  period: number; start: string; end: string;
  onTimeChange: (start: string, end: string) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>P{period}</span>
      <input type="time" value={start} onChange={(e) => onTimeChange(e.target.value, end)}
        style={{ ...inputStyle, padding: "3px 4px", fontSize: 10, textAlign: "center", width: 60 }} />
      <input type="time" value={end} onChange={(e) => onTimeChange(start, e.target.value)}
        style={{ ...inputStyle, padding: "3px 4px", fontSize: 10, textAlign: "center", width: 60 }} />
      <button onClick={onDelete} style={{ background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer", padding: 0 }}>
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ── Mobile Slot Card ──────────────────────────────────────────────────────────

function MobileSlotCard({
  period, slot, subjects, teachers, onChange,
}: {
  period: { period: number; start: string; end: string };
  slot: SlotData | null;
  subjects: Subject[];
  teachers: Teacher[];
  onChange: (s: Partial<SlotData> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = slot ? SLOT_TYPE_META[slot.slot_type] : null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, overflow: "hidden" }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-soft)" }}>P{period.period}</span>
          <span style={{ fontSize: 9, color: "var(--ink-dim)" }}>{period.start}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {slot ? (
            slot.slot_type !== "regular" ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: meta!.color }}>{SLOT_TYPE_META[slot.slot_type].label}</span>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {slot.subject_name || subjects.find(s => s.id === slot.subject)?.name || "No subject"}
                </p>
                <p style={{ fontSize: 10, color: "var(--ink-dim)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {slot.teacher_name || teachers.find(t => t.id === slot.teacher)?.name || "No teacher"}
                </p>
              </>
            )
          ) : (
            <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>Empty — tap to edit</span>
          )}
        </div>
        {slot && <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta!.color, flexShrink: 0 }} />}
        <span style={{ color: "var(--ink-dim)", fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--stroke)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, paddingTop: 10 }}>
            {(Object.entries(SLOT_TYPE_META) as [string, any][]).map(([k, v]) => (
              <button key={k} onClick={() => onChange({ slot_type: k as any })}
                style={{ padding: "6px 0", borderRadius: 6, border: `1px solid ${(slot?.slot_type ?? "regular") === k ? v.color : "var(--stroke)"}`, background: (slot?.slot_type ?? "regular") === k ? v.bg : "var(--surface)", color: (slot?.slot_type ?? "regular") === k ? v.color : "var(--ink-soft)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
          </div>
          {(!slot || slot.slot_type === "regular") && (
            <>
              <select value={slot?.subject ?? ""} onChange={(e) => onChange({ subject: e.target.value ? Number(e.target.value) : null })} style={{ ...inputStyle, fontSize: 13 }}>
                <option value="">— Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={slot?.teacher ?? ""} onChange={(e) => onChange({ teacher: e.target.value ? Number(e.target.value) : null })} style={{ ...inputStyle, fontSize: 13 }}>
                <option value="">— Teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </>
          )}
          <button onClick={() => { onChange(null); setOpen(false); }}
            style={{ padding: "7px", borderRadius: 7, border: "1px solid var(--stroke)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}>
            <Trash2 size={12} /> Clear slot
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const isMobile = useIsMobile();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<number | "">("");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [numDays, setNumDays] = useState(5);
  const [mobileDay, setMobileDay] = useState(1);

  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [grid, setGrid] = useState<Record<number, Record<number, SlotData | null>>>({});

  // Load static data — fix: handle both array and paginated {results:[]} response
  useEffect(() => {
    Promise.all([
      apiFetch<Classroom[] | { results: Classroom[] }>("/api/academics/admin/classrooms/"),
      apiFetch<Subject[] | { results: Subject[] }>("/api/academics/admin/subjects/?active_only=true"),
      apiFetch<Teacher[]>("/api/auth/admin/teachers/"),
    ]).then(([c, s, t]) => {
      const clsArr = Array.isArray(c) ? c : ((c as any)?.results ?? []);
      const subArr = Array.isArray(s) ? s : ((s as any)?.results ?? []);
      setClassrooms(clsArr);
      setSubjects(subArr);
      setTeachers(Array.isArray(t) ? t : []);
    }).catch(() => {});
  }, []);

  // Load timetable when classroom changes
  useEffect(() => {
    if (!selectedClass) { setTimetable(null); setGrid({}); return; }
    setLoading(true);
    apiFetch<Timetable[]>(`/api/academics/admin/timetables/?classroom_id=${selectedClass}`)
      .then((list) => {
        const tt = Array.isArray(list) ? list[0] ?? null : null;
        setTimetable(tt);
        if (tt) initGridFromSlots(tt.slots);
        else setGrid({});
      })
      .catch(() => { setTimetable(null); setGrid({}); })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  function initGridFromSlots(slots: SlotData[]) {
    const periodSet = new Map<number, {start: string; end: string}>();
    for (const s of slots) {
      if (!periodSet.has(s.period_number)) {
        periodSet.set(s.period_number, { start: s.starts_at.slice(0, 5), end: s.ends_at.slice(0, 5) });
      }
    }
    if (periodSet.size > 0) {
      const sorted = Array.from(periodSet.entries()).sort((a, b) => a[0] - b[0]);
      setPeriods(sorted.map(([p, { start, end }]) => ({ period: p, start, end })));
    } else {
      setPeriods(DEFAULT_PERIODS);
    }
    const g: Record<number, Record<number, SlotData | null>> = {};
    for (const s of slots) {
      if (!g[s.weekday]) g[s.weekday] = {};
      g[s.weekday][s.period_number] = s;
    }
    setGrid(g);
  }

  async function createTimetable() {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const tt = await apiFetch<Timetable>("/api/academics/admin/timetables/", {
        method: "POST",
        body: JSON.stringify({ classroom: selectedClass, label: "", is_active: true }),
      });
      setTimetable(tt);
      setGrid({});
      setPeriods(DEFAULT_PERIODS);
    } finally { setLoading(false); }
  }

  async function save() {
    if (!timetable) return;
    setSaving(true);
    const slots: any[] = [];
    for (const p of periods) {
      for (let d = 1; d <= numDays; d++) {
        const cell = grid[d]?.[p.period] ?? null;
        if (cell) {
          slots.push({
            weekday: d, period_number: p.period,
            starts_at: p.start, ends_at: p.end,
            slot_type: cell.slot_type,
            subject: cell.slot_type === "regular" ? (cell.subject ?? null) : null,
            teacher: cell.slot_type === "regular" ? (cell.teacher ?? null) : null,
          });
        }
      }
    }
    try {
      await apiFetch(`/api/academics/admin/timetables/${timetable.id}/slots/`, {
        method: "POST",
        body: JSON.stringify({ slots }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  function setCellSlot(weekday: number, period: number, update: Partial<SlotData> | null) {
    setGrid(prev => {
      const next = { ...prev };
      if (!next[weekday]) next[weekday] = {};
      if (update === null) {
        next[weekday] = { ...next[weekday], [period]: null };
      } else {
        const existing = next[weekday][period] ?? {
          weekday, period_number: period,
          starts_at: periods.find(p => p.period === period)?.start ?? "08:00",
          ends_at: periods.find(p => p.period === period)?.end ?? "08:45",
          slot_type: "regular" as const, subject: null, teacher: null,
        };
        next[weekday] = { ...next[weekday], [period]: { ...existing, ...update } };
      }
      return next;
    });
  }

  const cls = classrooms.find(c => c.id === selectedClass);

  // Cascading dropdown helpers
  const classNames = Array.from(new Set(classrooms.map(c => c.name)));
  const sectionsForName = classrooms
    .filter(c => c.name === selectedClassName)
    .sort((a, b) => (a.section || "").localeCompare(b.section || ""));

  const pad = isMobile ? "16px 14px 40px" : "24px 28px 48px";

  return (
    <DashboardShell>
      <div style={{ padding: pad }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Timetable</h1>
          </div>
          {timetable && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
              <button onClick={save} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "9px 12px" : "11px 20px", fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                <Save size={15} /> {saving ? "Saving…" : isMobile ? "Save" : "Save timetable"}
              </button>
            </div>
          )}
        </motion.div>

        {/* Controls bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>

          {/* Class selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: isMobile ? "1 1 100%" : "unset" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Class</label>
            <select value={selectedClassName}
              onChange={(e) => { setSelectedClassName(e.target.value); setSelectedClass(""); }}
              style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--ink)", outline: "none", flex: 1, minWidth: 130 }}>
              <option value="">Select class…</option>
              {classNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {selectedClassName && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: isMobile ? "1 1 100%" : "unset" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Section</label>
              <select value={selectedClass}
                onChange={(e) => setSelectedClass(Number(e.target.value) || "")}
                style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--ink)", outline: "none", flex: 1, minWidth: 110 }}>
                <option value="">Select section…</option>
                {sectionsForName.map(c => (
                  <option key={c.id} value={c.id}>{c.section || "(no section)"}</option>
                ))}
              </select>
            </div>
          )}

          {timetable && !isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Days</label>
              {[5, 6].map(d => (
                <button key={d} onClick={() => setNumDays(d)}
                  style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${numDays === d ? "var(--primary)" : "var(--stroke)"}`, background: numDays === d ? "var(--primary-soft)" : "var(--surface)", color: numDays === d ? "var(--primary)" : "var(--ink-soft)", fontSize: 12, fontWeight: numDays === d ? 700 : 400, cursor: "pointer" }}>
                  {d === 5 ? "Mon–Fri" : "Mon–Sat"}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Content */}
        {!selectedClass ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Select a classroom to view its timetable</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Each classroom has its own weekly timetable with subjects and teachers per period.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : !timetable ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No timetable for {cls?.name ?? "this class"}</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>Create a timetable to assign subjects and teachers to each period.</p>
            <button onClick={createTimetable}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Create timetable
            </button>
          </div>
        ) : isMobile ? (
          // ── Mobile: Day tabs + vertical period list ──
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Day selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              {DAYS.slice(0, numDays).map((d, i) => (
                <button key={d} onClick={() => setMobileDay(i + 1)}
                  style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${mobileDay === i + 1 ? "var(--primary)" : "var(--stroke)"}`, background: mobileDay === i + 1 ? "var(--primary)" : "var(--surface)", color: mobileDay === i + 1 ? "#fff" : "var(--ink-soft)", fontSize: 13, fontWeight: mobileDay === i + 1 ? 700 : 400, cursor: "pointer", flexShrink: 0 }}>
                  {d}
                </button>
              ))}
              <button onClick={() => setNumDays(v => v === 5 ? 6 : 5)}
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", color: "var(--ink-dim)", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                {numDays === 5 ? "+ Sat" : "− Sat"}
              </button>
            </div>

            {/* Period cards for selected day */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {periods.map((p) => (
                <MobileSlotCard
                  key={p.period}
                  period={p}
                  slot={grid[mobileDay]?.[p.period] ?? null}
                  subjects={subjects}
                  teachers={teachers}
                  onChange={(update) => setCellSlot(mobileDay, p.period, update)}
                />
              ))}
              <button
                onClick={() => {
                  const lastPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
                  const nextNum = lastPeriod ? lastPeriod.period + 1 : 1;
                  setPeriods(prev => [...prev, { period: nextNum, start: "15:00", end: "15:45" }]);
                }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "var(--primary)", background: "none", border: "1px dashed var(--stroke)", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                <Plus size={14} /> Add period
              </button>
            </div>
          </motion.div>
        ) : (
          // ── Desktop: Full grid ──
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(SLOT_TYPE_META).map(([k, v]) => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: v.color, fontWeight: 600, background: v.bg, borderRadius: 6, padding: "3px 9px", border: `1px solid ${v.color}33` }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: v.color }} />{v.label}
                </span>
              ))}
              <span style={{ fontSize: 11, color: "var(--ink-dim)", marginLeft: "auto", alignSelf: "center" }}>
                Click any cell to edit
              </span>
            </div>

            {/* Grid */}
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 720 }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: `90px repeat(${numDays}, 1fr)`, gap: 6, marginBottom: 6 }}>
                  <div />
                  {DAYS.slice(0, numDays).map((d) => (
                    <div key={d} style={{ textAlign: "center", padding: "8px 0", background: "var(--surface-raised)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{d}</div>
                  ))}
                </div>
                {/* Period rows */}
                {periods.map((p, pi) => (
                  <div key={p.period} style={{ display: "grid", gridTemplateColumns: `90px repeat(${numDays}, 1fr)`, gap: 6, marginBottom: 6 }}>
                    <PeriodHeader period={p.period} start={p.start} end={p.end}
                      onTimeChange={(start, end) => setPeriods(prev => prev.map((x, i) => i === pi ? { ...x, start, end } : x))}
                      onDelete={() => {
                        if (!confirm(`Remove Period ${p.period}?`)) return;
                        setPeriods(prev => prev.filter((_, i) => i !== pi));
                        setGrid(prev => {
                          const next = { ...prev };
                          for (const d in next) {
                            const { [p.period]: _removed, ...rest } = next[Number(d)];
                            next[Number(d)] = rest;
                          }
                          return next;
                        });
                      }}
                    />
                    {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
                      <SlotCell key={day} slot={grid[day]?.[p.period] ?? null} subjects={subjects} teachers={teachers} onChange={(update) => setCellSlot(day, p.period, update)} />
                    ))}
                  </div>
                ))}
                {/* Add period */}
                <button
                  onClick={() => {
                    const lastPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
                    const nextNum = lastPeriod ? lastPeriod.period + 1 : 1;
                    setPeriods(prev => [...prev, { period: nextNum, start: "15:00", end: "15:45" }]);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--primary)", background: "none", border: "1px dashed var(--stroke)", borderRadius: 8, padding: "9px 14px", cursor: "pointer", marginTop: 4, width: "100%" }}>
                  <Plus size={13} /> Add period row
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Lessons",     value: Object.values(grid).flatMap(d => Object.values(d)).filter(s => s?.slot_type === "regular").length, color: "#2563eb" },
                { label: "Breaks",      value: Object.values(grid).flatMap(d => Object.values(d)).filter(s => s?.slot_type === "break").length,   color: "#16a34a" },
                { label: "Empty cells", value: periods.length * numDays - Object.values(grid).flatMap(d => Object.values(d)).filter(Boolean).length, color: "#94a3b8" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{s.label}</span>
                </div>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-dim)" }}>
                <AlertCircle size={13} />
                Remember to click <strong style={{ color: "var(--ink)" }}>Save timetable</strong> when done
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
