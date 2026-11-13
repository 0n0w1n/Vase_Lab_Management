import type { AskState } from "@/types/decision";

/** Mirrors RequestState in the Flask model */
export const REQUEST_STATUSES = [
  "pending",
  "in-progress",
  "review",
  "close",
  "reject",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_PRIORITIES = ["low", "medium", "high"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export type Attachment = {
  id: number;
  name: string;
  bytes: number | "Unknown";
  uploadedAt: string | null;
};

export type Person = {
  name: string;
  initials: string;
};

export type ActivityEntry = {
  id: string;
  actor: Person;
  at: string;
  message: string;
};

export type LogMessage = {
  id: string;
  author: Person;
  at: string | null;
  body: string;
};

/** One row of GET /request/list */
export type RequestSummary = {
  id: string;
  title: string;
  requestedBy: string;
  /** TODO(backend): add to /request/list and /request/details so owners can edit their own */
  requesterId?: string;
  deadline: string | null;
  priority: RequestPriority;
  status: RequestStatus;
};

export type LabRequest = RequestSummary & {
  submittedAt: string | null;
  details: string;
  files: Attachment[];
  /** how many TAs the lab manager allows on it */
  capacity: number;
  assignedCount: number;
  /** names of the approved TAs */
  assignees: string[];
  /** the signed-in TA's own ask, null when they haven't asked */
  myAsk: AskState | null;
  /** the signed-in TA is approved and has asked the lab manager to take them off */
  myLeaveRequested: boolean;
  /** everyone on or asking for this request, for the lab manager's Manage TAs pop-up */
  team: TeamMember[];
  /** whether the signed-in user can add files right now */
  canUpload: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  state: AskState;
  /** approved, but asked to be taken off */
  leaving: boolean;
};

/** What the New Request form submits the server fills in everything else */
export type NewRequestInput = {
  title: string;
  details: string;
  priority: RequestPriority;
  deadline: string;
};

export type NewRequestField = keyof NewRequestInput;

export type NewRequestState = {
  /** Echoed back so the form keeps what the user typed after a failed submit. */
  values: Record<NewRequestField, string>;
  errors: Partial<Record<NewRequestField, string>>;
  /** Failure that isn't tied to one field, e.g. the backend being down. */
  message?: string;
};

/** Edit sends the create fields, plus status and capacity when a manager edits. */
export type EditRequestInput = NewRequestInput & {
  status?: RequestStatus;
  capacity?: number;
};

export type EditRequestField = keyof EditRequestInput;

/** Edit form state: like NewRequestState with the extra fields, plus `ok` once saved. */
export type EditRequestState = {
  values: Record<EditRequestField, string>;
  errors: Partial<Record<EditRequestField, string>>;
  message?: string;
  ok?: boolean;
};
