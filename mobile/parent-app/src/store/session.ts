import { create } from "zustand";

type SessionState = {
  isAuthenticated: boolean;
  parentName: string;
  schoolSlug: string;
  token: string | null;
  login: (payload: { name: string; school_slug: string; token: string }) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  parentName: "Aarav's Parent",
  schoolSlug: "greenfield-public-school",
  token: null,
  login: (payload) =>
    set({
      isAuthenticated: true,
      parentName: payload.name,
      schoolSlug: payload.school_slug,
      token: payload.token,
    }),
  logout: () => set({ isAuthenticated: false, token: null }),
}));
