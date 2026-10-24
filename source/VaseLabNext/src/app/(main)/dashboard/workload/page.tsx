import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import InitialsAvatar from "@/components/request/InitialsAvatar";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import { getCurrentUser } from "@/lib/auth";
import { getWorkload } from "@/lib/workload";
import { formatDate, timeAgo, timePassed } from "@/lib/format";

export const metadata = { title: "TA Workload" };

const rowColumns = "grid grid-cols-[minmax(0,1fr)_7rem_7rem_6rem_7rem_7rem] items-center gap-4 px-4";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WorkloadPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") redirect("/request");

  const workload = await getWorkload();
  const { ta: taId } = await searchParams;
  const selected = workload.find((ta) => ta.id === taId) ?? workload[0];
  const maximum = Math.max(1, ...workload.map((ta) => ta.openCount));

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-8 py-14">
      <BackgroundGlow />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">Operational Dashboard</Link>
              <span className="px-1.5">/</span><span aria-current="page">TA Workload</span>
            </nav>
            <h1 className="pt-1 text-4xl font-extrabold text-brand">TA Workload</h1>
          </div>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10">
            <CalendarDays className="size-4" />Today, {formatDate(new Date().toISOString())}
          </p>
        </header>

        <section aria-label="TA workloads" className="rounded-3xl bg-white/60 p-5 ring-1 ring-black/10 backdrop-blur-xl">
          <div className="flex gap-4 overflow-x-auto p-0.5 pb-1">
            {workload.map((ta) => (
              <article key={ta.id} className={cn("min-w-64 flex-1 rounded-2xl bg-white/70 p-4 ring-1", selected?.id === ta.id ? "ring-brand" : "ring-black/10")}>
                <header className="flex items-center gap-3">
                  <InitialsAvatar initials={ta.initials} className="size-9" />
                  <h2 className="min-w-0 flex-1 truncate font-bold">{ta.name}</h2>
                  <span className={cn("rounded-full px-2 py-1 text-[0.6rem] font-bold", ta.openCount ? "bg-blue-100 text-blue-700" : "bg-brand-soft text-teal-700")}>
                    {ta.openCount ? "WORKING" : "FREE"}
                  </span>
                </header>
                <p className="py-4"><span className="text-4xl font-bold">{ta.openCount}</span><span className="pl-2 text-xs text-muted-foreground">open requests</span></p>
                <progress aria-label={`${ta.name}: open requests`} value={ta.openCount} max={maximum} className="block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-black/5 [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand" />
                <dl className="grid grid-cols-2 gap-2 py-3">
                  {[
                    ["High priority", ta.highPriority],
                    ["Oldest open", ta.oldestOpen ? timePassed(ta.oldestOpen) : "—"],
                    ["Closed this month", ta.closedThisMonth],
                    ["Asks waiting", ta.asksWaiting],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-black/3 p-2.5">
                      <dt className="text-[0.6rem] text-muted-foreground">{label}</dt>
                      <dd className="font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/dashboard/workload?ta=${ta.id}`} scroll={false} aria-current={selected?.id === ta.id ? "true" : undefined} className="block rounded-lg bg-white px-3 py-3 text-center text-xs font-semibold ring-1 ring-black/15 hover:ring-brand">
                  {selected?.id === ta.id ? "Showing their requests" : "Show their requests"}
                </Link>
              </article>
            ))}
          </div>
          {workload.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No TAs available.</p>}
        </section>

        <section className="mt-8 min-h-96 rounded-3xl bg-white/60 p-5 ring-3 ring-black/10 backdrop-blur-xl">
          <h2 className="pb-4 text-xl font-bold">{selected ? `${selected.name}'s Requests` : "Requests"}</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[48rem]">
              <div className={cn(rowColumns, "rounded-lg bg-black/10 py-3 text-[0.6rem] font-bold tracking-wide")}>
                <span>REQUEST</span><span>TA</span><span>STATUS</span><span>PRIORITY</span><span>TIME PASSED</span><span>LAST UPDATE</span>
              </div>
              <ul className="flex flex-col gap-2 pt-2">
                {selected?.requests.map((request) => (
                  <li key={request.id}>
                    <Link href={`/request/${request.id}`} className={cn(rowColumns, "rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30")}>
                      <div className="min-w-0"><p className="text-sm font-bold text-[#4F46E5]">REQ-{request.id}</p><p className="truncate text-xs font-semibold">{request.title}</p></div>
                      <span className="truncate text-sm">{selected.name}</span>
                      <StatusPill status={request.status} />
                      <PriorityDot priority={request.priority} />
                      <span className="text-sm">{timePassed(request.createdAt)}</span>
                      <span className="text-sm text-muted-foreground">{timeAgo(request.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!selected?.requests.length && <p className="py-10 text-center text-sm text-muted-foreground">No open requests.</p>}
        </section>
      </div>
    </div>
  );
}
