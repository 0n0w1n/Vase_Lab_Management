import { getCurrentUser } from "@/lib/auth";
import type { AskState, TaAsk } from "@/types/decision";
import type { RequestPriority } from "@/types/request";

// Mock data fix later for backend. Kept in module state so approving and
// declining stick until the dev server restarts.

const HOUR = 60 * 60 * 1000;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - (days * 24 + hours) * HOUR).toISOString();
}

const REQUESTS: Record<string, { title: string; priority: RequestPriority; createdAt: string; capacity: number }> = {
  "1": { title: "Equipment Maintenance", priority: "high", createdAt: ago(9, 1), capacity: 1 },
  "2": { title: "Proteomics Analysis Setup", priority: "high", createdAt: ago(3, 2), capacity: 1 },
  "4": { title: "Lab Access Card — New Research Assistant", priority: "high", createdAt: ago(4, 5), capacity: 2 },
  "5": { title: "some request", priority: "high", createdAt: ago(5, 5), capacity: 1 },
  "6": { title: "some request", priority: "medium", createdAt: ago(6, 7), capacity: 1 },
  "7": { title: "some request", priority: "low", createdAt: ago(12, 9), capacity: 1 },
};

// Same people as the Flask user seeds
const TAS: Record<string, { name: string; initials: string }> = {
  "3": { name: "Bob TA", initials: "BT" },
  "7": { name: "Sarah Jenkins", initials: "SJ" },
};

const ASKS: { id: string; requestId: string; taId: string; message: string; askedAt: string; state: AskState; decidedAt: string | null }[] = [
  { id: "8", requestId: "4", taId: "3", message: "I've set up access cards before.", askedAt: ago(0, 5), state: "waiting", decidedAt: null },
  { id: "7", requestId: "7", taId: "3", message: "Can help with this one too.", askedAt: ago(0, 20), state: "waiting", decidedAt: null },
  { id: "6", requestId: "4", taId: "7", message: "I can take it", askedAt: ago(1), state: "waiting", decidedAt: null },
  { id: "5", requestId: "2", taId: "3", message: "Please let me do this, I've run the proteomics setup last term.", askedAt: ago(2), state: "waiting", decidedAt: null },
  { id: "4", requestId: "7", taId: "7", message: "", askedAt: ago(10), state: "approved", decidedAt: ago(9, 20) },
  { id: "3", requestId: "1", taId: "7", message: "I know this machine.", askedAt: ago(8), state: "declined", decidedAt: ago(7, 22) },
  { id: "2", requestId: "6", taId: "3", message: "", askedAt: ago(6), state: "approved", decidedAt: ago(5, 23) },
  { id: "1", requestId: "5", taId: "3", message: "", askedAt: ago(5), state: "approved", decidedAt: ago(4, 18) },
];

function approvedCount(key: "requestId" | "taId", id: string): number {
  return ASKS.filter((ask) => ask[key] === id && ask.state === "approved").length;
}

/** Every TA ask, newest first */
export async function getDecisions(): Promise<TaAsk[]> {
  return ASKS.map((ask) => ({
    id: ask.id,
    state: ask.state,
    message: ask.message,
    askedAt: ask.askedAt,
    decidedAt: ask.decidedAt,
    request: { id: ask.requestId, ...REQUESTS[ask.requestId], assignedCount: approvedCount("requestId", ask.requestId) },
    ta: { id: ask.taId, ...TAS[ask.taId], openCount: approvedCount("taId", ask.taId) },
  }));
}

/**
 * POST /dashboard/decisions/<id>/<decision>. Returns the Flask error body,
 * or {} on success. The checks below are what the backend will enforce.
 */
export async function decideAsk(id: string, decision: "approve" | "decline"): Promise<{ errorCode?: string }> {
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") return { errorCode: "11" };

  const ask = ASKS.find((item) => item.id === id);
  if (!ask) return { errorCode: "10" };
  if (ask.state !== "waiting") return { errorCode: "31" };
  if (decision === "approve" && approvedCount("requestId", ask.requestId) >= REQUESTS[ask.requestId].capacity) {
    return { errorCode: "30" };
  }

  ask.state = decision === "approve" ? "approved" : "declined";
  ask.decidedAt = new Date().toISOString();
  return {};
}
