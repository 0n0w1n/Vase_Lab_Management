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
  at: string;
  body: string;
};

/** One row of GET /request/list */
export type RequestSummary = {
  id: string;
  title: string;
  requestedBy: string;
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
};

/** What the New Request form submits the server fills in everything else */
export type NewRequestInput = {
  title: string;
  details: string;
  priority: RequestPriority;
  deadline: string;
};
