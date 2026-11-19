import Link from "next/link";
import { Plus } from "lucide-react";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import { formatDate } from "@/utils/format";
import RequestActions from "@/components/request/RequestActions";
import UrlFilter from "@/components/ui/UrlFilter";
import UrlSearch from "@/components/ui/UrlSearch";
import { getCurrentUser, type User } from "@/lib/auth";
import { canEditRequest, getRequests } from "@/lib/requests";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "@/types/request";
import { ASK_STATES } from "@/types/decision";
import { cn } from "cn";
import VideoPlayer from "@/components/test/video";
import PageHeader from "@/components/layout/PageHeader";

export const metadata = {
  title: "Manage Requests",
};

// Shared button look for the header actions.
const actionButton =
  "flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold transition-colors hover:bg-sidebar/85";

// One column template shared by the header row and every data row,
// so the two stay aligned by construction instead of by coincidence.
// Below the @2xl container width each row becomes a small stacked card
// (ID + status / title / priority + deadline) instead of a squashed table.
const rowColumns =
  "grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 @2xl:grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_7rem]";

// Where each cell sits in the narrow card; @2xl: puts them back in table order.
const cell = {
  topLeft: "row-start-1 @2xl:row-auto",
  topRight: "col-start-2 row-start-1 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:justify-self-auto",
  main: "col-span-2 row-start-2 @2xl:col-span-1 @2xl:row-auto",
  bottomLeft: "row-start-3 @2xl:row-auto",
  bottomRight: "col-start-2 row-start-3 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:justify-self-auto",
};

// "none" = the TA hasn't asked to work on it (workOnStatus is null).
const WORK_ON_CHOICES = [...ASK_STATES, "none"] as const;
const WORK_ON_LABELS: Record<(typeof WORK_ON_CHOICES)[number], string> = {
  waiting: "Waiting",
  approved: "Approved",
  declined: "Declined",
  none: "Not asked",
};

type Request = Awaited<ReturnType<typeof getRequests>>[number];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ManageRequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  // Anything that isn't a known value (typo, hand-edited URL) means no filter.
  const status = REQUEST_STATUSES.find((value) => value === params.status);
  const priority = REQUEST_PRIORITIES.find((value) => value === params.priority);
  // Free-text search over title and ID ("12", "REQ-12" and "req12" all match request 12).
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const [allRequests, user] = await Promise.all([getRequests(), getCurrentUser()]);
  // Only TAs get workOnStatus back from the API, so only they can filter on it.
  const isTa = user?.role === "lab_ta";
  const workOnStatus = isTa
    ? WORK_ON_CHOICES.find((value) => value === params.workOnStatus)
    : undefined;

  const requests = allRequests.filter(
    (request) =>
      (!status || request.status === status) &&
      (!priority || request.priority === priority) &&
      (!workOnStatus || (request.workOnStatus ?? "none") === workOnStatus) &&
      (!query || matchesQuery(request, query))
  );

  return (
    // Glow and padding come from AppShell.
    <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Manage Request"
          actions={
            // A single link styled as a button — not a button wrapping a link.
            <Link href="/request/new" className={cn(actionButton, "text-brand")}>
              <Plus className="size-3.5" />
              New Request
            </Link>
          }
        />

        <div className="@container rounded-3xl bg-white/60 p-3 pb-8 ring-3 ring-black/10 backdrop-blur-xl sm:p-4 sm:pb-12">
          {/* Toolbar: search on the left, filters on the right; stacks when narrow */}
          <div className="flex flex-col gap-3 pb-4 @xl:flex-row @xl:items-center @xl:justify-between">
            <UrlSearch placeholder="Search title or REQ-ID" className="w-full @xl:max-w-72" />
            <div className="flex flex-wrap items-center gap-2">
              {isTa && (
                <UrlFilter
                  param="workOnStatus"
                  label="Work On"
                  options={WORK_ON_CHOICES}
                  optionPill={(value) => WORK_ON_LABELS[value]}
                />
              )}
              <UrlFilter
                param="status"
                label="Status"
                options={REQUEST_STATUSES}
                optionPill={(value) => <StatusPill status={value} />}
              />
              <UrlFilter
                param="priority"
                label="Priority"
                options={REQUEST_PRIORITIES}
                optionPill={(value) => <PriorityDot priority={value} className="text-xs" />}
              />
            </div>
          </div>

          <TableHeaderRow />
          <ul className="flex flex-col gap-2 @2xl:gap-1 @2xl:pt-2">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} user={user} />
            ))}
          </ul>
          {requests.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {status || priority || workOnStatus || query
                ? "No requests match these filters."
                : "No requests yet."}
            </p>
          )}
        </div>
    </div>
  );
}

function matchesQuery(request: Request, query: string) {
  if (request.title.toLowerCase().includes(query)) return true;
  const id = query.replace(/^req-?/, "");
  return id !== "" && String(request.id) === id;
}

function TableHeaderRow() {
  return (
    <div
      className={cn(
        "hidden @2xl:grid",
        rowColumns,
        "rounded-lg bg-black/10 py-2.5 pr-12 text-[0.6rem] font-bold tracking-wide"
      )}
    >
      <span>REQUEST ID</span>
      <span>TITLE</span>
      <span>STATUS</span>
      <span>PRIORITY</span>
      <span>DATE DEADLINE</span>
    </div>
  );
}

function RequestRow({ request, user }: { request: Request; user: User | null }) {
  return (
    <li className="group relative">
      <Link
        href={`/request/${request.id}`}
        className={cn(
          "grid",
          rowColumns,
          // pr-12 reserves room for the ⋮ actions button so it never covers a cell.
          "rounded-lg bg-white py-3 pr-12 ring-1 ring-black/5 hover:ring-black/30 @2xl:py-4"
        )}
      >
        <span className={cn(cell.topLeft, "text-sm font-bold text-[#4F46E5]")}>
          REQ-{request.id}
        </span>
        <p className={cn(cell.main, "min-w-0 text-sm font-semibold break-words")}>{request.title}</p>
        <StatusPill status={request.status} className={cn(cell.topRight, "w-fit")} />
        <PriorityDot priority={request.priority} className={cell.bottomLeft} />
        <DeadlineCell deadline={request.deadline} className={cell.bottomRight} />
      </Link>
      {canEditRequest(user, request) && <RequestActions request={request} variant="hover" role={user!.role} />}
    </li>
  );
}

function DeadlineCell({ deadline, className }: { deadline: string | null | undefined; className?: string }) {
  if (!deadline) {
    // The dash only makes sense under a column header, so the card view drops it.
    return <span className={cn(className, "hidden text-sm text-muted-foreground @2xl:inline")}>—</span>;
  }
  return (
    <time dateTime={deadline} className={cn(className, "text-sm text-muted-foreground")}>
      <span className="@2xl:hidden">Due </span>
      {formatDate(deadline)}
    </time>
  );
}