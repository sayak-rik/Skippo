import { useEffect, useState } from "react";
import JoinScreen from "./components/JoinScreen";
import ClassroomView from "./components/ClassroomView";
import FeedbackScreen from "./components/FeedbackScreen";
import { API_BASE } from "./config";

export default function App() {
  const [session, setSession] = useState(null);
  const [classEnded, setClassEnded] = useState(false);

  // Auto-join when URL carries Skippo params: ?class_id=...&student_name=...&token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get("class_id");
    const studentName = params.get("student_name");
    if (classId && studentName) {
      fetch(`${API_BASE}/classroom/${classId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setSession({
              classroomId: classId,
              studentId: null,
              studentName: decodeURIComponent(studentName),
              subject: data.subject,
              sttAvailable: true,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  if (classEnded) {
    const params = new URLSearchParams(window.location.search);
    return (
      <FeedbackScreen
        classId={params.get("class_id") || session?.classroomId || ""}
        studentName={session?.studentName || ""}
        subject={session?.subject || ""}
      />
    );
  }

  if (!session) {
    return <JoinScreen onJoined={setSession} />;
  }

  return (
    <ClassroomView
      classroomId={session.classroomId}
      studentId={session.studentId}
      studentName={session.studentName}
      subject={session.subject}
      sttAvailable={session.sttAvailable}
      onClassEnded={() => setClassEnded(true)}
    />
  );
}
