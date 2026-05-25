"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  FileText, RefreshCw, Send, Award, TrendingUp, BarChart3,
  ChevronDown, Users, CheckCircle2, AlertCircle, BookOpen,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exam {
  id: number;
  name: string;
  exam_type: string;
  academic_year: number | null;
  start_date: string;
  end_date: string;
  is_published: boolean;
  schedules: { classroom: number; classroom_name: string; subject: number }[];
}

interface Classroom { id: number; name: string; section: string; }

interface ReportCard {
  id: number;
  student_name: string;
  admission_no: string;
  classroom_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  rank: number;
  is_published: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  "A+": { text: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  "A":  { text: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "B":  { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "C":  { text: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "D":  { text: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  "F":  { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: "Unit Test", midterm: "Midterm", final: "Final",
  practical: "Practical", other: "Other",
};

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeStyle(grade: string) {
  return GRADE_COLOR[grade] ?? { text: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
}

function pct(n: number) { return `${n.toFixed(1)}%`; }

function rankSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// ── Selector bar ──────────────────────────────────────────────────────────────

function SelectBar({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", background: "var(--surface)", border: "1px solid var(--stroke)",
            borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13,
            color: value ? "var(--ink)" : "var(--ink-dim)", outline: "none",
            appearance: "none", cursor: "pointer",
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderTop: `3px solid ${color}`, borderRadius: 14, padding: "16px 18px",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={17} color={color} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 1 }}>{sub}</p>}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportCardsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [cards, setCards] = useState<ReportCard[] | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Exam[]>("/api/academics/admin/exams/"),
      apiFetch<Classroom[]>("/api/academics/admin/classrooms/"),
    ])
      .then(([e, c]) => {
        setExams(Array.isArray(e) ? e : []);
        setClassrooms(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, []);

  const exam = exams.find((e) => String(e.id) === selectedExam);

  const classroomOptions = exam
    ? [...new Map(
        exam.schedules.map((s) => [s.classroom, { value: String(s.classroom), label: s.classroom_name }])
      ).values()]
    : classrooms.map((c) => ({ value: String(c.id), label: `${c.name}${c.section ? ` ${c.section}` : ""}` }));

  const fetchCards = useCallback(async (examId: string, classroomId: string) => {
    if (!examId || !classroomId) return;
    setLoadingCards(true);
    setError("");
    try {
      const data = await apiFetch<ReportCard[]>(
        `/api/academics/admin/exams/${examId}/report-cards/?classroom_id=${classroomId}`
      );
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  function handleExamChange(v: string) {
    setSelectedExam(v);
    setSelectedClassroom("");
    setCards(null);
    setError("");
  }

  function handleClassroomChange(v: string) {
    setSelectedClassroom(v);
    setCards(null);
    setError("");
    if (v && selectedExam) fetchCards(selectedExam, v);
  }

  async function generate() {
    if (!selectedExam || !selectedClassroom) return;
    setGenerating(true);
    setError("");
    try {
      const data = await apiFetch<ReportCard[]>(
        `/api/academics/admin/exams/${selectedExam}/report-cards/generate/`,
        { method: "POST", body: JSON.stringify({ classroom_id: Number(selectedClassroom) }) }
      );
      setCards(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate report cards.");
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    if (!selectedExam || !selectedClassroom) return;
    setPublishing(true);
    setError("");
    try {
      await apiFetch(
        `/api/academics/admin/exams/${selectedExam}/report-cards/publish/`,
        { method: "POST", body: JSON.stringify({ classroom_id: Number(selectedClassroom) }) }
      );
      setCards((prev) => prev ? prev.map((c) => ({ ...c, is_published: true })) : prev);
    } catch (e: any) {
      setError(e.message ?? "Failed to publish report cards.");
    } finally {
      setPublishing(false);
    }
  }

  // ── Derived stats ────────────────────────────────────────────────────────────

  const present = cards?.filter((c) => c.obtained_marks > 0) ?? [];
  const avgPct = present.length
    ? present.reduce((s, c) => s + c.percentage, 0) / present.length
    : 0;
  const topPct = present.length ? Math.max(...present.map((c) => c.percentage)) : 0;
  const passed = present.filter((c) => c.grade !== "F").length;
  const passRate = present.length ? (passed / present.length) * 100 : 0;
  const allPublished = cards && cards.length > 0 && cards.every((c) => c.is_published);

  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px", maxWidth: 960 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Report Cards</h1>
          </div>
        </motion.div>

        {/* Control bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <SelectBar
              label="Exam"
              value={selectedExam}
              onChange={handleExamChange}
              placeholder="Select exam"
              options={exams.map((e) => ({
                value: String(e.id),
                label: `${e.name} — ${EXAM_TYPE_LABELS[e.exam_type] ?? e.exam_type}`,
              }))}
            />
            <SelectBar
              label="Classroom"
              value={selectedClassroom}
              onChange={handleClassroomChange}
              placeholder={selectedExam ? "Select classroom" : "Select exam first"}
              options={classroomOptions}
            />
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={generate}
                disabled={!selectedExam || !selectedClassroom || generating || loadingInit}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--primary)", color: "#fff", border: "none",
                  borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", opacity: (!selectedExam || !selectedClassroom || generating) ? 0.5 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {generating ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={15} />}
                {generating ? "Generating…" : cards && cards.length > 0 ? "Regenerate" : "Generate"}
              </button>
              {cards && cards.length > 0 && !allPublished && (
                <button
                  onClick={publish}
                  disabled={publishing}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#16a34a", color: "#fff", border: "none",
                    borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14,
                    cursor: "pointer", opacity: publishing ? 0.5 : 1, whiteSpace: "nowrap",
                  }}
                >
                  <Send size={15} />
                  {publishing ? "Publishing…" : "Publish to parents"}
                </button>
              )}
              {allPublished && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Published</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </motion.div>

        {/* Empty state: no selection */}
        {!selectedExam && !loadingInit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Select an exam to begin</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Choose an exam and classroom, then generate or view existing report cards.</p>
          </motion.div>
        )}

        {/* Loading state */}
        {(loadingCards || (loadingInit && selectedExam)) && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        )}

        {/* Cards exist */}
        <AnimatePresence mode="wait">
          {cards && cards.length > 0 && !loadingCards && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Summary stats */}
              <motion.div variants={stagger} initial="hidden" animate="show"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="Students" value={String(cards.length)} icon={Users} color="#2563eb" />
                <StatCard label="Class average" value={pct(avgPct)} icon={BarChart3} color="#7c3aed" />
                <StatCard label="Top score" value={pct(topPct)} icon={TrendingUp} color="#0891b2" />
                <StatCard
                  label="Pass rate"
                  value={pct(passRate)}
                  sub={`${passed} / ${present.length} passed`}
                  icon={Award}
                  color={passRate >= 75 ? "#16a34a" : passRate >= 50 ? "#d97706" : "#dc2626"}
                />
              </motion.div>

              {/* Grade distribution row */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", alignSelf: "center" }}>Grade breakdown</span>
                {(["A+", "A", "B", "C", "D", "F"] as const).map((g) => {
                  const count = cards.filter((c) => c.grade === g).length;
                  const style = gradeStyle(g);
                  return (
                    <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px",
                        background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                      }}>{g}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{count}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                        ({cards.length ? Math.round((count / cards.length) * 100) : 0}%)
                      </span>
                    </div>
                  );
                })}
              </motion.div>

              {/* Table */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, overflow: "hidden" }}>

                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 140px 100px 120px 80px 80px",
                  padding: "10px 18px", borderBottom: "1px solid var(--stroke)",
                  background: "var(--surface-raised)",
                }}>
                  {["Rank", "Student", "Admission No.", "Marks", "Percentage", "Grade", "Status"].map((h) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                <motion.div variants={stagger} initial="hidden" animate="show">
                  {[...cards].sort((a, b) => a.rank - b.rank).map((card, i) => {
                    const style = gradeStyle(card.grade);
                    return (
                      <motion.div key={card.id} variants={fade}
                        style={{
                          display: "grid", gridTemplateColumns: "52px 1fr 140px 100px 120px 80px 80px",
                          padding: "13px 18px", alignItems: "center",
                          borderBottom: i < cards.length - 1 ? "1px solid var(--stroke)" : "none",
                          background: card.rank === 1 ? "#fffbeb" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (card.rank !== 1) (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = card.rank === 1 ? "#fffbeb" : "transparent"; }}
                      >
                        {/* Rank */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {card.rank === 1 && <span style={{ fontSize: 14 }}>🥇</span>}
                          {card.rank === 2 && <span style={{ fontSize: 14 }}>🥈</span>}
                          {card.rank === 3 && <span style={{ fontSize: 14 }}>🥉</span>}
                          {card.rank > 3 && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)" }}>{rankSuffix(card.rank)}</span>
                          )}
                        </div>

                        {/* Student */}
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{card.student_name}</p>
                        </div>

                        {/* Admission No */}
                        <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "monospace" }}>{card.admission_no}</span>

                        {/* Marks */}
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>
                          {card.obtained_marks} / {card.total_marks}
                        </span>

                        {/* Percentage bar */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "var(--stroke)", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${card.percentage}%`, background: style.text, borderRadius: 999, transition: "width 0.5s" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", width: 42, textAlign: "right" }}>{pct(card.percentage)}</span>
                          </div>
                        </div>

                        {/* Grade */}
                        <span style={{
                          fontSize: 12, fontWeight: 800, borderRadius: 6, padding: "3px 10px",
                          background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                          display: "inline-block", textAlign: "center",
                        }}>{card.grade}</span>

                        {/* Status */}
                        {card.is_published ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={13} color="#16a34a" />
                            <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Sent</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>—</span>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>

              {/* Footnote */}
              <p style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 12, textAlign: "center" }}>
                Ranks computed using dense ranking — students with the same percentage share a rank.
              </p>
            </motion.div>
          )}

          {/* Empty results */}
          {cards && cards.length === 0 && !loadingCards && !generating && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No report cards yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
                Make sure marks have been entered for this exam and classroom, then click Generate.
              </p>
              <button onClick={generate} disabled={generating}
                style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Generate now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardShell>
  );
}
