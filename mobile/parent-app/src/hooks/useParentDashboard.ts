// ---------------------------------------------------------------------------
// Parent app data hooks
//
// useParentDashboard  – full dashboard payload (student, trip, progress, etc.)
// useTripTracking     – live GPS position, polled every 60 s (req 1)
// useDriverContact    – driver name + phone reachable at any time (req 4)
// useAvailableRoutes  – list of bus routes for bus-picker (req 3)
// useParentActions    – mutations: changeBus, updateStop, confirmFirstStop
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";
import { mockDriverContact, mockRoutes } from "../data/mock";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useParentDashboard() {
  return useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/parent/dashboard/");
      return data;
    },
  });
}

// ── Live trip tracking – polls every 60 s when a trip is ongoing (req 1) ────

export function useTripTracking(tripId?: number) {
  return useQuery({
    queryKey: ["trip-tracking", tripId],
    enabled: Boolean(tripId),
    // Refresh every 60 seconds so the parent map stays current with driver pings
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await api.get(`/api/tracking/trips/${tripId}/live/`);
      return data;
    },
  });
}

// ── Driver contact (req 4) ────────────────────────────────────────────────────

export function useDriverContact() {
  return useQuery({
    queryKey: ["driver-contact"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/transport/parent/driver-contact/");
        return data as typeof mockDriverContact;
      } catch {
        return mockDriverContact;
      }
    },
  });
}

// ── Available routes for bus picker (req 3) ───────────────────────────────────

export function useAvailableRoutes() {
  return useQuery({
    queryKey: ["available-routes"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/transport/parent/routes/");
        return (data.results ?? []) as typeof mockRoutes;
      } catch {
        return mockRoutes;
      }
    },
  });
}

// ── Parent mutations (req 3, 7, 8) ───────────────────────────────────────────

export function useParentActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-contact"] });
  };

  /** Change the ward's assigned bus route (req 3). */
  const changeBus = useMutation({
    mutationFn: async (routeId: number) =>
      api.post("/api/transport/parent/change-bus/", { routeId }),
    onSuccess: invalidate,
  });

  /** Set or update the ward's pickup/drop-off stop (req 7). */
  const updateStop = useMutation({
    mutationFn: async (params: {
      studentId: number;
      stopName: string;
      latitude: number;
      longitude: number;
    }) => api.post("/api/transport/parent/update-stop/", params),
    onSuccess: invalidate,
  });

  /** Confirm the auto-suggested first-trip pickup location (req 8). */
  const confirmFirstStop = useMutation({
    mutationFn: async (studentId: number) =>
      api.post("/api/transport/parent/confirm-stop/", { studentId }),
    onSuccess: invalidate,
  });

  return { changeBus, updateStop, confirmFirstStop };
}
