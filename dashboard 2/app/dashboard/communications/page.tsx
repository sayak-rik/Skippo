import { ModulePage } from "../../../components/ModulePage";

export default function CommunicationsPage() {
  return (
    <ModulePage
      title="Communications"
      description="Manage school notices, parent update streams, partner campaigns, and operational messages from one communications center."
      links={[
        { href: "http://localhost:8000/api/communications/parent/feed/", label: "Open parent message feed API" },
        { href: "http://localhost:8000/api/notifications/parent/feed/", label: "Open parent alert feed API" },
      ]}
    />
  );
}
