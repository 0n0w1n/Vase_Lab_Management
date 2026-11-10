import BackgroundGlow from "@/components/layout/BackgroundGlow";
// Wrap everythings in relative isolated div to apply background
// And wrap children in div to add consistent padding x-10

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <BackgroundGlow />
      <div className="px-10">{children}</div>
    </div>
  );
}
