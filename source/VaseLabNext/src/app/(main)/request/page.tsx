import Link from "next/link";
import { Plus } from "lucide-react";
import PriorityDot from "@/components/request/PriorityDot";
import RequestFilters from "@/components/request/RequestFilters";
import StatusPill from "@/components/request/StatusPill";
import { formatDate } from "@/lib/format";
import { getRequests } from "@/lib/requests";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "@/types/request";
import { cn } from "cn";

export const metadata = {
  title: "Manage Requests",
};

// Shared button look for the header actions.
const actionButton =
  "flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold transition-colors hover:bg-sidebar/85";

// One column template shared by the header row and every data row,
// so the two stay aligned by construction instead of by coincidence.
const rowColumns =
  "grid grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_7rem] items-center gap-4 px-4";

type Request = Awaited<ReturnType<typeof getRequests>>[number];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ManageRequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  // Anything that isn't a known value (typo, hand-edited URL) means no filter.
  const status = REQUEST_STATUSES.find((value) => value === params.status);
  const priority = REQUEST_PRIORITIES.find((value) => value === params.priority);

  const requests = (await getRequests()).filter(
    (request) =>
      (!status || request.status === status) &&
      (!priority || request.priority === priority)
  );

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-14">
      <BackgroundGlow />

      <div className="mx-auto max-w-5xl">
        <PageHeader />

        <div className="rounded-3xl bg-white/60 p-4 pb-12 ring-3 ring-black/10 backdrop-blur-xl">
          <RequestFilters status={status} priority={priority} />

          <div className="overflow-x-auto">
            <div className="min-w-[44rem]">
              <TableHeaderRow />
              <ul className="flex flex-col gap-1 pt-2">
                {requests.map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </ul>
              {requests.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {status || priority
                    ? "No requests match these filters."
                    : "No requests yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Decorative blurred blobs behind the page content. Purely cosmetic. */
function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-20 left-[38%] size-80 rounded-full bg-[#5B92F5]/50 blur-sm" />
      <div className="absolute -bottom-28 -left-24 size-96 rounded-full bg-[#93E8C1]/50 blur-sm" />
      <div className="absolute -bottom-20 left-[52%] size-64 rounded-full bg-[#93E8C1]/50 blur-xl" />
      <div className="absolute right-16 bottom-16 size-72 rounded-full bg-[#5B92F5]/50 blur-xl" />
    </div>
  );
}

function PageHeader() {
  return (
    <header className="flex items-end justify-between pb-3">
      <h1 className="text-4xl font-extrabold text-brand">Manage Request</h1>

      {/* A single link styled as a button — not a button wrapping a link. */}
      <Link href="/request/new" className={cn(actionButton, "text-brand")}>
        <Plus className="size-3.5" />
        New Request
      </Link>
    </header>
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
      <span>REQUEST ID</span>
      <span>TITLE</span>
      <span>STATUS</span>
      <span>PRIORITY</span>
      <span>DATE DEADLINE</span>
    </div>
  );
}

function RequestRow({ request }: { request: Request }) {
  return (
    <li>
      <Link
        href={`/request/${request.id}`}
        className={cn(
          rowColumns,
          "rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30"
        )}
      >
        <span className="text-sm font-bold text-[#4F46E5]">
          REQ-{request.id}
        </span>
        <p className="min-w-0 text-sm font-semibold">{request.title}</p>
        <StatusPill status={request.status} />
        <PriorityDot priority={request.priority} />
        <DeadlineCell deadline={request.deadline} />
      </Link>
    </li>
  );
}

function DeadlineCell({ deadline }: { deadline: string | null | undefined }) {
  if (!deadline) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <time dateTime={deadline} className="text-sm text-muted-foreground">
      {formatDate(deadline)}
    </time>
  );
}