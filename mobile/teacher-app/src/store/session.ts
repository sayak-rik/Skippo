import { create } from "zustand";

type TeacherSessionState = {
  isAuthenticated: boolean;
  teacherName: string;
  token: string | null;
  activeSessionId: number | null;
  login: (payload: { name: string; token: string }) => void;
  logout: () => void;
  selectSession: (sessionId: number) => void;
};

export const useTeacherSessionStore = create<TeacherSessionState>((set) => ({
  isAuthenticated: false,
  teacherName: "Ms. Sen",
  token: null,
  activeSessionId: null,
  login: (payload) => set({ isAuthenticated: true, teacherName: payload.name, token: payload.token }),
  logout: () => set({ isAuthenticated: false, activeSessionId: null, token: null }),
  selectSession: (sessionId) => set({ activeSessionId: sessionId }),
}));
