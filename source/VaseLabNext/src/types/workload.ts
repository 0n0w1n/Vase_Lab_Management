import type { RequestPriority, RequestStatus } from "@/types/request";

export type WorkloadRequest = {
  id: string;
  title: string;
  status: RequestStatus;
  priority: RequestPriority;
  createdAt: string;
  updatedAt: string;
};

export type TaWorkload = {
  id: string;
  name: string;
  initials: string;
  openCount: number;
  highPriority: number;
  oldestOpen: string | null;
  closedThisMonth: number;
  asksWaiting: number;
  requests: WorkloadRequest[];
};
