import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useDriverDashboard() {
  return useQuery({
    queryKey: ["driver-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/driver/dashboard/");
      return data;
    },
  });
}

export function useDriverActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-renewals"] });
    queryClient.invalidateQueries({ queryKey: ["driver-devices"] });
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

  return { startTrip, endTrip, boardStudent, dropStudent, triggerSos };
}
