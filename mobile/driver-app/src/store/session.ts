import { create } from "zustand";

type DriverSessionState = {
  isAuthenticated: boolean;
  driverName: string;
  token: string | null;
  activeTripId: number | null;
  login: (payload: { name: string; token: string }) => void;
  logout: () => void;
  startTrip: (tripId: number) => void;
  endTrip: () => void;
};

export const useDriverSessionStore = create<DriverSessionState>((set) => ({
  isAuthenticated: false,
  driverName: "Rohit Kumar",
  token: null,
  activeTripId: null,
  login: (payload) => set({ isAuthenticated: true, driverName: payload.name, token: payload.token }),
  logout: () => set({ isAuthenticated: false, activeTripId: null, token: null }),
  startTrip: (tripId) => set({ activeTripId: tripId }),
  endTrip: () => set({ activeTripId: null }),
}));
