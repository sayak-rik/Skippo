import { ClassSession, EndOfDayPreview, ProgressNote, RosterStudent } from "../types";

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

export const mockRoster: RosterStudent[] = [
  { id: 1, fullName: "Aarav Roy", rollNumber: "04", isPresent: false, tags: [] },
  { id: 2, fullName: "Mira Dutta", rollNumber: "07", isPresent: false, tags: [] },
  { id: 3, fullName: "Ved Singh", rollNumber: "11", isPresent: false, tags: [] },
  { id: 4, fullName: "Sia Das", rollNumber: "18", isPresent: false, tags: [] },
  { id: 5, fullName: "Rohan Mehta", rollNumber: "22", isPresent: false, tags: [] },
  { id: 6, fullName: "Priya Sharma", rollNumber: "25", isPresent: false, tags: [] },
];

export const mockEndOfDayPreview: EndOfDayPreview[] = [
  {
    studentName: "Aarav Roy",
    unreadCommentCount: 1,
    summary: "Present across the day. Two teacher comments were added; one is still unread by the parent.",
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
