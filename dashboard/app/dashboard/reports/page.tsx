import { ModulePage } from "../../../components/ModulePage";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      description="Centralize parent dashboards, teacher day-end summaries, attendance signals, and unread parent comment visibility."
      links={[
        { href: "http://localhost:8000/api/reports/parent/dashboard/", label: "Open parent dashboard report API" },
        { href: "http://localhost:8000/api/reports/teacher/end-of-day/", label: "Open teacher end-of-day API" },
      ]}
    />
  );
}
