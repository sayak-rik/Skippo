import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/academics/teacher/dashboard/");
      return data;
    },
  });
}

export function useTeacherActions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["teacher-end-of-day"] });
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["parent-alerts"] });
  };

  const markAttendance = useMutation({
    mutationFn: async ({ sessionId, studentId }: { sessionId: number; studentId: number }) =>
      api.post(`/api/academics/teacher/sessions/${sessionId}/students/${studentId}/attendance/`),
    onSuccess: invalidate,
  });

  const addComment = useMutation({
    mutationFn: async ({ sessionId, studentId, note }: { sessionId: number; studentId: number; note: string }) =>
      api.post(`/api/academics/teacher/sessions/${sessionId}/students/${studentId}/comments/`, {
        note,
        category: "teacher_comment",
      }),
    onSuccess: invalidate,
  });

  return { markAttendance, addComment };
}
