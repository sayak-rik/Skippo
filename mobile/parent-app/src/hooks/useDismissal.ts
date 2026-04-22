// ---------------------------------------------------------------------------
// Dismissal hooks — parent car-pickup flow.
//
// useDismissalIntent   – fetch the current active intent + queue position
// useSignalArrival     – mutation: POST /api/dismissal/intent/
// useCompletePickup    – mutation: POST /api/dismissal/complete/:id
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

export type DismissalIntent = {
  id: number;
  student_id: number;
  student_name: string;
  parent_name: string;
  classroom: string;
  eta_minutes: number;
  eta_label: string;
  status: "pending" | "notified" | "completed";
  queue_position: number;
  created_at: string;
  notified_at: string | null;
  completed_at: string | null;
};

// ── Current intent for the logged-in parent's child ──────────────────────────

export function useDismissalIntent(studentId: number) {
  return useQuery({
    queryKey: ["dismissal-intent", studentId],
    queryFn: async () => {
      const { data } = await api.get(`/api/dismissal/intent/?student_id=${studentId}`);
      return data.intent as DismissalIntent | null;
    },
    // Poll every 15 s so the queue position and status stay live.
    refetchInterval: 15_000,
  });
}

// ── Signal arrival ────────────────────────────────────────────────────────────

export function useSignalArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { student_id: number; eta_minutes: number }) =>
      api.post("/api/dismissal/intent/", params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dismissal-intent", variables.student_id] });
    },
  });
}

// ── Confirm pickup complete ───────────────────────────────────────────────────

export function useCompletePickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: number) =>
      api.post(`/api/dismissal/complete/${studentId}/`, {}),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: ["dismissal-intent", studentId] });
    },
  });
}
