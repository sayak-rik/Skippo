import { create } from "zustand";

export interface Question {
  id: string;
  order: number;
  question_text: string;
  question_type: "mcq" | "short_answer" | "voice";
  options: { id: string; text: string }[] | null;
  points: number;
}

export type TestStatus =
  | "idle"
  | "initialising"
  | "waiting_room"
  | "in_progress"
  | "completed"
  | "error";

export type WsStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface TestStore {
  // Identity
  sessionId: string | null;
  accessToken: string | null;
  testId: string | null;

  // Test config
  questions: Question[];
  questionsCount: number;
  durationSeconds: number;
  enableProctoring: boolean;
  testType: string;

  // Progress
  currentIndex: number;
  answers: Record<string, string>;   // question_id → answer value

  // Timer
  timeRemaining: number;

  // Status
  status: TestStatus;
  completionReason: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  grade: string | null;
  errorMessage: string | null;

  // Connection
  wsStatus: WsStatus;

  // Proctoring
  proctoringAlert: string | null;    // null | "looking_away" | "multiple_people" | "phone_detected"

  // Actions
  setIdentity: (sessionId: string, accessToken: string, testId: string) => void;
  setStatus: (s: TestStatus) => void;
  setWsStatus: (s: WsStatus) => void;
  setError: (msg: string) => void;
  applySyncState: (data: SyncStatePayload) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setCurrentIndex: (i: number) => void;
  tickTimer: (remaining: number) => void;
  setCompleted: (reason: string, score: number, maxScore: number, pct: number, grade: string) => void;
  setProctoringAlert: (alert: string | null) => void;
}

export interface SyncStatePayload {
  session_id: string;
  questions: Question[];
  questions_count: number;
  current_index: number;
  time_remaining: number;
  duration_seconds: number;
  answers: Record<string, { answer: string; points_earned: number }>;
  is_completed: boolean;
  completion_reason: string;
}

export const useTestStore = create<TestStore>((set) => ({
  sessionId: null,
  accessToken: null,
  testId: null,

  questions: [],
  questionsCount: 0,
  durationSeconds: 0,
  enableProctoring: false,
  testType: "mcq",

  currentIndex: 0,
  answers: {},
  timeRemaining: 0,

  status: "idle",
  completionReason: "",
  score: null,
  maxScore: null,
  percentage: null,
  grade: null,
  errorMessage: null,

  wsStatus: "connecting",
  proctoringAlert: null,

  setIdentity: (sessionId, accessToken, testId) =>
    set({ sessionId, accessToken, testId }),

  setStatus: (status) => set({ status }),

  setWsStatus: (wsStatus) => set({ wsStatus }),

  setError: (msg) => set({ status: "error", errorMessage: msg }),

  applySyncState: (data) =>
    set((s) => ({
      questions:      data.questions ?? s.questions,
      questionsCount: data.questions_count ?? (data.questions?.length ?? s.questionsCount),
      currentIndex:   data.current_index,
      timeRemaining:  data.time_remaining,
      durationSeconds: data.duration_seconds,
      answers: Object.fromEntries(
        Object.entries(data.answers).map(([id, v]) => [id, v.answer])
      ),
      status: data.is_completed ? "completed" : "in_progress",
      completionReason: data.completion_reason,
    })),

  setAnswer: (questionId, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),

  setCurrentIndex: (i) => set({ currentIndex: i }),

  tickTimer: (remaining) => set({ timeRemaining: remaining }),

  setCompleted: (reason, score, maxScore, percentage, grade) =>
    set({ status: "completed", completionReason: reason, score, maxScore, percentage, grade }),

  setProctoringAlert: (proctoringAlert) => set({ proctoringAlert }),
}));
