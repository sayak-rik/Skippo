import { create } from "zustand";

type DriverSessionState = {
  isAuthenticated: boolean;
  driverName: string;
  token: string | null;
  activeTripId: number | null;
  // True for self-signup drivers until admin approves (req 6)
  isPendingApproval: boolean;
  signupRequestId: number | null;
  // Aadhaar number ties multiple vehicle assignments (req 13)
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
  driverName: "Rohit Kumar",
  token: null,
  activeTripId: null,
  isPendingApproval: false,
  signupRequestId: null,
  aadharNumber: "",
  login: (payload) =>
    set({
      isAuthenticated: true,
      driverName: payload.name,
      token: payload.token,
      isPendingApproval: payload.is_pending_approval ?? false,
      signupRequestId: payload.signup_request_id ?? null,
      aadharNumber: payload.aadhar_number ?? "",
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      activeTripId: null,
      token: null,
      isPendingApproval: false,
      signupRequestId: null,
    }),
  startTrip: (tripId) => set({ activeTripId: tripId }),
  endTrip: () => set({ activeTripId: null }),
  // Called when admin approves the self-signup request
  approvalGranted: () => set({ isPendingApproval: false }),
}));
