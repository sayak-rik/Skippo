// ---------------------------------------------------------------------------
// Zustand session store for the teacher app.
//
// Manages authentication state, the active class session selected for
// attendance, and the first-week onboarding flag that drives the class-picker
// setup flow.
// ---------------------------------------------------------------------------

import { create } from "zustand";
import { SchedulePreferences } from "../types";

type TeacherSessionState = {
  // ── Auth state ──────────────────────────────────────────────────────────
  isAuthenticated: boolean;
  teacherName: string;
  schoolName: string;
  token: string | null;

  // ── Session & class selection ────────────────────────────────────────────
  /** ID of the session currently selected for attendance marking. */
  activeSessionId: number | null;
  /**
   * When a teacher is verbally assigned to a different class, they pick it
   * via the class-picker modal.  This override label replaces the scheduled
   * classroom label shown in the attendance header until cleared.
   */
  manualClassOverride: string | null;

  // ── First-week onboarding ────────────────────────────────────────────────
  /**
   * True when the teacher has never saved schedule preferences.  Drives the
   * first-week class-selection banner and the onboarding CTA in ScheduleScreen.
   */
  isFirstWeek: boolean;
  /** Saved preferences after the first-week setup flow completes. */
  schedulePreferences: SchedulePreferences | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  login: (payload: {
    name: string;
    token: string;
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
  teacherName: "Ms. Sen",
  schoolName: "Greenfield Public School",
  token: null,
  activeSessionId: null,
  manualClassOverride: null,
  isFirstWeek: false,
  schedulePreferences: null,

  login: (payload) =>
    set({
      isAuthenticated: true,
      teacherName: payload.name,
      token: payload.token,
      // In demo mode school_slug maps to a display name; real backends would
      // return school_name directly.
      schoolName: "Greenfield Public School",
      // Backend signals first-week status so we drive the onboarding flow.
      isFirstWeek: payload.is_first_week ?? false,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      activeSessionId: null,
      token: null,
      manualClassOverride: null,
      isFirstWeek: false,
      schedulePreferences: null,
    }),

  selectSession: (sessionId) => set({ activeSessionId: sessionId }),

  /** Set or clear the manual class label shown in the attendance header. */
  setManualClassOverride: (label) => set({ manualClassOverride: label }),

  /** Called once the teacher completes first-week class selection. */
  completeFirstWeekSetup: (prefs) =>
    set({ schedulePreferences: prefs, isFirstWeek: false }),
}));
