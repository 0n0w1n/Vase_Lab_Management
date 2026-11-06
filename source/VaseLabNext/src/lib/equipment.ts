import type {
  Equipment,
  EquipmentActivity,
  EquipmentState,
  EquipmentUsage,
  NewEquipmentInput,
  NewEquipmentField,
  NewEquipmentState,
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

const EQUIPMENT_STATES: EquipmentState[] = ["available", "in_use", "maintenance", "retired"];

function isEquipmentState(value: string): value is EquipmentState {
  return (EQUIPMENT_STATES as string[]).includes(value);
}

/** Reads the equipment form (create and edit share it) and checks it before Flask does. */
export function parseEquipmentForm(formData: FormData): {
  values: NewEquipmentState["values"];
  errors: NewEquipmentState["errors"];
  input?: NewEquipmentInput;
} {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    state: String(formData.get("state") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
  };

  const errors: NewEquipmentState["errors"] = {};

  if (!values.name) errors.name = "Please enter an equipment name.";
  if (values.name.length > 140) errors.name = "Name must be 140 characters or fewer.";
  if (values.model.length > 140) errors.model = "Model must be 140 characters or fewer.";
  if (!isEquipmentState(values.state)) errors.state = "Please select a state.";

  if (Object.keys(errors).length > 0) return { values, errors };
  return { values, errors, input: { ...values, state: values.state as EquipmentState } };
}

/** Throws EquipmentValidationError when Flask rejects a field. */
async function throwOnError(res: Response, what: string) {
  const body = await res.json().catch(() => null);
  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    throw new EquipmentValidationError(code, body.error, ERROR_FIELDS[code]);
  }
  if (!res.ok) throw new Error(`${what} failed: ${res.status}`);
}

// TODO(backend): POST /equipment/edit/<id>, admin + lab manager only
export async function editEquipment(id: number, input: NewEquipmentInput): Promise<void> {
  const res = await authFetch(`/equipment/edit/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await throwOnError(res, `Edit equipment ${id}`);
}

// TODO(backend): POST /equipment/delete/<id>, admin + lab manager only
export async function deleteEquipment(id: number): Promise<void> {
  const res = await authFetch(`/equipment/delete/${id}`, { method: "POST" });
  await throwOnError(res, `Delete equipment ${id}`);
}
