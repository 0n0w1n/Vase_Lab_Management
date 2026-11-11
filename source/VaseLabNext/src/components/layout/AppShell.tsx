import AppSidebar from "@/components/layout/AppSidebar";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import type { User } from "@/lib/auth";

// ## Main Layout ##
// flex layout
// Atleast min height of the screen
// using bg color canvas

// ## Children Layout ##
// flex layout fill container
// flex box start with min-width: auto (prevent box shrinking lesser than its content)
// min-width: 0 allow the box to shrink and cut the overflowing content or whatever
// Glow and page padding live here so every page gets the same frame;
// pages only pick their width (mx-auto max-w-*)

type Props = {
  user: User;
  children: React.ReactNode;
};

export default function AppShell({ user, children }: Props) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar user={user} />
      <main className="relative isolate min-w-0 flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-10 lg:py-14">
        <BackgroundGlow />
        {children}
      </main>
    </div>
  );
}
