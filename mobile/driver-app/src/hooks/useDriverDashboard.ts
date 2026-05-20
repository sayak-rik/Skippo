import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useDriverDashboard() {
  return useQuery({
    queryKey: ["driver-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/driver/dashboard/");
      return data;
    },
  });
}

// ── All actions (mutations) ───────────────────────────────────────────────────

export function useDriverActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["parent-alerts"] });
    queryClient.invalidateQueries({ queryKey: ["trip-tracking"] });
  };

  const startTrip = useMutation({
    mutationFn: async (tripId: number) => api.post(`/api/transport/trips/${tripId}/start/`),
    onSuccess: invalidate,
  });

  const endTrip = useMutation({
    mutationFn: async (tripId: number) => api.post(`/api/transport/trips/${tripId}/end/`),
    onSuccess: invalidate,
  });

  const boardStudent = useMutation({
    mutationFn: async ({ tripId, studentId }: { tripId: number; studentId: number }) =>
      api.post(`/api/transport/trips/${tripId}/students/${studentId}/board/`),
    onSuccess: invalidate,
  });

  const dropStudent = useMutation({
    mutationFn: async ({ tripId, studentId }: { tripId: number; studentId: number }) =>
      api.post(`/api/transport/trips/${tripId}/students/${studentId}/drop/`),
    onSuccess: invalidate,
  });

  const triggerSos = useMutation({
    mutationFn: async () => api.post("/api/notifications/sos/"),
    onSuccess: invalidate,
  });

  const triggerBreakdown = useMutation({
    mutationFn: async () => api.post("/api/notifications/breakdown/"),
    onSuccess: invalidate,
  });

  return { startTrip, endTrip, boardStudent, dropStudent, triggerSos, triggerBreakdown };
}

// ── Nearby vehicles for breakdown ────────────────────────────────────────────

export function useNearbyVehicles() {
  return useQuery({
    queryKey: ["nearby-vehicles"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/nearby-vehicles/");
      return data.results ?? [];
    },
  });
}

// ── Multi-vehicle switcher ────────────────────────────────────────────────────

export function useDriverVehicles() {
  return useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/driver/vehicles/");
      return data.results ?? [];
    },
  });
}

export function useSwitchVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleId: number) =>
      api.post(`/api/transport/driver/vehicles/${vehicleId}/activate/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["driver-vehicles"] });
    },
  });
}

// ── Location ping – fires every 60 s during active trip ──────────────────────

export function usePingLocation(tripId: number | null) {
  return useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
      api.post(`/api/tracking/trips/${tripId}/ping/`, coords),
  });
}
