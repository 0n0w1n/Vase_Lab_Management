/** Mirrors RequestState in the Flask model */
export type RequestStatus =
  | "pending"
  | "in-progress"
  | "review"
  | "close"
  | "reject";

export type RequestPriority = "low" | "medium" | "high";

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

/** One row of GET /requests/list */
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
};

/** What the New Request form submits the server fills in everything else */
export type NewRequestInput = {
  title: string;
  details: string;
  priority: RequestPriority;
  deadline: string;
};
