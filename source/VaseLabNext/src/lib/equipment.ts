// MOCK DATA — replace with real API / database calls later.
import { Equipment } from "@/types/equipment";

const equipment: Equipment[] = [
  { id: 1, name: "Digital Oscilloscope", model: "NONY-123", state: "available", expectedReturn: null },
  { id: 2, name: "Bench Power Supply", model: "PWR-3005", state: "in_use", expectedReturn: "2026-10-30" },
  { id: 3, name: "Soldering Station", model: "SLD-940", state: "available", expectedReturn: null },
  { id: 4, name: "Logic Analyzer", model: "LGA-16X", state: "maintenance", expectedReturn: null },
  { id: 5, name: "3D Printer", model: "PRT-MK4", state: "in_use", expectedReturn: "2026-11-05" },
  { id: 6, name: "Function Generator", model: "FGN-2200", state: "available", expectedReturn: null },
  { id: 7, name: "Thermal Camera", model: "THM-E8", state: "retired", expectedReturn: null },
  { id: 8, name: "Digital Multimeter", model: "DMM-87V", state: "in_use", expectedReturn: "2026-10-27" },
];

export async function getEquipment(): Promise<Equipment[]> {
  return equipment;
}

export async function getEquipmentById(id: number): Promise<Equipment | undefined> {
  return equipment.find((item) => item.id === id);
}

// 1 -> "EQP-01", 12 -> "EQP-12"
export function formatEquipmentId(id: number) {
  return `EQP-${String(id).padStart(2, "0")}`;
}

// MOCK USER — replace with your real auth/session lookup.
// Change role to "member" to check that the Add Equipment button disappears.
export async function getCurrentUser() {
  return { name: "Test User", role: "lab_manager" as "lab_manager" | "member" };
}