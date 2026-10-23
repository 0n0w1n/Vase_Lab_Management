import type { Dashboard } from "@/types/dashboard";
import { authFetch } from "@/lib/auth";

export async function getDashboard(): Promise<Dashboard> {
  const res = await authFetch("/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`Get dashboard failed: ${res.status}`);
  return res.json();
}
