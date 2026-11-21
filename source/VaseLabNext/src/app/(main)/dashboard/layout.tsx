import AutoRefresh from "@/components/layout/AutoRefresh";

// Every dashboard view (overview, workload, decisions) stays live while open (SRS-14).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AutoRefresh />
      {children}
    </>
  );
}
