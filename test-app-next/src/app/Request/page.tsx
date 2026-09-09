import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PriorityLabel from "@/components/request/PriorityLabel";
import StatusBadge from "@/components/request/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { getRequests } from "@/lib/requests";

export const metadata = {
  title: "Manage Requests",
};

export default async function ManageRequestsPage() {
  const requests = await getRequests();

  return (
    <div>
      <header className="flex items-center justify-between pb-6">
        <h1 className="font-heading text-3xl font-bold">Manage Requests</h1>
        <p className="text-sm text-muted-foreground">
          {requests.length} requests
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              href={`/Request/${request.id}`}
              className="flex items-center gap-4 rounded-xl bg-background px-5 py-4 ring-1 ring-surface-border transition-shadow hover:ring-brand"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Request #{request.id}
                </p>
                <p className="truncate font-semibold">{request.title}</p>
                <p className="pt-1 text-sm text-muted-foreground">
                  {request.requestedBy} · {formatDateTime(request.submittedAt)}
                </p>
              </div>
              <PriorityLabel priority={request.priority} className="text-sm" />
              <StatusBadge status={request.status} />
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
