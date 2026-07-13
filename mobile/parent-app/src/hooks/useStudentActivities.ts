// ---------------------------------------------------------------------------
// useStudentActivities – online tests + AI classes for every linked student.
//
// Both the assessments and ai-classes APIs are school-scoped, so every call
// carries the X-School-Slug header (same pattern as useFees).
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { useSessionStore } from "../store/session";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnlineTestAccess {
  token: string;
  test_id: number;
  test_title: string;
  test_type: "mcq" | "voice" | "hybrid";
  duration_minutes: number;
  available_from: string;
  available_until: string;
  instructions: string;
  is_used: boolean;
  pod_url: string;
  session_id: string | null;
  expires_at: string;
}

export interface AIClassToken {
  id: number;
  student: number;
  student_name: string;
  token: string;
  join_url: string | null;
  class_id: number;
  class_title: string;
  subject: string;
  class_status: "draft" | "active" | "ended";
  scheduled_at: string | null;
}

export interface StudentActivities {
  studentId: number;
  studentName: string;
  tests: OnlineTestAccess[];
  aiClasses: AIClassToken[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStudentActivities() {
  const schoolSlug = useSessionStore((s) => s.schoolSlug);
  const headers = { "X-School-Slug": schoolSlug };

  return useQuery({
    queryKey: ["student-activities", schoolSlug],
    queryFn: async (): Promise<StudentActivities[]> => {
      // Reuse the parent academics endpoint to enumerate linked students.
      const { data } = await api.get("/api/academics/parent/academics/", { headers });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const students: any[] = data?.students ?? [];

      return Promise.all(
        students.map(async (s) => {
          const [tests, aiClasses] = await Promise.all([
            api
              .get<OnlineTestAccess[]>(
                `/api/assessments/parent/students/${s.studentId}/tests/`,
                { headers },
              )
              .then((r) => r.data)
              .catch(() => [] as OnlineTestAccess[]),
            api
              .get<AIClassToken[]>(
                `/api/ai-classes/parent/students/${s.studentId}/classes/`,
                { headers },
              )
              .then((r) => r.data)
              .catch(() => [] as AIClassToken[]),
          ]);
          return {
            studentId: s.studentId as number,
            studentName: s.studentName as string,
            tests,
            aiClasses,
          };
        }),
      );
    },
    enabled: Boolean(schoolSlug),
    refetchInterval: 60_000, // classes go live / tests open on a schedule
  });
}

// ── Actions ───────────────────────────────────────────────────────────────────

/** Request an exam server for this student+test. Returns the exam URL. */
export async function requestTestAccess(
  schoolSlug: string,
  studentId: number,
  testId: number,
): Promise<string> {
  const { data } = await api.post(
    `/api/assessments/parent/students/${studentId}/tests/${testId}/access/`,
    {},
    { headers: { "X-School-Slug": schoolSlug } },
  );
  if (!data?.exam_url) throw new Error("No exam URL returned.");
  return data.exam_url as string;
}
