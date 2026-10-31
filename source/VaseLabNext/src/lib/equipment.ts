import type {
  Equipment,
  EquipmentActivity,
  EquipmentUsage,
  NewEquipmentInput,
  NewEquipmentField,
} from "@/types/equipment";
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

const ERROR_FIELDS: Record<string, NewEquipmentField> = {
  "20": "name",
  "21": "model",
  "22": "state",
  "23": "description",
};

export class EquipmentValidationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public field?: NewEquipmentField
  ) {
    super(message);
  }
}

export async function createEquipment(input: NewEquipmentInput): Promise<{ id: number }> {
  const res = await authFetch("/equipment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);

  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    throw new EquipmentValidationError(code, body.error, ERROR_FIELDS[code]);
  }
  if (!res.ok) throw new Error(`Create equipment failed: ${res.status}`);
  return body;
}

// 1 -> "EQP-01", 12 -> "EQP-12"
export function formatEquipmentId(id: number) {
  return `EQP-${String(id).padStart(2, "0")}`;
}
