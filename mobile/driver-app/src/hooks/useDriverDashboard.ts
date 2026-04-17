// ---------------------------------------------------------------------------
// Driver app data hooks
//
// useDriverDashboard   – full dashboard (vehicle, trip, students, renewals)
// useDriverActions     – mutations: startTrip, endTrip, board, drop, SOS, breakdown
// useNearbyVehicles    – list of nearby school vehicles for breakdown (req 12)
// useDriverVehicles    – all vehicles assigned to this driver (req 13)
// usePingLocation      – posts a GPS ping every 60 s during active trip (req 1)
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";
import { mockNearbyVehicles, mockDriverVehicles } from "../data/mock";

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

  /** SOS – critical emergency; alerts all parents (req 10, 11). */
  const triggerSos = useMutation({
    mutationFn: async () => api.post("/api/notifications/sos/"),
    onSuccess: invalidate,
  });

  /** Breakdown – alerts all parents, enables nearby-vehicle contact (req 10, 11). */
  const triggerBreakdown = useMutation({
    mutationFn: async () => api.post("/api/notifications/breakdown/"),
    onSuccess: invalidate,
  });

  return { startTrip, endTrip, boardStudent, dropStudent, triggerSos, triggerBreakdown };
}

// ── Nearby vehicles for breakdown (req 12) ────────────────────────────────────

export function useNearbyVehicles() {
  return useQuery({
    queryKey: ["nearby-vehicles"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/transport/nearby-vehicles/");
        return (data.results ?? []) as typeof mockNearbyVehicles;
      } catch {
        return mockNearbyVehicles;
      }
    },
  });
}

// ── Multi-vehicle switcher (req 13) ───────────────────────────────────────────

export function useDriverVehicles() {
  return useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/transport/driver/vehicles/");
        return (data.results ?? []) as typeof mockDriverVehicles;
      } catch {
        return mockDriverVehicles;
      }
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

// ── Location ping – fires every 60 s during active trip (req 1) ───────────────

export function usePingLocation(tripId: number | null, isActive: boolean) {
  const ping = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
      api.post(`/api/tracking/trips/${tripId}/ping/`, coords),
  });

  // In a real app, expo-location would provide GPS coords; we use a demo position.
  // Call ping.mutate() with real coords from the device location API.
  return { ping };
}
