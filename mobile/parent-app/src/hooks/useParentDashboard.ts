import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useParentDashboard() {
  return useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/parent/dashboard/");
      return data;
    },
  });
}
