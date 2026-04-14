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
  latestComment?: string;
};

export type EndOfDayPreview = {
  studentName: string;
  unreadCommentCount: number;
  summary: string;
};
