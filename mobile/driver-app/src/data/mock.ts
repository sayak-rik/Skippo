import { AssignedVehicle, DeviceItem, RenewalItem, StudentRideItem, TripStatus } from "../types";

export const mockVehicle: AssignedVehicle = {
  id: 1,
  registrationNumber: "WB-04-AB-1288",
  label: "Bus 12",
  routeName: "North Route A",
  capacity: 42,
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
  { id: 1, name: "Aarav Roy", stopName: "Lakeview Stop", status: "absent" },
  { id: 2, name: "Mira Dutta", stopName: "Pine Street", status: "boarded" },
  { id: 3, name: "Ved Singh", stopName: "Metro Corner", status: "dropped" },
  { id: 4, name: "Sia Das", stopName: "City Center", status: "absent" },
];

export const mockRenewals: RenewalItem[] = [
  { id: 1, title: "Vehicle fitness certificate", expiresOn: "2026-04-20", priority: "urgent" },
  { id: 2, title: "Pollution certificate", expiresOn: "2026-05-07", priority: "normal" },
  { id: 3, title: "Insurance renewal", expiresOn: "2026-05-15", priority: "normal" },
];

export const mockDevices: DeviceItem[] = [
  { id: 1, label: "Samsung A54", platform: "Android", isCurrent: true },
  { id: 2, label: "School Backup Phone", platform: "Android", isCurrent: false },
];
