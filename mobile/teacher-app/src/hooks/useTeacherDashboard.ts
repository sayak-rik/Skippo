import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { AssistRequest, ClassBroadcast, Classroom, SchedulePreferences } from "../types";

// ── Teacher dashboard (schedule + roster + daily preview) ─────────────────────

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/academics/teacher/dashboard/");
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Core attendance + comment mutations ───────────────────────────────────────

export function useTeacherActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["teacher-end-of-day"] });
  };

  const markAttendance = useMutation({
    mutationFn: async ({
      sessionId,
      studentId,
      isPresent = true,
    }: {
      sessionId: number;
      studentId: number;
      isPresent?: boolean;
    }) =>
      api.post(
        `/api/academics/teacher/sessions/${sessionId}/students/${studentId}/attendance/`,
        { is_present: isPresent }
      ),
    onSuccess: invalidate,
  });

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
    }) =>
      api.post(
        `/api/academics/teacher/sessions/${sessionId}/students/${studentId}/comments/`,
        { note, category: category ?? "teacher_comment" }
      ),
    onSuccess: invalidate,
  });

  return { markAttendance, addComment };
}

// ── Class-wide broadcasts ─────────────────────────────────────────────────────

export function useBroadcast(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["broadcasts", sessionId],
    enabled: sessionId !== null,
    queryFn: async (): Promise<ClassBroadcast[]> => {
      const { data } = await api.get(
        `/api/academics/teacher/sessions/${sessionId}/broadcast/`
      );
      return (data.results ?? []).map((b: any) => ({
        id: b.id,
        sessionId: b.session_id,
        classroomLabel: b.classroom_label,
        message: b.message,
        sentAt: b.sent_at,
      }));
    },
    staleTime: 15_000,
  });

  const send = useMutation({
    mutationFn: async (message: string): Promise<ClassBroadcast> => {
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
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["broadcasts", sessionId] }),
  });

  return { broadcasts: query.data ?? [], send };
}

// ── Assist requests ───────────────────────────────────────────────────────────

export function useAssistRequests(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["assist-requests", sessionId],
    enabled: sessionId !== null,
    queryFn: async (): Promise<AssistRequest[]> => {
      const { data } = await api.get(
        `/api/academics/teacher/sessions/${sessionId}/assist-requests/`
      );
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
    },
    staleTime: 20_000,
  });

  const resolve = useMutation({
    mutationFn: async ({ requestId, reply = "" }: { requestId: number; reply?: string }) =>
      api.post(`/api/academics/teacher/assist-requests/${requestId}/resolve/`, { reply }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assist-requests", sessionId] }),
  });

  const requests = query.data ?? [];
  const byStudent: Record<number, AssistRequest[]> = {};
  for (const r of requests) {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
    byStudent[r.studentId].push(r);
  }

  return { byStudent, totalPending: requests.length, resolve };
}

// ── Class picker (classrooms list) ────────────────────────────────────────────

export function useClassrooms() {
  return useQuery({
    queryKey: ["classrooms"],
    queryFn: async (): Promise<Classroom[]> => {
      const { data } = await api.get("/api/academics/teacher/classrooms/");
      return data.results ?? [];
    },
    staleTime: 60_000,
  });
}

// ── Today's progress notes (all students) ────────────────────────────────────

export function useProgressNotes() {
  return useQuery({
    queryKey: ["progress-notes"],
    queryFn: async () => {
      const { data } = await api.get("/api/academics/teacher/progress-notes/");
      return data.results ?? [];
    },
    staleTime: 30_000,
  });
}

// ── Schedule preferences ──────────────────────────────────────────────────────

export function useSaveSchedulePreferences() {
  return useMutation({
    mutationFn: async (classroomIds: number[]): Promise<SchedulePreferences> => {
      const { data } = await api.post(
        "/api/academics/teacher/schedule-preferences/",
        { classroom_ids: classroomIds }
      );
      return {
        classroomIds: data.classroomIds ?? classroomIds,
        setupCompleted: data.setupCompleted ?? true,
        setupCompletedAt: data.setupCompletedAt ?? new Date().toISOString(),
      };
    },
  });
}
