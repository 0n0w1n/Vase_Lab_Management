import AppSidebar from "@/components/layout/AppSidebar";

type Props = {
  children: React.ReactNode;
};

/**
 * The frame every signed-in screen sits in: fixed sidebar on the left, one
 * rounded content panel on the right that each page fills however it likes.
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="min-w-0 flex-1 p-6">
        <div className="min-h-[calc(100vh-3rem)] rounded-2xl bg-surface px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
