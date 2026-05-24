import { create } from "zustand";
import { setAuthToken } from "../lib/api";

type DriverSessionState = {
  isAuthenticated: boolean;
  driverName: string;
  token: string | null;
  activeTripId: number | null;
  isPendingApproval: boolean;
  signupRequestId: number | null;
  aadharNumber: string;
  driverId: number | null;
  routeId: number | null;
  login: (payload: {
    name: string;
    token: string;
    is_pending_approval?: boolean;
    signup_request_id?: number;
    aadhar_number?: string;
    driver_id?: number;
  }) => void;
  logout: () => void;
  startTrip: (tripId: number) => void;
  endTrip: () => void;
  approvalGranted: () => void;
  setRouteId: (routeId: number) => void;
};

export const useDriverSessionStore = create<DriverSessionState>((set) => ({
  isAuthenticated: false,
  driverName: "",
  token: null,
  activeTripId: null,
  isPendingApproval: false,
  signupRequestId: null,
  aadharNumber: "",
  driverId: null,
  routeId: null,
  login: (payload) => {
    setAuthToken(payload.token);
    set({
      isAuthenticated: true,
      driverName: payload.name,
      token: payload.token,
      isPendingApproval: payload.is_pending_approval ?? false,
      signupRequestId: payload.signup_request_id ?? null,
      aadharNumber: payload.aadhar_number ?? "",
      driverId: payload.driver_id ?? null,
    });
  },
  logout: () => {
    setAuthToken(null);
    set({
      isAuthenticated: false,
      activeTripId: null,
      token: null,
      isPendingApproval: false,
      signupRequestId: null,
      driverId: null,
      routeId: null,
    });
  },
  startTrip: (tripId) => set({ activeTripId: tripId }),
  endTrip: () => set({ activeTripId: null }),
  approvalGranted: () => set({ isPendingApproval: false }),
  setRouteId: (routeId) => set({ routeId }),
}));
