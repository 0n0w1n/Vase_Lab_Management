import AppSidebar from "@/components/layout/AppSidebar";
import type { User } from "@/lib/auth";

// ## Main Layout ##
// flex layout
// Atleast min height of the screen
// using bg color canvas

// ## Children Layout ##
// flex layout fill container
// flex box start with min-width: auto (prevent box shrinking lesser than its content)
// min-width: 0 allow the box to shrink and cut the overflowing content or whatever

type Props = {
  user: User;
  children: React.ReactNode;
};

export default function AppShell({ user, children }: Props) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
