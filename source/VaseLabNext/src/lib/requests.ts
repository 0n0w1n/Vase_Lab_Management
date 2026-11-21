import {
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  type ActivityEntry,
  type EditRequestInput,
  type EditRequestState,
  type LabRequest,
  type LogMessage,
  type NewRequestInput,
  type NewRequestState,
  type RawActivity,
  type RequestPriority,
  type RequestStatus,
  type RequestSummary,
} from "@/types/request";
import { forbidden } from "next/navigation";
import { STATUS } from "@/components/request/StatusPill";
import { authFetch, isManager, type User } from "@/lib/auth";

/** Owner, lab manager or admin. Flask checks this again on every edit / delete. */
export function canEditRequest(user: User | null, request: RequestSummary & { assignees?: string[] }) {
  if (!user) return false;
  if (isManager(user)) return true;
  if (request.workOnStatus === "approved") return true; // approved TA on list page
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

export async function getRequestComments(id: string): Promise<LogMessage[] | undefined> {
  if (!/^\d+$/.test(id)) return undefined;
  const res = await authFetch(`/request/${id}/comments`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (res.status === 403) forbidden();
  if (!res.ok) throw new Error(`Get request comments failed: ${res.status}`);
  return res.json();
}

/** The request's activity log, newest first, already worded for the page. */
export async function getRequestActivity(id: string): Promise<ActivityEntry[] | undefined> {
  if (!/^\d+$/.test(id)) return undefined;
  const res = await authFetch(`/request/activity/${id}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (res.status === 403) forbidden();
  if (!res.ok) throw new Error(`Get request activity failed: ${res.status}`);
  return ((await res.json()) as RawActivity[]).map(describeActivity);
}

// Flask only stores what happened; the sentences live here. Each one continues
// from the name shown above it. `by` is fields.userID, which is the person who
// acted for most actions, but the TA it happened to for assign, unassign and
// decisions (the manager isn't recorded), hence "was assigned" rather than "assigned".
const ACTIVITY_WORDING: Record<string, (fields: Record<string, unknown>) => string> = {
  create: () => "created this request",
  // Flask logs every submitted field, not just changed ones, so they can't be listed
  update: () => "edited this request",
  "update-status": (fields) =>
    `changed the status to ${STATUS[fields.status as RequestStatus]?.label ?? String(fields.status)}`,
  "update-ask-assignment": () => "asked to work on this request",
  "update-assign-ta": () => "was assigned to this request",
  "update-unassign-ta": () => "was removed from this request",
  "update-decide-assignment": (fields) =>
    fields.decision === "Approved" ? "was approved to work on this request" : "was declined for this request",
  "update-ask-leave": () => "asked to leave this request",
  "update-decide-leave": (fields) =>
    fields.decision === "Approved"
      ? "had their leave approved and was removed from this request"
      : "had their leave declined and stays on this request",
};

/** Turns one log row from Flask into what the Activity History page shows. */
export function describeActivity(raw: RawActivity): ActivityEntry {
  const wording = ACTIVITY_WORDING[raw.action];
  return {
    id: raw.id,
    actor: raw.by
      ? {
          name: raw.by,
          initials: raw.by.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        }
      : // No user means an automatic change, e.g. the status moving when a TA is approved
        { name: "System", initials: "SYS" },
    at: raw.at,
    message:
      // File uploads are logged as a "create" too, so check the entity before the action table
      raw.entity === "file"
        ? `attached ${typeof raw.fields?.FileName === "string" ? raw.fields.FileName : "a file"}`
        : // Unknown actions still show something instead of breaking the page
          wording
          ? wording(raw.fields ?? {})
          : "updated this request",
  };
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
  input: NewRequestInput,
  equipmentId?: number
): Promise<{ id: number }> {
  const res = await authFetch("/request/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, equipment_id: equipmentId }),
  });
  const body = await res.json().catch(() => null);
  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    if (code === "35" || code === "36")
      throw new RequestValidationError(code, "That equipment isn't available. Please pick another.");
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
export async function editRequest(id: string, input: Partial<EditRequestInput>): Promise<void> {
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
