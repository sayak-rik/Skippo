import { ModulePage } from "../../../components/ModulePage";

export default function LiveFleetPage() {
  return (
    <ModulePage
      title="Live Fleet"
      description="School administrators can open any active trip, inspect current map coordinates, and move from fleet view into trip-specific live tracking."
      links={[
        { href: "http://localhost:8000/api/tracking/fleet/live/", label: "Open fleet live API" },
        { href: "http://localhost:8000/api/tracking/trips/201/live/", label: "Open trip 201 tracking API" },
      ]}
    />
  );
}
