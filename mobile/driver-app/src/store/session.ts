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
  login: (payload: {
    name: string;
    token: string;
    is_pending_approval?: boolean;
    signup_request_id?: number;
    aadhar_number?: string;
  }) => void;
  logout: () => void;
  startTrip: (tripId: number) => void;
  endTrip: () => void;
  approvalGranted: () => void;
};

export const useDriverSessionStore = create<DriverSessionState>((set) => ({
  isAuthenticated: false,
  driverName: "",
  token: null,
  activeTripId: null,
  isPendingApproval: false,
  signupRequestId: null,
  aadharNumber: "",
  login: (payload) => {
    setAuthToken(payload.token);
    set({
      isAuthenticated: true,
      driverName: payload.name,
      token: payload.token,
      isPendingApproval: payload.is_pending_approval ?? false,
      signupRequestId: payload.signup_request_id ?? null,
      aadharNumber: payload.aadhar_number ?? "",
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
    });
  },
  startTrip: (tripId) => set({ activeTripId: tripId }),
  endTrip: () => set({ activeTripId: null }),
  approvalGranted: () => set({ isPendingApproval: false }),
}));
