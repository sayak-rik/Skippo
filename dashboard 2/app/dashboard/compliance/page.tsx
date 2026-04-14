import { ModulePage } from "../../../components/ModulePage";

export default function CompliancePage() {
  return (
    <ModulePage
      title="Compliance"
      description="Monitor document expiry, renewal urgency, and vehicle-level compliance status before they become operational blockers."
      links={[
        { href: "http://localhost:8000/api/compliance/driver/renewals/", label: "Open renewals API" },
      ]}
    />
  );
}
