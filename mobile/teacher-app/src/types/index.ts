// ---------------------------------------------------------------------------
// Shared TypeScript types for the Skippo teacher app.
// Keep types minimal and aligned with the shapes returned by the backend API.
// ---------------------------------------------------------------------------

// ── Schedule & sessions ───────────────────────────────────────────────────────

export type ClassSession = {
  id: number;
  classroomLabel: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
  attendanceBoundary: "none" | "school_entry" | "school_exit";
};

// ── Roster ────────────────────────────────────────────────────────────────────

export type RosterStudent = {
  id: number;
  fullName: string;
  rollNumber: string;
  isPresent: boolean;
  isAbsent?: boolean;
  latestComment?: string;
  tags?: string[];
};

// ── Progress notes ────────────────────────────────────────────────────────────

export type ProgressCategory =
  | "academic"
  | "participation"
  | "behavior"
  | "homework"
  | "milestone"
  | "concern";

export type ProgressNote = {
  id: number;
  studentId: number;
  studentName: string;
  category: ProgressCategory;
  note: string;
  createdAt: string;
  isReadByParent: boolean;
};

export type EndOfDayPreview = {
  studentName: string;
  unreadCommentCount: number;
  summary: string;
};

// ── Classrooms (class-picker) ─────────────────────────────────────────────────

/** A classroom record used by the class-picker feature. */
export type Classroom = {
  id: number;
  name: string;
  section: string;
  label: string; // e.g. "Class 4B"
};

// ── Broadcasts ────────────────────────────────────────────────────────────────

/** A class-wide message sent by the teacher to all parents in the classroom. */
export type ClassBroadcast = {
  id: number;
  sessionId: number;
  classroomLabel: string;
  message: string;
  sentAt: string;
};

// ── Assist requests ───────────────────────────────────────────────────────────

/** A doubt or help request raised by a parent from the parent app. */
export type AssistRequest = {
  id: number;
  studentId: number;
  studentName: string;
  sessionId: number;
  question: string;
  status: "pending" | "resolved";
  teacherReply: string;
  raisedAt: string;
  resolvedAt: string | null;
};

// ── Schedule preferences (first-week setup) ───────────────────────────────────

/** Saved during first-week onboarding; drives the recurring weekly schedule. */
export type SchedulePreferences = {
  classroomIds: number[];
  setupCompleted: boolean;
  setupCompletedAt: string;
};
