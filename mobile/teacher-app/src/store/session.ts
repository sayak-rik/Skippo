import { create } from "zustand";
import { setAuthToken } from "../lib/api";
import { SchedulePreferences } from "../types";

type TeacherSessionState = {
  isAuthenticated: boolean;
  teacherName: string;
  schoolName: string;
  token: string | null;
  activeSessionId: number | null;
  manualClassOverride: string | null;
  isFirstWeek: boolean;
  schedulePreferences: SchedulePreferences | null;
  login: (payload: {
    name: string;
    token: string;
    school_name?: string;
    school_slug?: string;
    is_first_week?: boolean;
  }) => void;
  logout: () => void;
  selectSession: (sessionId: number) => void;
  setManualClassOverride: (label: string | null) => void;
  completeFirstWeekSetup: (prefs: SchedulePreferences) => void;
};

export const useTeacherSessionStore = create<TeacherSessionState>((set) => ({
  isAuthenticated: false,
  teacherName: "",
  schoolName: "",
  token: null,
  activeSessionId: null,
  manualClassOverride: null,
  isFirstWeek: false,
  schedulePreferences: null,

  login: (payload) => {
    setAuthToken(payload.token);
    set({
      isAuthenticated: true,
      teacherName: payload.name,
      token: payload.token,
      schoolName: payload.school_name ?? payload.school_slug ?? "",
      isFirstWeek: payload.is_first_week ?? false,
    });
  },

  logout: () => {
    setAuthToken(null);
    set({
      isAuthenticated: false,
      activeSessionId: null,
      token: null,
      manualClassOverride: null,
      isFirstWeek: false,
      schedulePreferences: null,
    });
  },

  selectSession: (sessionId) => set({ activeSessionId: sessionId }),
  setManualClassOverride: (label) => set({ manualClassOverride: label }),
  completeFirstWeekSetup: (prefs) =>
    set({ schedulePreferences: prefs, isFirstWeek: false }),
}));
