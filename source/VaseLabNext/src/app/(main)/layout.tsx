import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";

// Every page inside the (app) group is a logged-in page, so they all share the sidebar.
// Not logged in? Send them to the (auth) group's login page instead.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell user={user}>{children}</AppShell>;
}
