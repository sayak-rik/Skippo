"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Bot, Play, Square, Star, Clock, BookOpen, Users } from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";
import Link from "next/link";

interface AIClass {
  id: number;
  title: string;
  subject: string;
  status: "draft" | "active" | "ended";
  scheduled_at: string | null;
  pod_url: string;
  ended_at: string | null;
  feedback_count: number;
  avg_rating: number | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft:  "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  ended:  "bg-blue-100 text-blue-600",
};

export default function AIClassesPage() {
  const [classes, setClasses] = useState<AIClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "active" | "ended">("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await apiFetch<AIClass[]>(`/api/ai-classes/admin/classes/${params}`);
      setClasses(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-700" />
              AI Teacher Classes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Virtual AI-powered classes — each runs on its own cloud server
            </p>
          </div>
          <Link
            href="/dashboard/ai-classes/create"
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4" />
            New Class
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "draft", "active", "ended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filter === s
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Class list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No AI classes yet</p>
            <p className="text-sm mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[cls.status]}`}>
                      {cls.status}
                    </span>
                    {cls.avg_rating && (
                      <span className="text-xs text-amber-600 flex items-center gap-0.5">
                        <Star className="w-3 h-3" />
                        {cls.avg_rating} ({cls.feedback_count})
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-gray-900 truncate">{cls.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {cls.subject}
                    </span>
                    {cls.scheduled_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(cls.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/dashboard/ai-classes/${cls.id}`}
                  className="text-sm text-blue-700 font-medium hover:underline whitespace-nowrap"
                >
                  View details →
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
