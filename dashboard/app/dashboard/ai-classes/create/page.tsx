"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowLeft } from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";
import Link from "next/link";

interface Classroom { id: number; name: string; section: string; }

export default function CreateAIClassPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    instructions: "",
    classroom_id: "",
    scheduled_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Classroom[] | { results?: Classroom[] }>("/api/academics/admin/classrooms/")
      .then((data) => setClassrooms(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        subject: form.subject,
        instructions: form.instructions,
      };
      if (form.classroom_id) payload.classroom_id = parseInt(form.classroom_id);
      if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;

      const created = await apiFetch<{ id: number }>("/api/ai-classes/admin/classes/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/dashboard/ai-classes/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Link
          href="/dashboard/ai-classes"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Classes
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-700" />
            Create AI Teacher Class
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            A new Fly.io pod will be spun up when you activate the class.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Class Title</label>
            <input
              type="text"
              placeholder="e.g. Chapter 5: Photosynthesis"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Subject</label>
            <input
              type="text"
              placeholder="e.g. Biology, Mathematics, History"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">AI Teacher Instructions</label>
            <textarea
              placeholder="Describe what the AI teacher should cover, the student level, teaching style, topics to focus on, etc."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              required
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-vertical"
            />
            <p className="text-xs text-gray-400">
              This is the AI's system prompt. Be specific about topics, difficulty, and style.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Classroom (optional)</label>
            <select
              value={form.classroom_id}
              onChange={(e) => setForm({ ...form, classroom_id: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— no classroom assigned —</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              When a classroom is assigned, all active students get individual join links.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Scheduled At (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !form.title || !form.subject || !form.instructions}
            className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Class"}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
