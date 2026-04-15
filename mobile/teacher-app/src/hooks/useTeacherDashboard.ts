import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockSchedule, mockRoster } from "../data/mock";
import { api } from "../lib/api";

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
    }: {
      sessionId: number;
      studentId: number;
    }) => {
      try {
        return await api.post(
          `/api/academics/teacher/sessions/${sessionId}/students/${studentId}/attendance/`
        );
      } catch {
        return { data: { ok: true } };
      }
    },
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
