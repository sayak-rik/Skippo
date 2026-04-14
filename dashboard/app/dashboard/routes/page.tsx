import { ModulePage } from "../../../components/ModulePage";

export default function RoutesPage() {
  return (
    <ModulePage
      title="Routes"
      description="Use this module for route planning, stop sequencing, and linking active trips to map-based transport operations."
      links={[
        { href: "http://localhost:8000/api/tracking/fleet/live/", label: "Open route-linked fleet API" },
        { href: "http://localhost:8000/api/tracking/trips/201/live/", label: "Open active route trip API" },
      ]}
    />
  );
}
