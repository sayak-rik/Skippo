// ---------------------------------------------------------------------------
// Driver app shared types
// ---------------------------------------------------------------------------

export type AssignedVehicle = {
  id: number;
  registrationNumber: string;
  label: string;
  routeName: string;
  capacity: number;
  // Present when this is one of multiple assigned vehicles (req 13)
  isActive?: boolean;
  contactPhone?: string;
};

export type TripStatus = {
  id: number;
  routeName: string;
  vehicleLabel: string;
  shift: "morning" | "afternoon";
  tripState: "scheduled" | "active" | "paused" | "completed";
  boardedCount: number;
  totalCount: number;
  nextStop: string;
  etaMinutes: number;
};

export type StudentRideItem = {
  id: number;
  name: string;
  stopName: string;
  status: "absent" | "boarded" | "dropped";
  // True when a parent has set a custom stop for this student (req 7)
  hasStopOverride?: boolean;
};

export type RenewalItem = {
  id: number;
  title: string;
  expiresOn: string;
  priority: "normal" | "urgent";
};

export type DeviceItem = {
  id: number;
  label: string;
  platform: string;
  isCurrent: boolean;
};

// ── New types for enhancement 2 ──────────────────────────────────────────────

/** A nearby school vehicle the driver can contact during a breakdown (req 12). */
export type NearbyVehicle = {
  id: number;
  label: string;
  driverName: string;
  phone: string;
  routeName: string;
  distanceKm: number;
};

/** Driver signup request submitted without an invite (req 6). */
export type DriverSignupRequest = {
  id: number;
  status: "pending" | "approved" | "rejected";
  schoolSlug: string;
  name: string;
  phone: string;
};
