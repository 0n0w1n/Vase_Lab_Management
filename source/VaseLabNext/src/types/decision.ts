import type { Person, RequestPriority } from "@/types/request";

export type AskState = "waiting" | "approved" | "declined";

/** One TA asking the lab manager to work on a request (GET /dashboard/decisions) */
export type TaAsk = {
  id: string;
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
