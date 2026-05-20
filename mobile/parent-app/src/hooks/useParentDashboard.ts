import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

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

// ── Live trip tracking – polls every 60 s when a trip is ongoing ─────────────

export function useTripTracking(tripId?: number) {
  return useQuery({
    queryKey: ["trip-tracking", tripId],
    enabled: Boolean(tripId),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await api.get(`/api/tracking/trips/${tripId}/live/`);
      return data;
    },
  });
}

// ── Driver contact ────────────────────────────────────────────────────────────

export function useDriverContact() {
  return useQuery({
    queryKey: ["driver-contact"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/parent/driver-contact/");
      return data;
    },
  });
}

// ── Available routes for bus picker ──────────────────────────────────────────

export function useAvailableRoutes() {
  return useQuery({
    queryKey: ["available-routes"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/parent/routes/");
      return data.results ?? [];
    },
  });
}

// ── Parent mutations ──────────────────────────────────────────────────────────

export function useParentActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-contact"] });
  };

  const changeBus = useMutation({
    mutationFn: async (routeId: number) =>
      api.post("/api/transport/parent/change-bus/", { routeId }),
    onSuccess: invalidate,
  });

  const updateStop = useMutation({
    mutationFn: async (params: {
      studentId: number;
      stopName: string;
      latitude: number;
      longitude: number;
    }) => api.post("/api/transport/parent/update-stop/", params),
    onSuccess: invalidate,
  });

  const confirmFirstStop = useMutation({
    mutationFn: async (studentId: number) =>
      api.post("/api/transport/parent/confirm-stop/", { studentId }),
    onSuccess: invalidate,
  });

  return { changeBus, updateStop, confirmFirstStop };
}
