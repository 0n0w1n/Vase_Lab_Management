export type EquipmentState = "available" | "in_use" | "maintenance" | "retired";

export type Equipment = {
  id: number;
  name: string;
  model: string | null;
  state: EquipmentState;
  currentUser: string | null; // only meaningful when state is "in_use"
  expectedReturn: string | null; // ISO date, only meaningful when state is "in_use"
  addedAt: string; // ISO date
  description: string | null;
};

// One request that borrowed this equipment.
// ID and status will be null if viewer isnt staff
export type EquipmentUsage = {
  requestId: number | null;
  requestedBy: string;
  status: string | null;
  deadline: string | null;
};

// One change made to this equipment.
export type EquipmentActivity = {
  id: number;
  action: string; // e.g. "State changed from available to maintenance"
  by: string;
  at: string; // ISO date-time
};

