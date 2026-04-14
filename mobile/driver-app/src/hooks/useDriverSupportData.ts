import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useDriverRenewals() {
  return useQuery({
    queryKey: ["driver-renewals"],
    queryFn: async () => {
      const { data } = await api.get("/api/compliance/driver/renewals/");
      return data.results;
    },
  });
}

export function useDriverDevices() {
  return useQuery({
    queryKey: ["driver-devices"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications/driver/devices/");
      return data.results;
    },
  });
}
