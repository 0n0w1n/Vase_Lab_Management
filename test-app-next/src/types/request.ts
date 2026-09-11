/** Mirrors RequestState in the Flask model */
export type RequestStatus =
  | "pending"
  | "in-progress"
  | "review"
  | "close"
  | "reject";

export type RequestPriority = "low" | "medium" | "high";

export type AttachmentKind = "document" | "media";

export type Attachment = {
  id: string;
  name: string;
  /** Size in bytes; formatted for display by formatFileSize */
  bytes: number;
  /** ISO 8601 timestamp of the upload. */
  uploadedAt: string;
  kind: AttachmentKind;
};

export type Person = {
  name: string;
  /** Initials shown in the avatar bubble*/
  initials: string;
};

export type ActivityEntry = {
  id: string;
  actor: Person;
  /** ISO 8601 timestamp */
  at: string;
  message: string;
};

export type LogMessage = {
  id: string;
  author: Person;
  /** ISO 8601 timestamp */
  at: string;
  body: string;
};

/** One row of GET /requests/ */
export type RequestSummary = {
  id: string;
  title: string;
  requestedBy: string;
  /** ISO 8601 date the request should be resolved by */
  deadline: string | null;
  priority: RequestPriority;
  assignedTo: string | null;
  status: RequestStatus;
};

/** `GET /requests/<id>`. */
export type LabRequest = RequestSummary & {
  /** ISO 8601 timestamp of the request's "create" activity entry if any */
  submittedAt: string | null;
  description: string;
  attachments: Attachment[];
  /** Newest first */
  activity: ActivityEntry[];
  /** Oldest first the way a chat thread reads */
  messages: LogMessage[];
};

/** What the New Request form submits the server fills in everything else */
export type NewRequestInput = {
  title: string;
  /** Optional free text; empty string when left blank */
  notes: string;
  priority: RequestPriority;
  /** ISO 8601 date */
  deadline: string;
};
