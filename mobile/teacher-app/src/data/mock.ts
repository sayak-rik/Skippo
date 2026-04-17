// ---------------------------------------------------------------------------
// Mock data used as fallbacks when the backend API is unreachable.
// All shapes must match the corresponding TypeScript types in src/types/index.ts.
// ---------------------------------------------------------------------------

import {
  AssistRequest,
  ClassBroadcast,
  ClassSession,
  Classroom,
  EndOfDayPreview,
  ProgressNote,
  RosterStudent,
} from "../types";

// ── Schedule ──────────────────────────────────────────────────────────────────

export const mockSchedule: ClassSession[] = [
  {
    id: 1,
    classroomLabel: "Class 4B",
    title: "Morning Attendance",
    startsAt: "08:00",
    endsAt: "08:30",
    isCurrent: true,
    attendanceBoundary: "school_entry",
  },
  {
    id: 2,
    classroomLabel: "Class 4B",
    title: "Science",
    startsAt: "10:00",
    endsAt: "10:45",
    isCurrent: false,
    attendanceBoundary: "none",
  },
  {
    id: 3,
    classroomLabel: "Class 5A",
    title: "Mathematics",
    startsAt: "11:00",
    endsAt: "11:45",
    isCurrent: false,
    attendanceBoundary: "none",
  },
  {
    id: 4,
    classroomLabel: "Class 4B",
    title: "Closing Period",
    startsAt: "14:45",
    endsAt: "15:10",
    isCurrent: false,
    attendanceBoundary: "school_exit",
  },
];

// ── Roster ────────────────────────────────────────────────────────────────────

export const mockRoster: RosterStudent[] = [
  { id: 1, fullName: "Aarav Roy",    rollNumber: "04", isPresent: false, isAbsent: false, tags: [] },
  { id: 2, fullName: "Mira Dutta",   rollNumber: "07", isPresent: false, isAbsent: false, tags: [] },
  { id: 3, fullName: "Ved Singh",    rollNumber: "11", isPresent: false, isAbsent: false, tags: [] },
  { id: 4, fullName: "Sia Das",      rollNumber: "18", isPresent: false, isAbsent: false, tags: [] },
  { id: 5, fullName: "Rohan Mehta",  rollNumber: "22", isPresent: false, isAbsent: false, tags: [] },
  { id: 6, fullName: "Priya Sharma", rollNumber: "25", isPresent: false, isAbsent: false, tags: [] },
];

// ── End-of-day preview ────────────────────────────────────────────────────────

export const mockEndOfDayPreview: EndOfDayPreview[] = [
  {
    studentName: "Aarav Roy",
    unreadCommentCount: 1,
    summary: "Present across the day. Two teacher comments; one still unread by parent.",
  },
  {
    studentName: "Mira Dutta",
    unreadCommentCount: 0,
    summary: "Present across the day. No unread teacher comments remaining.",
  },
  {
    studentName: "Rohan Mehta",
    unreadCommentCount: 2,
    summary: "Present. Flagged for homework concern. Two comments await parent review.",
  },
];

// ── Progress notes ────────────────────────────────────────────────────────────

export const mockProgressNotes: ProgressNote[] = [
  {
    id: 1,
    studentId: 1,
    studentName: "Aarav Roy",
    category: "academic",
    note: "Completed the weekly reading task confidently and helped peers during discussion.",
    createdAt: "2026-04-13T14:00:00+05:30",
    isReadByParent: false,
  },
  {
    id: 2,
    studentId: 2,
    studentName: "Mira Dutta",
    category: "participation",
    note: "Volunteered answers in science and stayed engaged through the full session.",
    createdAt: "2026-04-13T11:30:00+05:30",
    isReadByParent: true,
  },
  {
    id: 3,
    studentId: 5,
    studentName: "Rohan Mehta",
    category: "homework",
    note: "Third consecutive day without completed homework. Parents should be informed.",
    createdAt: "2026-04-13T09:00:00+05:30",
    isReadByParent: false,
  },
];

// ── Classrooms (for class-picker) ─────────────────────────────────────────────

export const mockClassrooms: Classroom[] = [
  { id: 1, name: "Class 4", section: "B", label: "Class 4B" },
  { id: 2, name: "Class 5", section: "A", label: "Class 5A" },
  { id: 3, name: "Class 3", section: "C", label: "Class 3C" },
  { id: 4, name: "Class 6", section: "A", label: "Class 6A" },
  { id: 5, name: "Class 7", section: "B", label: "Class 7B" },
  { id: 6, name: "Class 2", section: "A", label: "Class 2A" },
];

// ── Broadcasts ────────────────────────────────────────────────────────────────

export const mockBroadcasts: ClassBroadcast[] = [
  {
    id: 1,
    sessionId: 1,
    classroomLabel: "Class 4B",
    message: "Reminder: bring your science project materials tomorrow.",
    sentAt: "2026-04-12T08:15:00+05:30",
  },
];

// ── Assist requests (raised by parents) ──────────────────────────────────────

export const mockAssistRequests: AssistRequest[] = [
  {
    id: 1,
    studentId: 1,
    studentName: "Aarav Roy",
    sessionId: 1,
    question:
      "Could you clarify the fractions homework from yesterday? Aarav got confused and we weren't able to help at home.",
    status: "pending",
    teacherReply: "",
    raisedAt: "2026-04-13T07:45:00+05:30",
    resolvedAt: null,
  },
  {
    id: 2,
    studentId: 3,
    studentName: "Ved Singh",
    sessionId: 1,
    question: "Is there any extra reading material for the science chapter on plants?",
    status: "pending",
    teacherReply: "",
    raisedAt: "2026-04-13T08:00:00+05:30",
    resolvedAt: null,
  },
];
