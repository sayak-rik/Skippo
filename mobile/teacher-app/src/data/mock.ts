import { ClassSession, EndOfDayPreview, RosterStudent } from "../types";

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
    classroomLabel: "Class 4B",
    title: "Closing Period",
    startsAt: "14:45",
    endsAt: "15:10",
    isCurrent: false,
    attendanceBoundary: "school_exit",
  },
];

export const mockRoster: RosterStudent[] = [
  { id: 1, fullName: "Aarav Roy", rollNumber: "04", isPresent: false },
  { id: 2, fullName: "Mira Dutta", rollNumber: "07", isPresent: false },
  { id: 3, fullName: "Ved Singh", rollNumber: "11", isPresent: false },
  { id: 4, fullName: "Sia Das", rollNumber: "18", isPresent: false },
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
];
