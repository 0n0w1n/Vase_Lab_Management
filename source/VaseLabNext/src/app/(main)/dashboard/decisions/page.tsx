import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import DecisionButtons from "@/components/dashboard/DecisionButtons";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import InitialsAvatar from "@/components/request/InitialsAvatar";
import PriorityDot from "@/components/request/PriorityDot";
import { getCurrentUser } from "@/lib/auth";
import { getDecisions } from "@/lib/decisions";
import { formatDate, timeAgo, timePassed } from "@/lib/format";
import type { TaAsk } from "@/types/decision";
import { cn } from "cn";

export const metadata = {
  title: "Awaiting Decisions",
};

const rowColumns = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem] gap-6 px-4";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DecisionsPage({ searchParams }: Props) {
  // Lab managers only
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager") redirect("/request");

  // The tab lives in the URL so a refresh keeps it; anything unknown means Waiting.
  const showDecided = (await searchParams).tab === "decided";
  const asks = await getDecisions();
  const waiting = asks.filter((ask) => ask.state === "waiting");
  const decided = asks.filter((ask) => ask.state !== "waiting");
  const shown = showDecided ? decided : waiting;

  // One row per request with every TA asking for it, so the manager can compare
  // them. Map keeps insertion order, so the request with the newest ask comes first.
  const byRequest = new Map<string, TaAsk[]>();
  for (const ask of shown) {
    byRequest.set(ask.request.id, [...(byRequest.get(ask.request.id) ?? []), ask]);
  }

  const tabs = [
    { label: `Waiting · ${waiting.length}`, href: "/dashboard/decisions", active: !showDecided },
    { label: `Decided · ${decided.length}`, href: "/dashboard/decisions?tab=decided", active: showDecided },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden px-8 py-14">
      <BackgroundGlow />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                Operational Dashboard
              </Link>
              <span className="px-1.5">/</span>
              <span aria-current="page">Awaiting Decisions</span>
            </nav>
            <h1 className="pt-1 text-4xl font-extrabold text-brand">Awaiting Decisions</h1>
          </div>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10">
            <CalendarDays className="size-4" />
            Today, {formatDate(new Date().toISOString())}
          </p>
        </header>

        <section className="min-h-96 rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <h2 className="text-xl font-bold">TA Requests</h2>
            <nav className="flex gap-1 rounded-lg bg-black/5 p-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={tab.active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    tab.active ? "bg-sidebar text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[48rem]">
              <div className={cn(rowColumns, "rounded-lg bg-black/10 py-2.5 text-[0.6rem] font-bold tracking-wide")}>
                <span>REQUEST</span>
                <span>ASKED BY</span>
                <span className="text-right">DECISION</span>
              </div>
              <ul className="flex flex-col gap-1 pt-2">
                {Array.from(byRequest.values()).map((requestAsks) => (
                  <RequestRow key={requestAsks[0].request.id} asks={requestAsks} />
                ))}
              </ul>
              {shown.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {showDecided ? "No decisions yet." : "No TA requests waiting for a decision."}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RequestRow({ asks }: { asks: TaAsk[] }) {
  const { request } = asks[0];
  const full = request.assignedCount >= request.capacity;

  return (
    <li className={cn(rowColumns, "rounded-lg bg-white py-4 ring-1 ring-black/5")}>
      <div className="min-w-0">
        {/* Only the name is a link: the row also holds buttons, which can't sit inside a link */}
        <Link href={`/request/${request.id}`} className="group block w-fit max-w-full">
          <span className="text-sm font-bold text-[#4F46E5] group-hover:underline">REQ-{request.id}</span>
          <p className="truncate text-sm font-semibold group-hover:underline">{request.title}</p>
        </Link>
        <p className="flex flex-wrap items-center gap-x-1.5 pt-1 text-xs text-muted-foreground">
          <PriorityDot priority={request.priority} className="text-xs text-foreground" />
          <span>· open {timePassed(request.createdAt)}</span>
          <span className={cn(full && "font-semibold text-foreground")}>
            · {request.assignedCount}/{request.capacity} {request.capacity === 1 ? "TA" : "TAs"}
          </span>
        </p>
      </div>

      {/* Subgrid so every ask lines up with the ASKED BY and DECISION headers */}
      <ul className="col-span-2 grid grid-cols-subgrid gap-y-4">
        {asks.map((ask) => (
          <li
            key={ask.id}
            className="col-span-2 grid grid-cols-subgrid border-t border-black/5 pt-4 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <InitialsAvatar initials={ask.ta.initials} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ask.ta.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ask.ta.openCount} open now · asked {timeAgo(ask.askedAt)}
                  </p>
                </div>
              </div>
              {ask.message && <p className="mt-2 rounded-md bg-black/5 px-3 py-2 text-xs">{ask.message}</p>}
            </div>

            <div className="flex justify-end">
              {ask.state === "waiting" ? (
                <DecisionButtons askId={ask.id} full={full} />
              ) : (
                <span
                  className={cn(
                    "h-fit rounded-md px-3 py-1.5 text-xs font-semibold",
                    ask.state === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  )}
                >
                  {ask.state === "approved" ? "Approved" : "Declined"}
                  {ask.decidedAt && ` · ${timeAgo(ask.decidedAt)}`}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </li>
  );
}
