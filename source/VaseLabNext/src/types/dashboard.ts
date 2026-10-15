import type { RequestPriority, RequestStatus } from "@/types/request";

/** One row of the Current table */
export type DashboardRequest = {
  id: string;
  title: string;
  requestedBy: string;
  status: RequestStatus;
  priority: RequestPriority;
  /** linked to equipment */
  isEquipment: boolean;
  /** TA handling it, null = unassigned */
  owner: string | null;
  createdAt: string;
};

export type Dashboard = {
  stats: {
    /** pending + in-progress + review */
    totalActive: number;
    pendingApproval: number;
    inProgress: number;
    completedThisMonth: number;
  };
  requests: DashboardRequest[];
};
