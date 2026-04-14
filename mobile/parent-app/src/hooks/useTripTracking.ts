import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";

export function useTripTracking(tripId?: number) {
  return useQuery({
    queryKey: ["trip-tracking", tripId],
    enabled: Boolean(tripId),
    queryFn: async () => {
      const { data } = await api.get(`/api/tracking/trips/${tripId}/live/`);
      return data;
    },
  });
}
