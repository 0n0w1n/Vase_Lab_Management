import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import DecisionButtons from "@/components/dashboard/DecisionButtons";
import StatCard from "@/components/dashboard/StatCard";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import { getCurrentUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { getDecisions } from "@/lib/decisions";
import { formatDate, timeAgo, timePassed } from "@/lib/format";
import type { DashboardRequest } from "@/types/dashboard";
import { cn } from "cn";

export const metadata = {
  title: "Operational Dashboard",
};

const rowColumns = "grid grid-cols-[minmax(0,1fr)_6rem_7rem_6rem_5.5rem_5.5rem] items-center gap-4 px-4";

export default async function DashboardPage() {
  // Lab managers only
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") redirect("/request");

  const { stats, requests } = await getDashboard();
  // The decisions list feeds the preview; the dashboard API supplies the count.
  const waitingAsks = (await getDecisions()).filter((ask) => ask.state === "waiting");
  const pendingApproval = stats.pendingApproval;

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-8 py-14">
      <BackgroundGlow />

      <div className="relative mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h1 className="text-4xl font-extrabold text-brand">Operational Dashboard</h1>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10">
            <CalendarDays className="size-4" />
            Today, {formatDate(new Date().toISOString())}
          </p>
        </header>

        {/* Stat cards*/}
        <div className="grid grid-cols-2 gap-4 pb-8 lg:grid-cols-4">
          <StatCard label="Total Active Requests" value={stats.totalActive} />
          <Link href="/dashboard/decisions" className="rounded-2xl transition-shadow hover:shadow-md">
            <StatCard
              label="Pending Approval"
              value={pendingApproval}
              alert={pendingApproval > 0 ? "Action Required" : undefined}
            />
          </Link>
          <StatCard label="In Progress" value={stats.inProgress} />
          <StatCard label="Completed This Month" value={stats.completedThisMonth} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Current table*/}
          <section className="min-h-96 rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
            <h2 className="pb-4 text-xl font-bold">Current</h2>

            <div className="overflow-x-auto">
              <div className="min-w-[48rem]">
                <TableHeaderRow />
                <ul className="flex flex-col gap-1 pt-2">
                  {requests.map((request) => (
                    <RequestRow key={request.id} request={request} />
                  ))}
                </ul>
                {requests.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No active requests.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Awaiting Decisions + TA Workload*/}
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
              <header className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold tracking-wide">AWAITING DECISIONS</h2>
                <Link
                  href="/dashboard/decisions"
                  className="flex items-center gap-1 rounded-lg bg-sidebar px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sidebar/85"
                >
                  View all
                  <ChevronRight className="size-3.5" />
                </Link>
              </header>

              {/* Newest two only; View all has the rest */}
              <ul className="flex flex-col gap-3 pt-4">
                {waitingAsks.slice(0, 2).map((ask) => (
                  <li key={ask.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold">
                      {ask.ta.name} wants{" "}
                      <Link href={`/request/${ask.request.id}`} className="font-bold text-[#4F46E5] hover:underline">
                        REQ-{ask.request.id}
                      </Link>
                    </p>
                    <p className="truncate pt-0.5 text-xs text-muted-foreground">{ask.request.title}</p>
                    <p className="text-xs text-muted-foreground">asked {timeAgo(ask.askedAt)}</p>
                    <div className="pt-3">
                      <DecisionButtons askId={ask.id} full={ask.request.assignedCount >= ask.request.capacity} />
                    </div>
                  </li>
                ))}
              </ul>
              {waitingAsks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No TA requests waiting.</p>
              )}
            </section>
            <section className="h-48 rounded-3xl bg-white/60 ring-3 ring-black/10 backdrop-blur-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TableHeaderRow() {
  return (
    <div
      className={cn(
        rowColumns,
        "rounded-lg bg-black/10 py-2.5 text-[0.6rem] font-bold tracking-wide"
      )}
    >
      <span>REQUEST</span>
      <span>REQUESTER</span>
      <span>STATUS</span>
      <span>OWNER</span>
      <span>PRIORITY</span>
      <span>TIME PASSED</span>
    </div>
  );
}

function RequestRow({ request }: { request: DashboardRequest }) {
  const unassigned = !request.owner;

  return (
    <li>
      <Link
        href={`/request/${request.id}`}
        className={cn(
          rowColumns,
          "rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30"
        )}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#4F46E5]">REQ-{request.id}</span>
            {request.isEquipment && (
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
                Equipment
              </span>
            )}
          </p>
          <p className="truncate text-xs font-semibold">{request.title}</p>
        </div>
        <span className="truncate text-xs">{request.requestedBy}</span>
        <StatusPill status={request.status} />
        <span className={cn("text-sm", unassigned && "font-semibold text-red-600")}>
          {request.owner ?? "Unassigned"}
        </span>
        <PriorityDot priority={request.priority} />
        <span className={cn("text-sm", unassigned && "font-semibold text-red-600")}>
          {timePassed(request.createdAt)}
        </span>
      </Link>
    </li>
  );
}
