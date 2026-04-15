import { create } from "zustand";

type TeacherSessionState = {
  isAuthenticated: boolean;
  teacherName: string;
  schoolName: string;
  token: string | null;
  activeSessionId: number | null;
  login: (payload: { name: string; token: string; school_slug?: string }) => void;
  logout: () => void;
  selectSession: (sessionId: number) => void;
};

export const useTeacherSessionStore = create<TeacherSessionState>((set) => ({
  isAuthenticated: false,
  teacherName: "Ms. Sen",
  schoolName: "Greenfield Public School",
  token: null,
  activeSessionId: null,
  login: (payload) =>
    set({
      isAuthenticated: true,
      teacherName: payload.name,
      token: payload.token,
      schoolName: "Greenfield Public School",
    }),
  logout: () => set({ isAuthenticated: false, activeSessionId: null, token: null }),
  selectSession: (sessionId) => set({ activeSessionId: sessionId }),
}));
