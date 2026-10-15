export type Dashboard = {
  stats: {
    /** pending + in-progress + review */
    totalActive: number;
    pendingApproval: number;
    inProgress: number;
    completedThisMonth: number;
  };
};
