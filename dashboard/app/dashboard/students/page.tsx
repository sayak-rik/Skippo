"use client";

import {
  UploadCloud, Search, Users, GraduationCap, ChevronDown, ChevronUp,
  Phone, UserPlus, CheckCircle2, AlertCircle, X, School, ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classroom {
  id: number;
  name: string;
  section: string;
  teacher: string;
  student_count: number;
}

interface Student {
  id: number;
  name: string;
  roll_number: string;
  classroom_id: number | null;
  classroom_name: string;
  classroom_section: string;
  parent_name: string;
  parent_phone: string;
  has_parent: boolean;
  pending_parent_phone: string;
  pending_parent_name: string;
}

// ── Animation helpers ─────────────────────────────────────────────────────────

const fade    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  accent: string; icon: React.ElementType;
}) {
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderTop: `3px solid ${accent}`, borderRadius: 16,
      padding: "18px 20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={accent} />
        </div>
        {sub && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", background: "var(--surface-raised)", padding: "2px 8px", borderRadius: 20 }}>
            {sub}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
}

// ── Parent status pill ────────────────────────────────────────────────────────

function ParentPill({ has }: { has: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: has ? "var(--success-soft)" : "var(--surface-raised)",
      color: has ? "var(--success)" : "var(--ink-dim)",
      borderRadius: 999, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      border: `1px solid ${has ? "var(--success-border)" : "var(--stroke)"}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: has ? "var(--success)" : "var(--ink-dim)", flexShrink: 0 }} />
      {has ? "Linked" : "No parent"}
    </span>
  );
}

// ── Upload button ─────────────────────────────────────────────────────────────

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", border: "none", borderRadius: 12,
        cursor: "pointer", fontWeight: 700, fontSize: 13,
        background: "var(--primary)", color: "#fff",
        boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
      }}
    >
      <UploadCloud size={16} />
      Import Students
      <span style={{
        background: "rgba(255,255,255,0.2)", borderRadius: 5,
        padding: "1px 7px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      }}>
        EXCEL
      </span>
    </motion.button>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

function UploadModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [step, setStep]         = useState<"drop" | "review" | "importing" | "done">("drop");
  const [fileName, setFN]       = useState("");
  const [fileObj, setFileObj]   = useState<File | null>(null);
  const [result, setResult]     = useState<{ students_found: number; students_imported: number; skipped: number; truncated: boolean } | null>(null);
  const [error, setError]       = useState("");
  const fileRef                 = useRef<HTMLInputElement>(null);

  function handleFilePick(e?: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large. Maximum allowed size is 50 MB.");
      return;
    }

    setError("");
    setFN(file.name);
    setFileObj(file);
    setTimeout(() => setStep("review"), 300);
  }

  async function handleImport() {
    if (!fileObj) return;
    setStep("importing");
    setError("");

    try {
      const form = new FormData();
      form.append("file", fileObj);

      const res = await fetch("/api/academics/admin/students/import/", {
        method:  "POST",
        headers: (() => {
          const h: Record<string, string> = {};
          if (typeof document !== "undefined") {
            const token  = document.cookie.match(/skippo_token=([^;]+)/)?.[1];
            const school = document.cookie.match(/skippo_school=([^;]+)/)?.[1];
            if (token)  h["Authorization"]  = `Bearer ${token}`;
            if (school) h["X-School-Slug"]  = school;
          }
          return h;
        })(),
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
      onImported();
    } catch (err: any) {
      setError(err.message ?? "Import failed. Please try again.");
      setStep("review");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(8px)",
        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--stroke)",
          borderRadius: 20, padding: 32, width: 600, maxWidth: "95vw",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--primary-soft)", color: "var(--primary)",
              borderRadius: 999, padding: "5px 12px",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 10,
            }}>
              <UploadCloud size={13} strokeWidth={2.5} />
              Bulk Import
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "var(--ink)", lineHeight: 1.2, margin: 0 }}>
              Import Students via Excel
            </h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 5 }}>
              Upload an .xlsx or .csv file — students are added and parents are invited automatically.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "var(--surface-raised)", border: "1px solid var(--stroke)",
            color: "var(--ink-dim)", borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <X size={14} />
          </button>
        </div>

        {step === "drop" && (
          <>
            <motion.div
              whileHover={{ borderColor: "var(--primary)", background: "var(--primary-soft)" }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed var(--stroke-strong)",
                borderRadius: 14, padding: "40px 24px",
                textAlign: "center", cursor: "pointer",
                background: "var(--surface-raised)",
                transition: "all 0.2s",
              }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "var(--primary-soft)", border: "1px solid var(--stroke)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileSpreadsheet size={26} color="var(--primary)" />
                </div>
              </motion.div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
                Drag & drop your Excel file here
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
                .xlsx or .csv · Max 50 MB
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Browse file
              </motion.button>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={handleFilePick} />
            </motion.div>

            <div style={{
              marginTop: 18, background: "var(--surface-raised)", border: "1px solid var(--stroke)",
              borderRadius: 12, padding: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Required columns
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["full_name",    "Full name of the student"],
                  ["classroom",    "e.g. Class 6-A"],
                  ["roll_number",  "Unique roll within class"],
                  ["parent_name",  "Primary guardian name"],
                  ["parent_phone", "+91XXXXXXXXXX for SMS invite"],
                ].map(([col, desc]) => (
                  <div key={col} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <CheckCircle2 size={13} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, fontFamily: "monospace", margin: 0 }}>{col}</p>
                      <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--success-soft)", border: "1px solid var(--success-border)",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
            }}>
              <FileSpreadsheet size={22} color="var(--success)" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{fileName}</p>
                <p style={{ fontSize: 11, color: "var(--success)", margin: "2px 0 0" }}>
                  Ready to import · AI will extract and validate all student records
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                background: "var(--danger-soft)", border: "1px solid var(--danger-border)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "var(--danger)",
              }}>
                {error}
              </div>
            )}

            <div style={{ background: "var(--primary-soft)", border: "1px solid var(--stroke)", borderRadius: 10, padding: 14, marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                Required columns
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["full_name",    "Full name of the student"],
                  ["classroom",    "e.g. Class 6-A"],
                  ["roll_number",  "Unique roll within class"],
                  ["parent_name",  "Primary guardian name"],
                  ["parent_phone", "+91XXXXXXXXXX for SMS invite"],
                ].map(([col, desc]) => (
                  <div key={col} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <CheckCircle2 size={13} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, fontFamily: "monospace", margin: 0 }}>{col}</p>
                      <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: "12px 0 0", lineHeight: 1.6 }}>
                Column names don&apos;t have to match exactly — the AI will intelligently detect and map them.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setStep("drop"); setError(""); }} style={{
                flex: 1, background: "var(--surface-raised)", border: "1px solid var(--stroke)",
                color: "var(--ink-soft)", borderRadius: 10, padding: "12px 0",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>Back</button>
              <motion.button
                onClick={handleImport} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  flex: 2, background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 10, padding: "12px 0",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                Import students
              </motion.button>
            </div>
          </>
        )}

        {step === "importing" && (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                width: 48, height: 48,
                border: "3px solid var(--stroke)",
                borderTop: "3px solid var(--primary)",
                borderRadius: "50%",
                margin: "0 auto 24px",
              }}
            />
            <p style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)", marginBottom: 6 }}>Importing students…</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Saving to database and queuing SMS invites</p>
          </div>
        )}

        {step === "done" && result && (
          <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--success-soft)", border: "2px solid var(--success-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CheckCircle2 size={34} color="var(--success)" />
            </motion.div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 22, color: "var(--success)", marginBottom: 4 }}>Import complete!</p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                {result.students_imported} students added · {result.skipped} duplicates skipped
              </p>
              {result.truncated && (
                <p style={{ fontSize: 11, color: "var(--warning)", marginTop: 4 }}>
                  Large file — first 200 rows were processed. Upload again for the remainder.
                </p>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
              {[
                { v: String(result.students_found),    l: "Students detected",   c: "var(--primary)" },
                { v: String(result.students_imported), l: "Students imported",   c: "var(--success)" },
                { v: String(result.skipped),           l: "Duplicates skipped",  c: "var(--ink-dim)" },
                { v: result.truncated ? "Yes" : "No",  l: "File truncated",      c: result.truncated ? "var(--warning)" : "var(--ink-dim)" },
              ].map(s => (
                <div key={s.l} style={{
                  background: "var(--surface-raised)", border: "1px solid var(--stroke)",
                  borderRadius: 12, padding: "14px 16px", textAlign: "center",
                }}>
                  <p style={{ fontWeight: 800, fontSize: 26, color: s.c, margin: 0 }}>{s.v}</p>
                  <p style={{ fontSize: 11, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "3px 0 0" }}>{s.l}</p>
                </div>
              ))}
            </div>
            <motion.button
              onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                background: "var(--primary)", color: "#fff", border: "none",
                borderRadius: 10, padding: "13px 0", fontWeight: 700, fontSize: 14,
                cursor: "pointer", width: "100%",
              }}
            >
              Done
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Class card ────────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: Classroom }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const [rows, setRows]       = useState<Student[]>([]);

  async function toggle() {
    setOpen(v => !v);
    if (!loaded) {
      setLoading(true);
      try {
        const data = await apiFetch<{ results: Student[] }>(
          `/api/academics/admin/students?classroom_id=${cls.id}`
        );
        setRows(data.results);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }
  }

  return (
    <motion.div variants={fade} layout>
      <motion.div
        onClick={toggle}
        whileHover={{ borderColor: "var(--primary)" }}
        style={{
          background: "var(--surface)", border: "1px solid var(--stroke)",
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "16px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 16,
          transition: "border-color 0.2s", boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "var(--primary-soft)", border: "1px solid var(--stroke)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <GraduationCap size={20} color="var(--primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cls.name}{cls.section ? ` — ${cls.section}` : ""}
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cls.teacher ? cls.teacher : "No teacher assigned"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Users size={14} color="var(--ink-dim)" />
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em" }}>
            {cls.student_count}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500 }}>students</span>
        </div>
        <div style={{ color: "var(--ink-dim)", flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "var(--surface-raised)", border: "1px solid var(--stroke)",
              borderTop: "none", borderRadius: "0 0 12px 12px", padding: "0 20px 16px",
            }}>
              {loading ? (
                <p style={{ fontSize: 13, color: "var(--ink-dim)", padding: "16px 0" }}>Loading…</p>
              ) : rows.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-dim)", padding: "16px 0" }}>No students in this class yet.</p>
              ) : rows.map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0", borderBottom: "1px solid var(--stroke)",
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-dim)", minWidth: 56, flexShrink: 0 }}>
                    {s.roll_number || "—"}
                  </span>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                    {s.parent_name || "No parent"}
                  </p>
                  <ParentPill has={s.has_parent} />
                  {s.parent_phone && (
                    <button
                      onClick={e => { e.stopPropagation(); window.location.href = `tel:${s.parent_phone}`; }}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "var(--primary-soft)", border: "1px solid var(--stroke)",
                        color: "var(--primary)", borderRadius: 7, padding: "4px 10px",
                        fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <Phone size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [tab, setTab]               = useState<"by-class" | "all" | "no-parent">("by-class");
  const [search, setSearch]         = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents]     = useState<Student[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);

  async function loadData() {
    setLoadingMain(true);
    try {
      const [clsData, stuData] = await Promise.all([
        apiFetch<{ results: Classroom[] }>("/api/academics/admin/classrooms"),
        apiFetch<{ results: Student[] }>("/api/academics/admin/students"),
      ]);
      setClassrooms(clsData.results);
      setStudents(stuData.results);
    } catch {
      /* show empty state */
    } finally {
      setLoadingMain(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const withParent    = students.filter(s => s.has_parent).length;
  const withoutParent = students.filter(s => !s.has_parent).length;

  const filtered = students.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.classroom_name.toLowerCase().includes(search.toLowerCase()) ||
    s.parent_name.toLowerCase().includes(search.toLowerCase())
  );
  const noParent = students.filter(s => !s.has_parent);

  const TABS = [
    { key: "by-class",   label: "By Class",         icon: School },
    { key: "all",        label: "All Students",      icon: Users },
    { key: "no-parent",  label: `No Parent${withoutParent > 0 ? ` (${withoutParent})` : ""}`, icon: AlertCircle },
  ] as const;

  return (
    <DashboardShell>
      <AnimatePresence>{showUpload && <UploadModal onClose={() => setShowUpload(false)} onImported={loadData} />}</AnimatePresence>

      <div style={{ padding: "24px 28px 48px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}
        >
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, margin: "0 0 4px" }}>
              School Management
            </p>
            <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0, lineHeight: 1 }}>
              Students
            </h1>
          </div>
          <UploadButton onClick={() => setShowUpload(true)} />
        </motion.div>

        {/* KPI strip */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}
        >
          <StatCard label="Total Students"   value={loadingMain ? "—" : students.length}    sub={`${classrooms.length} classes`} accent="#2563eb" icon={GraduationCap} />
          <StatCard label="Parent Linked"    value={loadingMain ? "—" : withParent}          sub="App access"                      accent="#16a34a" icon={CheckCircle2} />
          <StatCard label="No Parent Linked" value={loadingMain ? "—" : withoutParent}       sub={withoutParent > 0 ? "Action needed" : undefined} accent={withoutParent > 0 ? "#f59e0b" : "#94a3b8"} icon={AlertCircle} />
          <StatCard label="Classrooms"       value={loadingMain ? "—" : classrooms.length}                                         accent="#7c3aed" icon={School} />
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{
            display: "flex", gap: 4, marginBottom: 20,
            background: "var(--surface-raised)", borderRadius: 12, padding: 4,
            border: "1px solid var(--stroke)",
          }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 9,
                background: tab === key ? "var(--surface)" : "transparent",
                color: tab === key ? "var(--primary)" : "var(--ink-dim)",
                fontWeight: tab === key ? 700 : 500,
                fontSize: 13, cursor: "pointer",
                boxShadow: tab === key ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </motion.div>

        {/* By-class tab */}
        {tab === "by-class" && (
          loadingMain
            ? <LoadingState />
            : classrooms.length === 0
              ? <EmptyState icon={<School size={36} color="var(--ink-dim)" />} text="No classrooms set up yet. Add classrooms to get started." />
              : (
                <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {classrooms.map(c => <ClassCard key={c.id} cls={c} />)}
                </motion.div>
              )
        )}

        {/* All students tab */}
        {tab === "all" && (
          <>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={15} color="var(--ink-dim)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student, class, or parent name…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "var(--surface)", border: "1px solid var(--stroke)",
                  borderRadius: 10, padding: "10px 14px 10px 38px",
                  fontSize: 13, color: "var(--ink)", outline: "none",
                }}
              />
            </div>
            {loadingMain
              ? <LoadingState />
              : filtered.length === 0
                ? <EmptyState icon={<GraduationCap size={36} color="var(--ink-dim)" />} text={search ? "No students match your search." : "No students yet. Import via Excel to get started."} />
                : (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 640 }}>
                        <colgroup>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "16%" }} />
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "16%" }} />
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "6%" }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: "var(--surface-raised)" }}>
                            {["Student", "Roll", "Class", "Parent", "Phone", "Status", ""].map(h => (
                              <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(s => (
                            <tr
                              key={s.id}
                              style={{ borderTop: "1px solid var(--stroke)", transition: "background 0.12s" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                            >
                              <td style={{ padding: "11px 14px", fontWeight: 600, color: "var(--ink)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</td>
                              <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: "var(--ink-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.roll_number || "—"}</td>
                              <td style={{ padding: "11px 14px", overflow: "hidden" }}>
                                <span style={{ background: "var(--primary-soft)", color: "var(--primary)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500, display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.classroom_name || "Unassigned"}
                                </span>
                              </td>
                              <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.parent_name || s.pending_parent_name || "—"}
                                {!s.has_parent && s.pending_parent_name && (
                                  <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 600, color: "var(--warning)", background: "var(--warning-soft)", padding: "1px 6px", borderRadius: 4 }}>pending</span>
                                )}
                              </td>
                              <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.parent_phone || s.pending_parent_phone || "—"}</td>
                              <td style={{ padding: "11px 14px" }}><ParentPill has={s.has_parent} /></td>
                              <td style={{ padding: "11px 14px" }}>
                                {s.parent_phone && (
                                  <button onClick={() => window.location.href = `tel:${s.parent_phone}`} style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "var(--primary-soft)", border: "1px solid var(--stroke)",
                                    color: "var(--primary)", borderRadius: 7, padding: "5px 8px",
                                    cursor: "pointer",
                                  }}>
                                    <Phone size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
            }
          </>
        )}

        {/* No parent tab */}
        {tab === "no-parent" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {noParent.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "var(--warning-soft)", border: "1px solid var(--warning-border)",
                  color: "var(--warning)", borderRadius: 10, padding: "9px 16px",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                  <UserPlus size={14} />
                  Send bulk invite ({noParent.length})
                </button>
              </div>
            )}
            {loadingMain
              ? <LoadingState />
              : noParent.length === 0
                ? <EmptyState icon={<CheckCircle2 size={36} color="var(--success)" />} text="All students have a parent linked." />
                : noParent.map(s => (
                  <div key={s.id} style={{
                    background: "var(--surface)", border: "1px solid var(--stroke)",
                    borderRadius: 12, padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </p>
                      <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.classroom_name}{s.roll_number ? ` · Roll ${s.roll_number}` : ""}
                      </p>
                    </div>
                    <ParentPill has={false} />
                    {(() => {
                      const phone = s.parent_phone || s.pending_parent_phone;
                      const name  = s.parent_name  || s.pending_parent_name;
                      return phone ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                          {name && (
                            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{name}</span>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => window.location.href = `tel:${phone}`} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: "var(--primary-soft)", border: "1px solid var(--stroke)",
                              color: "var(--primary)", borderRadius: 8, padding: "6px 12px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>
                              <Phone size={13} /> {phone}
                            </button>
                            {!s.has_parent && s.pending_parent_phone && (
                              <button style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "var(--warning-soft)", border: "1px solid var(--warning-border)",
                                color: "var(--warning)", borderRadius: 8, padding: "6px 12px",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                                <UserPlus size={13} /> Send Invite
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--ink-dim)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)", margin: 0 }}>{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 72, background: "var(--surface-raised)", border: "1px solid var(--stroke)",
          borderRadius: 12, opacity: 0.5,
        }} />
      ))}
    </div>
  );
}
