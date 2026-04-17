import { AssignedVehicle, DeviceItem, NearbyVehicle, RenewalItem, StudentRideItem, TripStatus } from "../types";

export const mockVehicle: AssignedVehicle = {
  id: 1,
  registrationNumber: "WB-04-AB-1288",
  label: "Bus 12",
  routeName: "North Route A",
  capacity: 42,
  isActive: true,
  contactPhone: "+91 98765 43210",
};

export const mockTrip: TripStatus = {
  id: 201,
  routeName: "North Route A",
  vehicleLabel: "Bus 12",
  shift: "morning",
  tripState: "scheduled",
  boardedCount: 0,
  totalCount: 28,
  nextStop: "Lakeview Stop",
  etaMinutes: 7,
};

export const mockStudents: StudentRideItem[] = [
  { id: 1, name: "Aarav Roy",  stopName: "Lakeview Stop", status: "absent" },
  { id: 2, name: "Mira Dutta", stopName: "Pine Street",   status: "boarded" },
  { id: 3, name: "Ved Singh",  stopName: "Metro Corner",  status: "dropped", hasStopOverride: true },
  { id: 4, name: "Sia Das",    stopName: "City Center",   status: "absent" },
];

export const mockRenewals: RenewalItem[] = [
  { id: 1, title: "Vehicle fitness certificate", expiresOn: "2026-04-20", priority: "urgent" },
  { id: 2, title: "Pollution certificate",       expiresOn: "2026-05-07", priority: "normal" },
  { id: 3, title: "Insurance renewal",           expiresOn: "2026-05-15", priority: "normal" },
];

export const mockDevices: DeviceItem[] = [
  { id: 1, label: "Samsung A54",         platform: "Android", isCurrent: true },
  { id: 2, label: "School Backup Phone", platform: "Android", isCurrent: false },
];

/** Nearby school vehicles for breakdown assistance (req 12). */
export const mockNearbyVehicles: NearbyVehicle[] = [
  {
    id: 2,
    label: "Bus 7",
    driverName: "Anil Sharma",
    phone: "+91 98111 22333",
    routeName: "South Route B",
    distanceKm: 1.4,
  },
  {
    id: 3,
    label: "Bus 3",
    driverName: "Suresh Patil",
    phone: "+91 97444 55666",
    routeName: "East Route C",
    distanceKm: 2.8,
  },
];

/** Multiple vehicles assigned to the demo driver (req 13). */
export const mockDriverVehicles: AssignedVehicle[] = [
  {
    id: 1,
    registrationNumber: "WB-04-AB-1288",
    label: "Bus 12",
    routeName: "North Route A",
    capacity: 42,
    isActive: true,
    contactPhone: "+91 98765 43210",
  },
  {
    id: 2,
    registrationNumber: "WB-04-AB-9901",
    label: "Bus 7",
    routeName: "South Route B",
    capacity: 38,
    isActive: false,
    contactPhone: "+91 91234 56789",
  },
];
