import { ModulePage } from "../../../components/ModulePage";

export default function TeachersPage() {
  return (
    <ModulePage
      title="Teachers"
      description="Review the class schedule, current class ordering, one-tap attendance flow, and parent-visible comment activity."
      links={[
        { href: "http://localhost:8000/api/academics/teacher/dashboard/", label: "Open teacher dashboard API" },
        { href: "http://localhost:8000/api/academics/teacher/schedule/", label: "Open teacher schedule API" },
      ]}
    />
  );
}
