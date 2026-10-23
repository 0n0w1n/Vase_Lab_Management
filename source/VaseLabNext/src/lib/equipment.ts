// MOCK DATA — replace with real API / database calls later.
import type { Equipment, EquipmentActivity, EquipmentUsage } from "@/types/equipment";

const equipment: Equipment[] = [
  { id: 1, name: "Digital Oscilloscope", model: "NONY-123", type: "Measurement", state: "available", currentUser: null, expectedReturn: null, addedAt: "2025-01-15", description: "4-channel 200 MHz oscilloscope for signal analysis. Includes 4 passive probes." },
  { id: 2, name: "Bench Power Supply", model: "PWR-3005", type: "Power", state: "in_use", currentUser: "Somchai K.", expectedReturn: "2026-10-30", addedAt: "2025-02-03", description: "Adjustable DC power supply, 0–30 V / 0–5 A, with current limiting." },
  { id: 3, name: "Soldering Station", model: "SLD-940", type: "Tools", state: "available", currentUser: null, expectedReturn: null, addedAt: "2025-03-10", description: "Temperature-controlled soldering station with spare tips and stand." },
  { id: 4, name: "Logic Analyzer", model: "LGA-16X", type: "Measurement", state: "maintenance", currentUser: null, expectedReturn: null, addedAt: "2025-04-22", description: "16-channel logic analyzer with USB connection. Currently being recalibrated." },
  { id: 5, name: "3D Printer", model: "PRT-MK4", type: "Fabrication", state: "in_use", currentUser: "Napat S.", expectedReturn: "2026-11-05", addedAt: "2025-06-01", description: "FDM 3D printer, 25 × 21 × 22 cm build volume. PLA and PETG only." },
  { id: 6, name: "Function Generator", model: "FGN-2200", type: "Measurement", state: "available", currentUser: null, expectedReturn: null, addedAt: "2025-07-18", description: "Dual-channel arbitrary waveform generator up to 20 MHz." },
  { id: 7, name: "Thermal Camera", model: "THM-E8", type: "Imaging", state: "retired", currentUser: null, expectedReturn: null, addedAt: "2024-11-05", description: "Handheld thermal imaging camera. Retired after sensor failure." },
  { id: 8, name: "Digital Multimeter", model: "DMM-87V", type: "Measurement", state: "in_use", currentUser: "Pim W.", expectedReturn: "2026-10-27", addedAt: "2025-08-12", description: "True-RMS digital multimeter with test leads and temperature probe." },
];

const usage: (EquipmentUsage & { equipmentId: number })[] = [
  { equipmentId: 2, requestId: 14, requestedBy: "Somchai K.", status: "approved", deadline: "2026-10-30" },
  { equipmentId: 2, requestId: 9, requestedBy: "Pim W.", status: "completed", deadline: "2026-09-12" },
  { equipmentId: 1, requestId: 7, requestedBy: "Napat S.", status: "completed", deadline: "2026-08-20" },
  { equipmentId: 5, requestId: 15, requestedBy: "Napat S.", status: "approved", deadline: "2026-11-05" },
  { equipmentId: 8, requestId: 16, requestedBy: "Pim W.", status: "approved", deadline: "2026-10-27" },
  { equipmentId: 4, requestId: 5, requestedBy: "Somchai K.", status: "completed", deadline: "2026-07-01" },
];

const activity: (EquipmentActivity & { equipmentId: number })[] = [
  { equipmentId: 4, id: 1, action: "State changed from available to maintenance", by: "Lab Manager", at: "2026-10-20T09:15:00" },
  { equipmentId: 4, id: 2, action: "Description edited", by: "Lab Manager", at: "2026-10-20T09:17:00" },
  { equipmentId: 2, id: 3, action: "State changed from available to in use", by: "Lab Manager", at: "2026-10-16T13:40:00" },
  { equipmentId: 7, id: 4, action: "State changed from maintenance to retired", by: "Lab Manager", at: "2026-06-02T10:00:00" },
  { equipmentId: 1, id: 5, action: "Equipment added", by: "Lab Manager", at: "2025-01-15T08:30:00" },
];

export async function getEquipment(): Promise<Equipment[]> {
  return equipment;
}

export async function getEquipmentById(id: number): Promise<Equipment | undefined> {
  return equipment.find((item) => item.id === id);
}

export async function getEquipmentUsage(id: number): Promise<EquipmentUsage[]> {
  return usage.filter((u) => u.equipmentId === id);
}

export async function getEquipmentActivity(id: number): Promise<EquipmentActivity[]> {
  return activity.filter((a) => a.equipmentId === id);
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