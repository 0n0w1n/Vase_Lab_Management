import type { Dashboard } from "@/types/dashboard";

//mock data fix later for backend
export async function getDashboard(): Promise<Dashboard> {
  return {
    stats: {
      totalActive: 6,
      pendingApproval: 2,
      inProgress: 4,
      completedThisMonth: 67,
    },
  };
}
