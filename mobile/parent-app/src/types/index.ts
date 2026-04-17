// ---------------------------------------------------------------------------
// Parent app shared types
// ---------------------------------------------------------------------------

export type Student = {
  id: number;
  name: string;
  grade: string;
  routeName: string;
  stopName: string;
  routeId?: number;
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
  // Optional fields for actionable alerts (e.g. first-trip stop confirmation)
  actionType?: string;
  studentId?: number;
};

export type DailyReport = {
  id: number;
  date: string;
  attendanceSummary: string;
  teacherCommentSummary: string;
  unreadCommentCount: number;
};

// ── New types for enhancement 2 ──────────────────────────────────────────────

/** Driver contact details accessible by the parent at any time (req 4). */
export type DriverContact = {
  name: string;
  phone: string;
  vehicleLabel: string;
  routeName: string;
};

/** A bus route the parent can assign their ward to (req 3). */
export type RouteOption = {
  id: number;
  name: string;
  busLabel: string;
  vehicleId: number;
  driverName: string;
  stops: string[];
};

/** A parent-customised pickup/drop-off stop for their ward (req 7). */
export type StopOverride = {
  stopName: string;
  latitude: number;
  longitude: number;
  setAt: string;
  confirmedByParent: boolean;
  confirmedByDriver: boolean;
};
