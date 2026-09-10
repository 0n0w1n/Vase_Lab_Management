import AppSidebar from "@/components/layout/AppSidebar";

export default function AppShell({children}:{children : React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
