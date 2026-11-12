import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import DecisionButtons from "@/components/dashboard/DecisionButtons";
import StatCard from "@/components/dashboard/StatCard";
import TaWorkload from "@/components/dashboard/TaWorkload";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import { getCurrentUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { getDecisions } from "@/lib/decisions";
import { getWorkload } from "@/lib/workload";
import { formatDate, timeAgo, timePassed } from "@/lib/format";
import type { DashboardRequest } from "@/types/dashboard";
import { cn } from "cn";

export const metadata = {
  title: "Operational Dashboard",
};

const rowColumns = "grid grid-cols-[minmax(0,1fr)_6rem_7rem_6rem_5.5rem_5.5rem] items-center gap-4 px-4";

const cardLink = "rounded-2xl transition-shadow hover:shadow-md";

// Which list the table shows, picked by clicking a stat card
const VIEWS = {
  active: { title: "Current", empty: "No active requests." },
  "in-progress": { title: "In Progress", empty: "Nothing is in progress right now." },
  completed: { title: "Completed This Month", empty: "Nothing has been completed this month yet." },
} as const;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  // Lab managers only
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") redirect("/request");

  // The view lives in the URL so a refresh keeps it; anything unknown means all active
  const requested = (await searchParams).view;
  const view: keyof typeof VIEWS =
    requested === "in-progress" || requested === "completed" ? requested : "active";

  const { stats, requests, completed } = await getDashboard();
  const shown =
    view === "completed"
      ? completed
      : view === "in-progress"
        ? requests.filter((request) => request.status === "in-progress")
        : requests;
  // The decisions list feeds the preview; the dashboard API supplies the count.
  const waitingAsks = (await getDecisions()).filter((ask) => ask.state === "waiting");
  const pendingApproval = stats.pendingApproval;
  const workload = await getWorkload();

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-4 py-14 sm:px-8">
      <BackgroundGlow />

      <div className="@container relative mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h1 className="text-4xl font-extrabold text-brand">Operational Dashboard</h1>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10">
            <CalendarDays className="size-4" />
            Today, {formatDate(new Date().toISOString())}
          </p>
        </header>

        {/* Stat cards*/}
        {/* Three cards filter the table below (outlined = selected); Pending Approval opens Decisions */}
        <div className="grid grid-cols-2 gap-4 pb-8 lg:grid-cols-4">
          <Link href="/dashboard" scroll={false} aria-current={view === "active" ? "page" : undefined} className={cardLink}>
            <StatCard label="Total Active Requests" value={stats.totalActive} selected={view === "active"} />
          </Link>
          <Link href="/dashboard/decisions" className={cardLink}>
            <StatCard label="Pending Approval" value={pendingApproval} urgent={pendingApproval > 0} />
          </Link>
          <Link
            href="/dashboard?view=in-progress"
            scroll={false}
            aria-current={view === "in-progress" ? "page" : undefined}
            className={cardLink}
          >
            <StatCard label="In Progress" value={stats.inProgress} selected={view === "in-progress"} />
          </Link>
          <Link
            href="/dashboard?view=completed"
            scroll={false}
            aria-current={view === "completed" ? "page" : undefined}
            className={cardLink}
          >
            <StatCard label="Completed This Month" value={stats.completedThisMonth} selected={view === "completed"} />
          </Link>
        </div>

        {/* Panels sit beside the table only when the content area fits both (72rem); otherwise they stack below it */}
        <div className="grid gap-6 @6xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Current table*/}
          {/* min-w-0: a grid item won't shrink below the 48rem table otherwise, so it would
              overflow the page (clipped) instead of scrolling inside its own box */}
          <section className="min-h-96 min-w-0 rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
            <h2 className="pb-4 text-xl font-bold">{VIEWS[view].title}</h2>

            <div className="overflow-x-auto">
              <div className="min-w-[48rem]">
                <TableHeaderRow />
                <ul className="flex flex-col gap-1 pt-2">
                  {shown.map((request) => (
                    <RequestRow key={request.id} request={request} />
                  ))}
                </ul>
                {shown.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {VIEWS[view].empty}
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
                  // A TA's join ask and leave ask share an id
                  <li key={`${ask.kind}-${ask.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold">
                      {ask.ta.name} {ask.kind === "leave" ? "wants to leave" : "wants"}{" "}
                      <Link href={`/request/${ask.request.id}`} className="font-bold text-[#4F46E5] hover:underline">
                        REQ-{ask.request.id}
                      </Link>
                    </p>
                    <p className="truncate pt-0.5 text-xs text-muted-foreground">{ask.request.title}</p>
                    <p className="text-xs text-muted-foreground">asked {timeAgo(ask.askedAt)}</p>
                    <div className="pt-3">
                      {/* Letting someone leave frees a slot, so "full" only blocks join asks */}
                      <DecisionButtons
                        askId={ask.id}
                        full={ask.kind === "join" && ask.request.assignedCount >= ask.request.capacity}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {waitingAsks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No TA requests waiting.</p>
              )}
            </section>
            <TaWorkload workload={workload} />
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
