import { create } from "zustand";
import { setAuthToken } from "../lib/api";

type SessionState = {
  isAuthenticated: boolean;
  parentName: string;
  schoolSlug: string;
  token: string | null;
  selectedRouteId: number | null;
  login: (payload: { name: string; school_slug: string; token: string; routeId?: number }) => void;
  logout: () => void;
  setSelectedRoute: (routeId: number) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  parentName: "",
  schoolSlug: "",
  token: null,
  selectedRouteId: null,
  login: (payload) => {
    setAuthToken(payload.token);
    set({
      isAuthenticated: true,
      parentName: payload.name,
      schoolSlug: payload.school_slug,
      token: payload.token,
      selectedRouteId: payload.routeId ?? null,
    });
  },
  logout: () => {
    setAuthToken(null);
    set({ isAuthenticated: false, token: null, selectedRouteId: null });
  },
  setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),
}));
