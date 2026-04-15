export type ClassSession = {
  id: number;
  classroomLabel: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
  attendanceBoundary: "none" | "school_entry" | "school_exit";
};

export type RosterStudent = {
  id: number;
  fullName: string;
  rollNumber: string;
  isPresent: boolean;
  isAbsent?: boolean;
  latestComment?: string;
  tags?: string[];
};

export type EndOfDayPreview = {
  studentName: string;
  unreadCommentCount: number;
  summary: string;
};

export type ProgressCategory = "academic" | "participation" | "behavior" | "homework" | "milestone" | "concern";

export type ProgressNote = {
  id: number;
  studentId: number;
  studentName: string;
  category: ProgressCategory;
  note: string;
  createdAt: string;
  isReadByParent: boolean;
};
