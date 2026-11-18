import type { Person, RequestPriority } from "@/types/request";

export const ASK_STATES = ["waiting", "approved", "declined"] as const;
export type AskState = (typeof ASK_STATES)[number];


/** One TA asking the lab manager to work on a request (GET /dashboard/decisions) */
export type TaAsk = {
  /** Shared by a TA's join ask and their later leave ask on the same request */
  id: string;
  /** "leave" = an approved TA asking to be taken off the request */
  kind: "join" | "leave";
  state: AskState;
  message: string;
  askedAt: string;
  /** null while still waiting */
  decidedAt: string | null;
  request: {
    id: string;
    title: string;
    priority: RequestPriority;
    createdAt: string;
    /** how many TAs the lab manager allows on it, defaults to 1 */
    capacity: number;
    /** TAs already approved on it */
    assignedCount: number;
  };
  ta: Person & {
    id: string;
    /** requests this TA is approved on right now */
    openCount: number;
  };
};
