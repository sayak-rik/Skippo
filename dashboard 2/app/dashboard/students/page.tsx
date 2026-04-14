import { ModulePage } from "../../../components/ModulePage";

export default function StudentsPage() {
  return (
    <ModulePage
      title="Students"
      description="Browse student-linked operational data including class assignment, transport route, parent visibility, and end-of-day summaries."
      links={[
        { href: "http://localhost:8000/api/reports/parent/dashboard/", label: "Open parent dashboard demo payload" },
        { href: "http://localhost:8000/api/academics/parent/students/1/report/", label: "Open student report API" },
      ]}
    />
  );
}
