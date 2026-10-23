import { authFetch } from "@/lib/auth";
import type { TaAsk } from "@/types/decision";

/** Every TA ask, newest first */
export async function getDecisions(): Promise<TaAsk[]> {
  const res = await authFetch("/dashboard/decisions", { cache: "no-store" });
  if (!res.ok) throw new Error(`Get dashboard decisions failed: ${res.status}`);
  return res.json();
}

/**
 * POST /dashboard/decisions/<requestId-userId>/<decision>.
 * Returns the Flask error code, or {} on success.
 */
export async function decideAsk(id: string, decision: "approve" | "decline"): Promise<{ errorCode?: string }> {
  const res = await authFetch(`/dashboard/decisions/${encodeURIComponent(id)}/${decision}`, {
    method: "POST",
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { errorCode: String(body?.errorCode ?? "unknown") };
  }
  return {};
}
