import type { Equipment, EquipmentActivity, EquipmentUsage } from "@/types/equipment";
import { authFetch } from "@/lib/auth";

export async function getEquipment(): Promise<Equipment[]> {
  const res = await authFetch("/equipment/list", { cache: "no-store" });
  if (!res.ok) throw new Error(`List equipment failed: ${res.status}`);
  return res.json();
}

export async function getEquipmentById(id: number): Promise<Equipment | undefined> {
  const res = await authFetch(`/equipment/details/${id}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Get equipment ${id} failed: ${res.status}`);
  return res.json();
}

export async function getEquipmentUsage(id: number): Promise<EquipmentUsage[]> {
  const res = await authFetch(`/equipment/usage/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Get equipment ${id} usage failed: ${res.status}`);
  return res.json();
}

export async function getEquipmentActivity(id: number): Promise<EquipmentActivity[]> {
  const res = await authFetch(`/equipment/activity/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Get equipment ${id} activity failed: ${res.status}`);
  return res.json();
}

// 1 -> "EQP-01", 12 -> "EQP-12"
export function formatEquipmentId(id: number) {
  return `EQP-${String(id).padStart(2, "0")}`;
}
