import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Operational Dashboard",
};

export default async function DashboardPage() {
  // Lab managers only
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") redirect("/request");

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-8 py-14">
      <BackgroundGlow />

      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h1 className="text-4xl font-extrabold text-brand">Operational Dashboard</h1>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10">
            <CalendarDays className="size-4" />
            Today, {formatDate(new Date().toISOString())}
          </p>
        </header>

        {/* Stat cards*/}
        <div className="grid grid-cols-2 gap-4 pb-8 lg:grid-cols-4">
          {["Total Active", "Pending Approval", "In Progress", "Completed"].map((label) => (
            <div key={label} className="h-28 rounded-2xl bg-white/60 ring-1 ring-black/5" />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Current table*/}
          <section className="min-h-96 rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Current</h2>
          </section>

          {/* Awaiting Decisions + TA Workload*/}
          <div className="flex flex-col gap-6">
            <section className="h-64 rounded-3xl bg-white/60 ring-3 ring-black/10 backdrop-blur-xl" />
            <section className="h-48 rounded-3xl bg-white/60 ring-3 ring-black/10 backdrop-blur-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
