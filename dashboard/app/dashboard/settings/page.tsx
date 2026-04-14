import { ModulePage } from "../../../components/ModulePage";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      description="This module will hold school branding, tenant URL settings, admin roles, and environment-level controls for the dashboard."
      links={[
        { href: "http://localhost:8000/health/", label: "Open backend health endpoint" },
        { href: "http://localhost:8000/api/auth/me/?role=teacher", label: "Open current teacher demo profile" },
      ]}
    />
  );
}
