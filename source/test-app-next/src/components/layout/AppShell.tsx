import AppSidebar from "@/components/layout/AppSidebar";

// ## Main Layout ##
// flex layout
// Atleast min height of the screen
// using bg color canvas

// ## Children Layout ##
// flex layout fill container
// flex box start with min-width: auto (prevent box shrinking lesser than its content)
// min-width: 0 allow the box to shrink and cut the overflowing content or whatever

export default function AppShell({children}:{children : React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
