import { AlertItem, DailyReport, MessageItem, ProgressEntry, Student, TripStatus } from "../types";

export const mockStudent: Student = {
  id: 1,
  name: "Aarav Roy",
  grade: "Class 4B",
  routeName: "North Route A",
  stopName: "Lakeview Stop",
};

export const mockTrip: TripStatus = {
  id: 101,
  routeName: "North Route A",
  busLabel: "Bus 12",
  etaMinutes: 8,
  status: "active",
  busLocation: {
    latitude: 22.5726,
    longitude: 88.3639,
    speed: 24,
    heading: 140,
    updatedAt: "2026-04-13T10:15:00+05:30",
  },
};

export const mockProgress: ProgressEntry[] = [
  {
    id: 1,
    title: "Strong reading progress",
    note: "Completed the weekly reading task confidently and helped peers during discussion.",
    category: "Academic",
    createdAt: "2026-04-12T14:00:00+05:30",
    isReadByParent: false,
  },
  {
    id: 2,
    title: "Great class participation",
    note: "Volunteered answers in science and stayed engaged through the full session.",
    category: "Participation",
    createdAt: "2026-04-11T11:30:00+05:30",
    isReadByParent: true,
  },
];

export const mockMessages: MessageItem[] = [
  {
    id: 1,
    title: "Summer activity registrations open",
    body: "Parents can now enroll students in the school summer activity camp from the message center.",
    tag: "Update",
    createdAt: "2026-04-12T09:30:00+05:30",
    isRead: false,
  },
  {
    id: 2,
    title: "Partner offer: school supplies",
    body: "Discounted notebooks and art kits are available this week through the school partner store.",
    tag: "Offer",
    createdAt: "2026-04-10T12:00:00+05:30",
    isRead: true,
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: 0,
    title: "School day concluded",
    body: "Aarav was marked as school concluded in the final class and the end-of-day report is ready.",
    level: "info",
    createdAt: "2026-04-13T15:35:00+05:30",
  },
  {
    id: 1,
    title: "Bus is 2 stops away",
    body: "Bus 12 is approaching Lakeview Stop.",
    level: "info",
    createdAt: "2026-04-13T10:10:00+05:30",
  },
  {
    id: 2,
    title: "Student boarded safely",
    body: "Aarav boarded Bus 12 at 7:42 AM.",
    level: "info",
    createdAt: "2026-04-13T07:42:00+05:30",
  },
];

export const mockDailyReports: DailyReport[] = [
  {
    id: 1,
    date: "2026-04-13",
    attendanceSummary: "Present across all scheduled classes. Marked active in school during first class and school concluded during final class.",
    teacherCommentSummary: "2 teacher notes were added today, including reading confidence and science participation.",
    unreadCommentCount: 1,
  },
];
