"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot, ArrowLeft, Play, Square, ExternalLink, Copy, Star,
  Users, MessageSquare, Clock, BookOpen, CheckCircle,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";
import Link from "next/link";

interface Token {
  id: number;
  student: number;
  student_name: string;
  token: string;
  join_url: string | null;
}

interface Feedback {
  id: number;
  student_name: string;
  rating: number;
  comment: string;
  submitted_at: string;
}

interface AIClass {
  id: number;
  title: string;
  subject: string;
  instructions: string;
  status: "draft" | "active" | "ended";
  classroom: number | null;
  scheduled_at: string | null;
  pod_url: string;
  ended_at: string | null;
  feedback_count: number;
  avg_rating: number | null;
  student_count: number;
  class_summary: Record<string, unknown>;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft:  "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  ended:  "bg-blue-100 text-blue-600",
};

export default function AIClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cls, setCls] = useState<AIClass | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "students" | "feedback">("overview");

  const load = async () => {
    setLoading(true);
    try {
      const [clsData, tokensData, feedbackData] = await Promise.all([
        apiFetch<AIClass>(`/api/ai-classes/admin/classes/${id}/`),
        apiFetch<Token[]>(`/api/ai-classes/admin/classes/${id}/tokens/`).catch(() => [] as Token[]),
        apiFetch<Feedback[]>(`/api/ai-classes/admin/classes/${id}/feedback/`).catch(() => [] as Feedback[]),
      ]);
      setCls(clsData);
      setTokens(tokensData);
      setFeedback(feedbackData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleActivate = async () => {
    if (!cls) return;
    setActivating(true);
    try {
      const updated = await apiFetch<AIClass>(`/api/ai-classes/admin/classes/${id}/activate/`, {
        method: "POST",
      });
      setCls(updated);
    } catch (err: any) {
      alert(err?.message || "Failed to activate class.");
    } finally {
      setActivating(false);
    }
  };

  const handleEnd = async () => {
    if (!cls || !confirm("End this class? Students will be disconnected.")) return;
    setEnding(true);
    try {
      const updated = await apiFetch<AIClass>(`/api/ai-classes/admin/classes/${id}/end/`, {
        method: "POST",
      });
      setCls(updated);
      // Re-fetch feedback after ending
      const fb = await apiFetch<Feedback[]>(`/api/ai-classes/admin/classes/${id}/feedback/`).catch(() => [] as Feedback[]);
      setFeedback(fb);
    } catch (err: any) {
      alert(err?.message || "Failed to end class.");
    } finally {
      setEnding(false);
    }
  };

  const copyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="text-center py-20 text-gray-400">Loading…</div>
      </DashboardShell>
    );
  }

  if (!cls) {
    return (
      <DashboardShell>
        <div className="text-center py-20 text-gray-400">Class not found.</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back */}
        <Link
          href="/dashboard/ai-classes"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Classes
        </Link>

        {/* Class header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>
                  {cls.status}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-700 shrink-0" />
                {cls.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {cls.subject}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {cls.student_count} students
                </span>
                {cls.avg_rating && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="w-4 h-4" />
                    {cls.avg_rating} ({cls.feedback_count} reviews)
                  </span>
                )}
                {cls.ended_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Ended {new Date(cls.ended_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {cls.status === "draft" && (
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {activating ? "Starting…" : "Activate Class"}
                </button>
              )}
              {cls.status === "active" && (
                <div className="flex flex-col gap-2 items-end">
                  <a
                    href={cls.pod_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Class
                  </a>
                  <button
                    onClick={handleEnd}
                    disabled={ending}
                    className="flex items-center gap-2 text-red-600 text-sm font-medium hover:underline"
                  >
                    <Square className="w-4 h-4" />
                    {ending ? "Ending…" : "End Class"}
                  </button>
                </div>
              )}
              {cls.status === "ended" && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Class ended
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(["overview", "students", "feedback"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 transition ${
                tab === t
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
              {t === "feedback" && feedback.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                  {feedback.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">AI Teacher Instructions</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {cls.instructions}
            </p>
            {cls.class_summary && Object.keys(cls.class_summary).length > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h3 className="font-semibold text-gray-800">Class Summary</h3>
                <div className="flex gap-6 text-sm text-gray-600">
                  <span>
                    <span className="font-medium">{(cls.class_summary as any).conversation_turns ?? 0}</span> conversation turns
                  </span>
                  <span>
                    <span className="font-medium">{(cls.class_summary as any).student_count ?? 0}</span> students attended
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "students" && (
          <div className="space-y-3">
            {tokens.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {cls.classroom
                    ? "No students found in the linked classroom."
                    : "Assign a classroom to generate student join links."}
                </p>
              </div>
            ) : (
              tokens.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{t.student_name}</p>
                    {t.join_url && (
                      <p className="text-xs text-gray-400 truncate">{t.join_url}</p>
                    )}
                  </div>
                  {t.join_url && (
                    <button
                      onClick={() => copyUrl(t.join_url!, `tok-${t.id}`)}
                      className="shrink-0 text-blue-600 hover:text-blue-800 transition"
                      title="Copy join URL"
                    >
                      {copied === `tok-${t.id}` ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === "feedback" && (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No feedback yet.</p>
              </div>
            ) : (
              <>
                {cls.avg_rating && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="text-xl font-bold text-amber-700">{cls.avg_rating}</span>
                      <span className="text-sm text-amber-600 ml-1">/ 5 average ({feedback.length} responses)</span>
                    </div>
                  </div>
                )}
                {feedback.map((f) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{f.student_name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${n <= f.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {f.comment && (
                      <p className="text-sm text-gray-600">{f.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(f.submitted_at).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
