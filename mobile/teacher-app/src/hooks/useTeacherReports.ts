import { useQuery } from "@tanstack/react-query";
import { mockEndOfDayPreview } from "../data/mock";
import { api } from "../lib/api";

export function useTeacherEndOfDayReports() {
  return useQuery({
    queryKey: ["teacher-end-of-day"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/reports/teacher/end-of-day/");
        return data.results;
      } catch {
        return mockEndOfDayPreview;
      }
    },
    staleTime: 30_000,
  });
}
