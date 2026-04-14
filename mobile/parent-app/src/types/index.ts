export type Student = {
  id: number;
  name: string;
  grade: string;
  routeName: string;
  stopName: string;
};

export type BusLocation = {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  updatedAt: string;
};

export type TripStatus = {
  id: number;
  routeName: string;
  busLabel: string;
  etaMinutes: number;
  status: "scheduled" | "active" | "arriving" | "completed";
  busLocation: BusLocation;
};

export type ProgressEntry = {
  id: number;
  title: string;
  note: string;
  category: string;
  createdAt: string;
  isReadByParent: boolean;
};

export type MessageItem = {
  id: number;
  title: string;
  body: string;
  tag: string;
  createdAt: string;
  isRead: boolean;
};

export type AlertItem = {
  id: number;
  title: string;
  body: string;
  level: "info" | "warning" | "critical";
  createdAt: string;
};

export type DailyReport = {
  id: number;
  date: string;
  attendanceSummary: string;
  teacherCommentSummary: string;
  unreadCommentCount: number;
};
