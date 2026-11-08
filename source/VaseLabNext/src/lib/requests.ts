import {
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  type EditRequestInput,
  type EditRequestState,
  type LabRequest,
  type NewRequestInput,
  type NewRequestState,
  type RequestPriority,
  type RequestStatus,
  type RequestSummary,
} from "@/types/request";
import { forbidden } from "next/navigation";
import { authFetch, isManager, type User } from "@/lib/auth";

/** Owner, lab manager or admin. Flask checks this again on every edit / delete. */
export function canEditRequest(user: User | null, request: RequestSummary & { assignees?: string[] }) {
  if (!user) return false;
  if (isManager(user)) return true;
  if (request.assignees?.includes(user.name)) return true;   // approved TA
  if (request.requesterId !== undefined) return request.requesterId === String(user.id);
  return request.requestedBy === user.name;
}


// no-store so the list isn't prerendered at build time when Flask is down

export async function getRequests(): Promise<RequestSummary[]> {
  const res = await authFetch("/request/list", { cache: "no-store" });
  if (!res.ok) throw new Error(`List requests failed: ${res.status}`);
  return res.json();
}

export async function getRequest(id: string): Promise<LabRequest | undefined> {
  if (!/^\d+$/.test(id)) return undefined;

  const res = await authFetch(`/request/details/${id}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (res.status === 403) forbidden();
  if (!res.ok) throw new Error(`Get request ${id} failed: ${res.status}`);
  return res.json();
}

const ERROR_FIELDS: Record<string, keyof EditRequestInput> = {
  "20": "title",
  "21": "details",
  "22": "priority",
  "23": "deadline",
  "30": "title",
  "31": "details",
  "32": "priority",
  "33": "deadline",
  "34": "deadline",
  // TODO(backend): edit-only codes for the manager fields
  "35": "status",
  "36": "capacity",
  "37": "capacity",
};

export class RequestValidationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public field?: keyof EditRequestInput
  ) {
    super(message);
  }
}

export async function createRequest(
  input: NewRequestInput
): Promise<{ id: number }> {
  const res = await authFetch("/request/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    throw new RequestValidationError(code, body.error, ERROR_FIELDS[code]);
  }
  if (!res.ok) throw new Error(`Create request failed: ${res.status}`);
  return body;
}

const TITLE_MAX = 255;
const DETAILS_MAX = 2000;

function isPriority(value: string): value is RequestPriority {
  return (REQUEST_PRIORITIES as readonly string[]).includes(value);
}

/**
 * Reads the request form (create and edit share it) and checks it before Flask does.
 * `keepDeadline` is the saved deadline when editing: it may already be in the
 * past, and leaving it untouched shouldn't block the save.
 */
export function parseRequestForm(
  formData: FormData,
  keepDeadline?: string | null
): {
  values: NewRequestState["values"];
  errors: NewRequestState["errors"];
  input?: NewRequestInput;
} {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    details: String(formData.get("details") ?? "").trim(),
    priority: String(formData.get("priority") ?? ""),
    deadline: String(formData.get("deadline") ?? ""),
  };

  const errors: NewRequestState["errors"] = {};

  if (!values.title) errors.title = "Please enter a header.";
  else if (values.title.length > TITLE_MAX)
    errors.title = `Header must be ${TITLE_MAX} characters or fewer.`;

  if (values.details.length > DETAILS_MAX)
    errors.details = `Details must be ${DETAILS_MAX} characters or fewer.`;

  if (!isPriority(values.priority)) errors.priority = "Please select a priority.";

  // Compared against today's UTC date, so it can be a few hours lenient around
  // midnight — good enough as a sanity check; the backend owns the real rule.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.deadline))
    errors.deadline = "Please select a deadline.";
  else if (values.deadline !== keepDeadline && values.deadline < new Date().toISOString().slice(0, 10))
    errors.deadline = "Deadline can't be in the past.";

  if (Object.keys(errors).length > 0) return { values, errors };
  return { values, errors, input: { ...values, priority: values.priority as RequestPriority } };
}

function isStatus(value: string): value is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(value);
}

/** Reads the manager-only fields of the edit form: status and capacity. */
export function parseManagerFields(formData: FormData): {
  values: Pick<EditRequestState["values"], "status" | "capacity">;
  errors: EditRequestState["errors"];
  input?: Pick<EditRequestInput, "status" | "capacity">;
} {
  const values = {
    status: String(formData.get("status") ?? ""),
    capacity: String(formData.get("capacity") ?? "").trim(),
  };
  const capacity = Number(values.capacity);

  const errors: EditRequestState["errors"] = {};
  if (!isStatus(values.status)) errors.status = "Please select a status.";
  if (!Number.isInteger(capacity) || capacity < 1)
    errors.capacity = "Enter a whole number of at least 1.";

  if (Object.keys(errors).length > 0) return { values, errors };
  return { values, errors, input: { status: values.status as RequestStatus, capacity } };
}

/** Throws RequestValidationError when Flask rejects a field. */
async function throwOnError(res: Response, what: string) {
  const body = await res.json().catch(() => null);
  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    throw new RequestValidationError(code, body.error, ERROR_FIELDS[code]);
  }
  if (!res.ok) throw new Error(`${what} failed: ${res.status}`);
}

// TODO(backend): POST /request/edit/<id>, owner + lab manager + admin
export async function editRequest(id: string, input: EditRequestInput): Promise<void> {
  const res = await authFetch(`/request/edit/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await throwOnError(res, `Edit request ${id}`);
}

// TODO(backend): POST /request/delete/<id>, owner + lab manager + admin
export async function deleteRequest(id: string): Promise<void> {
  const res = await authFetch(`/request/delete/${encodeURIComponent(id)}`, { method: "POST" });
  await throwOnError(res, `Delete request ${id}`);
}
