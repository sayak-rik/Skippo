export type AssignedVehicle = {
  id: number;
  registrationNumber: string;
  label: string;
  routeName: string;
  capacity: number;
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
