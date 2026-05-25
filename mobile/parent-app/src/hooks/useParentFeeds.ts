import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useParentAcademics() {
  return useQuery({
    queryKey: ["parent-academics"],
    queryFn: async () => {
      const { data } = await api.get("/api/academics/parent/academics/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as { students: any[] };
    },
  });
}

export function useParentMessages() {
  return useQuery({
    queryKey: ["parent-messages"],
    queryFn: async () => {
      const { data } = await api.get("/api/communications/parent/feed/");
      return data.results;
    },
  });
}

export function useParentAlerts() {
  return useQuery({
    queryKey: ["parent-alerts"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications/parent/feed/");
      return data.results;
    },
  });
}
