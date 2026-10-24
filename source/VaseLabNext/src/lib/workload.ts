import { authFetch } from "@/lib/auth";
import type { TaWorkload } from "@/types/workload";

export async function getWorkload(): Promise<TaWorkload[]> {
  const res = await authFetch("/dashboard/workload", { cache: "no-store" });
  if (!res.ok) throw new Error(`Get workload failed: ${res.status}`);
  return res.json();
}
