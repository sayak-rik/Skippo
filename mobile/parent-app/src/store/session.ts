import { create } from "zustand";

type SessionState = {
  isAuthenticated: boolean;
  parentName: string;
  schoolSlug: string;
  token: string | null;
  // Selected route ID — set during signup or when parent changes bus (req 3)
  selectedRouteId: number | null;
  login: (payload: { name: string; school_slug: string; token: string; routeId?: number }) => void;
  logout: () => void;
  setSelectedRoute: (routeId: number) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  parentName: "Aarav's Parent",
  schoolSlug: "greenfield-public-school",
  token: null,
  selectedRouteId: 1,
  login: (payload) =>
    set({
      isAuthenticated: true,
      parentName: payload.name,
      schoolSlug: payload.school_slug,
      token: payload.token,
      selectedRouteId: payload.routeId ?? 1,
    }),
  logout: () => set({ isAuthenticated: false, token: null, selectedRouteId: null }),
  setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),
}));
