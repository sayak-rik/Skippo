"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Landmark, Plus, CheckCircle2, Clock, X, FileCheck2,
  Send, ChevronRight, Users, GraduationCap, Building2, BarChart3,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AcademicYear { id: number; name: string; is_current: boolean; }

interface UDISEReport {
  id: number;
  academic_year: string;
  academic_year_id: number;
  udise_code: string;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── New Report Drawer ─────────────────────────────────────────────────────────

function NewReportDrawer({
  years, onClose, onCreated,
}: {
  years: AcademicYear[];
  onClose: () => void;
  onCreated: (r: UDISEReport) => void;
}) {
  const cur = years.find((y) => y.is_current);
  const [form, setForm] = useState({ academic_year_id: cur?.id ?? years[0]?.id ?? "", udise_code: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<UDISEReport>("/api/academics/admin/udise/", {
        method: "POST", body: JSON.stringify(form),
      });
      onCreated(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create.");
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
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>UDISE+</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>New UDISE Report</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Academic year *</label>
          <select
            value={form.academic_year_id}
            onChange={(e) => setForm(p => ({ ...p, academic_year_id: Number(e.target.value) }))}
            style={inputStyle}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}{y.is_current ? " (Current)" : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
            UDISE+ school code <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(12 digits)</span>
          </label>
          <input style={inputStyle} value={form.udise_code} maxLength={12} placeholder="e.g. 270101001001" onChange={(e) => setForm(p => ({ ...p, udise_code: e.target.value.replace(/\D/g, "") }))} />
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 12, color: "#15803d", lineHeight: 1.7 }}>
            Sections 1, 2, and 4 are auto-generated from your student, teacher, and exam data. You only need to fill in Section 3 (Infrastructure) manually.
          </p>
        </div>

        <button onClick={create} disabled={!form.academic_year_id || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Creating…" : "Create report"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────

const SECTION_META = [
  { icon: Users,          label: "Section 1",  sub: "Students",        auto: true },
  { icon: GraduationCap,  label: "Section 2",  sub: "Teachers",        auto: true },
  { icon: Building2,      label: "Section 3",  sub: "Infrastructure",  auto: false },
  { icon: BarChart3,      label: "Section 4",  sub: "Academics",       auto: true },
];

function ReportRow({ report, onOpen }: { report: UDISEReport; onOpen: () => void }) {
  const submitted = report.status === "submitted";
  return (
    <motion.div variants={fade}
      onClick={onOpen}
      style={{
        background: "var(--surface)", border: `1px solid ${submitted ? "#bbf7d0" : "var(--stroke)"}`,
        borderRadius: 14, padding: "18px 20px", cursor: "pointer",
        boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: submitted ? "#f0fdf4" : "var(--surface-raised)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {submitted ? <FileCheck2 size={20} color="#16a34a" /> : <Landmark size={20} color="var(--ink-dim)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              UDISE+ — {report.academic_year}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              background: submitted ? "#f0fdf4" : "#fffbeb",
              color: submitted ? "#16a34a" : "#d97706",
              border: `1px solid ${submitted ? "#bbf7d0" : "#fde68a"}`,
            }}>
              {submitted ? "Submitted" : "Draft"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>
            {report.udise_code ? `UDISE code: ${report.udise_code}` : "UDISE code not set"}
            {submitted && report.submitted_at && ` · Submitted ${new Date(report.submitted_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
          </p>
        </div>

        {/* Section progress */}
        <div style={{ display: "flex", gap: 6, marginRight: 8 }}>
          {SECTION_META.map((s) => (
            <div key={s.label} title={`${s.label}: ${s.sub}`} style={{
              width: 28, height: 28, borderRadius: 7,
              background: s.auto ? "#eff6ff" : (submitted ? "#f0fdf4" : "#fffbeb"),
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${s.auto ? "#bfdbfe" : (submitted ? "#bbf7d0" : "#fde68a")}`,
            }}>
              <s.icon size={13} color={s.auto ? "#2563eb" : (submitted ? "#16a34a" : "#d97706")} />
            </div>
          ))}
        </div>

        <ChevronRight size={18} color="var(--ink-dim)" />
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UdisePage() {
  const [reports, setReports] = useState<UDISEReport[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<UDISEReport[]>("/api/academics/admin/udise/"),
      apiFetch<AcademicYear[]>("/api/academics/admin/academic-years/"),
    ])
      .then(([r, y]) => {
        setReports(Array.isArray(r) ? r : []);
        setYears(Array.isArray(y) ? y : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const submitted = reports.filter((r) => r.status === "submitted").length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {showDrawer && (
          <NewReportDrawer
            years={years}
            onClose={() => setShowDrawer(false)}
            onCreated={(r) => setReports((p) => {
              const exists = p.find((x) => x.id === r.id);
              return exists ? p.map((x) => x.id === r.id ? r : x) : [r, ...p];
            })}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 860 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>School Setup</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>UDISE+</h1>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Plus size={16} /> New Report
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total reports", value: loading ? "—" : reports.length, color: "#2563eb", icon: Landmark },
            { label: "Submitted", value: loading ? "—" : submitted, color: "#16a34a", icon: CheckCircle2 },
            { label: "Draft", value: loading ? "—" : reports.length - submitted, color: "#d97706", icon: Clock },
          ].map((s) => (
            <motion.div key={s.label} variants={fade} style={{
              background: "var(--surface)", border: "1px solid var(--stroke)", borderTop: `3px solid ${s.color}`,
              borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <s.icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Section guide */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>What's in a UDISE+ report</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {SECTION_META.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.auto ? "#eff6ff" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={14} color={s.auto ? "#2563eb" : "#d97706"} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{s.label}: {s.sub}</p>
                  <p style={{ fontSize: 10, color: s.auto ? "#2563eb" : "#d97706" }}>{s.auto ? "Auto-filled" : "Manual entry"}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reports list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No UDISE reports yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              Create your first annual report. Student, teacher, and exam data are pulled automatically.
            </p>
            <button onClick={() => setShowDrawer(true)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Create first report
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map((r) => (
              <ReportRow key={r.id} report={r} onOpen={() => alert(`Open UDISE report ${r.id} — detail view coming soon`)} />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
