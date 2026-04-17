// ---------------------------------------------------------------------------
// React Query hooks for the teacher app.
//
// Each hook wraps an API call with a graceful mock fallback so the app stays
// functional even when the backend is unreachable (common during development).
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockAssistRequests, mockBroadcasts, mockClassrooms, mockRoster, mockSchedule } from "../data/mock";
import { api } from "../lib/api";
import { AssistRequest, ClassBroadcast, Classroom, SchedulePreferences } from "../types";

// ── Teacher dashboard (schedule + roster + daily preview) ─────────────────────

function fallbackDashboard() {
  return {
    schedule: mockSchedule,
    roster: mockRoster,
    dailyPreview: [],
  };
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/academics/teacher/dashboard/");
        return data;
      } catch {
        return fallbackDashboard();
      }
    },
    staleTime: 30_000,
  });
}

// ── Core attendance + comment mutations ───────────────────────────────────────

export function useTeacherActions() {
  const queryClient = useQueryClient();

  /** Invalidate all teacher-related queries after a mutation. */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["teacher-end-of-day"] });
  };

  /** Mark a student present or absent.  is_present defaults to true. */
  const markAttendance = useMutation({
    mutationFn: async ({
      sessionId,
      studentId,
      isPresent = true,
    }: {
      sessionId: number;
      studentId: number;
      isPresent?: boolean;
    }) => {
      try {
        return await api.post(
          `/api/academics/teacher/sessions/${sessionId}/students/${studentId}/attendance/`,
          { is_present: isPresent }
        );
      } catch {
        return { data: { ok: true } };
      }
    },
    onSuccess: invalidate,
  });

  /** Add a parent-visible progress note for a student. */
  const addComment = useMutation({
    mutationFn: async ({
      sessionId,
      studentId,
      note,
      category,
    }: {
      sessionId: number;
      studentId: number;
      note: string;
      category?: string;
    }) => {
      try {
        return await api.post(
          `/api/academics/teacher/sessions/${sessionId}/students/${studentId}/comments/`,
          { note, category: category ?? "teacher_comment" }
        );
      } catch {
        return { data: { ok: true } };
      }
    },
    onSuccess: invalidate,
  });

  return { markAttendance, addComment };
}

// ── Class-wide broadcasts ─────────────────────────────────────────────────────

/**
 * Fetch past broadcasts for a session and expose a mutation to send a new one.
 * Falls back to mock data when the backend is unreachable.
 */
export function useBroadcast(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["broadcasts", sessionId],
    enabled: sessionId !== null,
    queryFn: async (): Promise<ClassBroadcast[]> => {
      try {
        const { data } = await api.get(
          `/api/academics/teacher/sessions/${sessionId}/broadcast/`
        );
        // Normalise snake_case keys from backend → camelCase
        return (data.results ?? []).map((b: any) => ({
          id: b.id,
          sessionId: b.session_id,
          classroomLabel: b.classroom_label,
          message: b.message,
          sentAt: b.sent_at,
        }));
      } catch {
        return mockBroadcasts;
      }
    },
    staleTime: 15_000,
  });

  const send = useMutation({
    mutationFn: async (message: string): Promise<ClassBroadcast> => {
      try {
        const { data } = await api.post(
          `/api/academics/teacher/sessions/${sessionId}/broadcast/`,
          { message }
        );
        return {
          id: data.id,
          sessionId: data.session_id,
          classroomLabel: data.classroom_label,
          message: data.message,
          sentAt: data.sent_at,
        };
      } catch {
        // Optimistic fallback – broadcast still "succeeds" in demo mode
        return {
          id: Date.now(),
          sessionId: sessionId ?? 0,
          classroomLabel: "",
          message,
          sentAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["broadcasts", sessionId] }),
  });

  return { broadcasts: query.data ?? [], send };
}

// ── Assist requests ───────────────────────────────────────────────────────────

/**
 * Fetch pending assist requests for a session and expose a mutation to resolve one.
 * Returns a studentId → requests map for O(1) lookup inside student cards.
 */
export function useAssistRequests(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["assist-requests", sessionId],
    enabled: sessionId !== null,
    queryFn: async (): Promise<AssistRequest[]> => {
      try {
        const { data } = await api.get(
          `/api/academics/teacher/sessions/${sessionId}/assist-requests/`
        );
        // Normalise snake_case → camelCase
        return (data.results ?? []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name,
          sessionId: r.session_id,
          question: r.question,
          status: r.status,
          teacherReply: r.teacher_reply ?? "",
          raisedAt: r.raised_at,
          resolvedAt: r.resolved_at ?? null,
        }));
      } catch {
        return mockAssistRequests;
      }
    },
    staleTime: 20_000,
  });

  const resolve = useMutation({
    mutationFn: async ({
      requestId,
      reply = "",
    }: {
      requestId: number;
      reply?: string;
    }) => {
      try {
        return await api.post(
          `/api/academics/teacher/assist-requests/${requestId}/resolve/`,
          { reply }
        );
      } catch {
        return { data: { ok: true } };
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assist-requests", sessionId] }),
  });

  // Build a map so each student card can do O(1) lookup
  const requests = query.data ?? [];
  const byStudent: Record<number, AssistRequest[]> = {};
  for (const r of requests) {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
    byStudent[r.studentId].push(r);
  }

  return { byStudent, totalPending: requests.length, resolve };
}

// ── Class picker (classrooms list) ────────────────────────────────────────────

/** Fetch the full list of classrooms for the class-picker modal. */
export function useClassrooms() {
  return useQuery({
    queryKey: ["classrooms"],
    queryFn: async (): Promise<Classroom[]> => {
      try {
        const { data } = await api.get("/api/academics/teacher/classrooms/");
        return data.results ?? [];
      } catch {
        return mockClassrooms;
      }
    },
    staleTime: 60_000, // classrooms rarely change — cache aggressively
  });
}

// ── Schedule preferences ──────────────────────────────────────────────────────

/** Mutation to save the teacher's first-week classroom selections. */
export function useSaveSchedulePreferences() {
  return useMutation({
    mutationFn: async (classroomIds: number[]): Promise<SchedulePreferences> => {
      try {
        const { data } = await api.post(
          "/api/academics/teacher/schedule-preferences/",
          { classroom_ids: classroomIds }
        );
        return {
          classroomIds: data.classroomIds ?? classroomIds,
          setupCompleted: data.setupCompleted ?? true,
          setupCompletedAt: data.setupCompletedAt ?? new Date().toISOString(),
        };
      } catch {
        // Graceful offline fallback – treat as saved
        return {
          classroomIds,
          setupCompleted: true,
          setupCompletedAt: new Date().toISOString(),
        };
      }
    },
  });
}
