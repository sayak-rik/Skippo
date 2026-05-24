import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ── Parent profile (name + phone + all linked students) ───────────────────────

export interface ParentProfileData {
  name: string;
  phone: string;
  school_name: string;
  students: { id: number; name: string; grade: string }[];
}

export function useParentProfile() {
  return useQuery({
    queryKey: ["parent-profile"],
    queryFn: async () => {
      const { data } = await api.get("/api/auth/parent/profile/");
      return data as ParentProfileData;
    },
  });
}

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

// ── Parent's current bus enrollment(s) ───────────────────────────────────────

export function useParentEnrollment() {
  return useQuery({
    queryKey: ["parent-enrollment"],
    queryFn: async () => {
      const { data } = await api.get("/api/transport/parent/enrollment/");
      return (data.enrollments ?? []) as EnrollmentEntry[];
    },
  });
}

export interface EnrollmentEntry {
  student_id: number;
  student_name: string;
  route_id: number | null;
  route_name: string | null;
  bus_label: string | null;
  driver_name: string | null;
  driver_confirmed: boolean;
}

// ── QR code generation (imperative — call refetch to trigger) ─────────────────

export function useStudentQR(studentId: number | null) {
  return useQuery({
    queryKey: ["student-qr", studentId],
    enabled: false,
    queryFn: async () => {
      const { data } = await api.get(`/api/transport/students/${studentId}/qr/`);
      return data as { token: string; expires_at: string; qr_image: string; student: { id: number; name: string } };
    },
  });
}

// ── Parent mutations ──────────────────────────────────────────────────────────

export function useParentActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-contact"] });
    queryClient.invalidateQueries({ queryKey: ["parent-enrollment"] });
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

  const unenroll = useMutation({
    mutationFn: async (studentId: number) =>
      api.post("/api/transport/parent/unenroll/", { student_id: studentId }),
    onSuccess: invalidate,
  });

  return { changeBus, updateStop, confirmFirstStop, unenroll };
}
