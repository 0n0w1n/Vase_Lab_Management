import type { Dashboard } from "@/types/dashboard";

const HOUR = 60 * 60 * 1000;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - (days * 24 + hours) * HOUR).toISOString();
}

//mock data fix later for backend
export async function getDashboard(): Promise<Dashboard> {
  return {
    stats: {
      totalActive: 6,
      pendingApproval: 2,
      inProgress: 4,
      completedThisMonth: 67,
    },
    requests: [
      { id: "1", title: "Equipment Maintenance", requestedBy: "Someone", status: "review", priority: "high", isEquipment: true, owner: "Non", createdAt: ago(9, 1) },
      { id: "2", title: "Proteomics Analysis Setup", requestedBy: "Someone", status: "pending", priority: "high", isEquipment: false, owner: null, createdAt: ago(3, 2) },
      { id: "4", title: "Lab access card new research assistance", requestedBy: "Someone", status: "pending", priority: "high", isEquipment: false, owner: null, createdAt: ago(4, 5) },
      { id: "5", title: "some request", requestedBy: "Someone", status: "in-progress", priority: "high", isEquipment: false, owner: "Non", createdAt: ago(5, 5) },
      { id: "6", title: "some request", requestedBy: "Someone", status: "in-progress", priority: "medium", isEquipment: true, owner: "Non", createdAt: ago(6, 7) },
      { id: "7", title: "some request", requestedBy: "Someone", status: "in-progress", priority: "low", isEquipment: false, owner: "Po", createdAt: ago(12, 9) },
    ],
  };
}
