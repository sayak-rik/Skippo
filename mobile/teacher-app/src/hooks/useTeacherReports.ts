import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useTeacherEndOfDayReports() {
  return useQuery({
    queryKey: ["teacher-end-of-day"],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/teacher/end-of-day/");
      return data.results ?? [];
    },
    staleTime: 30_000,
  });
}
