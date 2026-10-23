export type EquipmentState = "available" | "in_use" | "maintenance" | "retired";

export type Equipment = {
  id: number;
  name: string;
  model: string;
  state: EquipmentState;
  expectedReturn: string | null; // ISO date, only meaningful when state is "in_use"
};