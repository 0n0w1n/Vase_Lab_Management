export type RequestStatus =
  | "open"
  | "pending-review"
  | "in-progress"
  | "completed"
  | "rejected";

export type RequestPriority = "low" | "medium" | "high";

export type AttachmentKind = "document" | "media";

export type Attachment = {
  id: string;
  name: string;
  /** Size in bytes; formatted for display by `formatFileSize`. */
  bytes: number;
  /** ISO 8601 timestamp of the upload. */
  uploadedAt: string;
  kind: AttachmentKind;
};

export type Person = {
  name: string;
  /** Initials shown in the avatar bubble, e.g. "SJ". */
  initials: string;
};

export type ActivityEntry = {
  id: string;
  actor: Person;
  /** ISO 8601 timestamp. */
  at: string;
  message: string;
};

export type LogMessage = {
  id: string;
  author: Person;
  /** ISO 8601 timestamp. */
  at: string;
  body: string;
};

export type LabRequest = {
  id: string;
  title: string;
  /** Area the request belongs to, e.g. "Lab Equipment". */
  category: string;
  requestedBy: string;
  /** ISO 8601 timestamp of submission. */
  submittedAt: string;
  /** ISO 8601 date the request should be resolved by. */
  deadline: string;
  priority: RequestPriority;
  assignedTo: string | null;
  description: string;
  status: RequestStatus;
  attachments: Attachment[];
  /** Newest first. */
  activity: ActivityEntry[];
  /** Oldest first, the way a chat thread reads. */
  messages: LogMessage[];
};

/** What the New Request form submits; the server fills in everything else. */
export type NewRequestInput = {
  title: string;
  /** Optional free text; empty string when left blank. */
  notes: string;
  priority: RequestPriority;
  /** ISO 8601 date (YYYY-MM-DD). */
  deadline: string;
};
