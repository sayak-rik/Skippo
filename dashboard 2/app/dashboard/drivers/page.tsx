import { ModulePage } from "../../../components/ModulePage";

export default function DriversPage() {
  return (
    <ModulePage
      title="Drivers"
      description="Inspect active trip state, assigned vehicles, boarding progress, device sessions, and emergency escalation history."
      links={[
        { href: "http://localhost:8000/api/transport/driver/dashboard/", label: "Open driver dashboard API" },
        { href: "http://localhost:8000/api/notifications/driver/devices/", label: "Open driver devices API" },
      ]}
    />
  );
}
