import Link from "next/link";
import { notFound } from "next/navigation";
import RequestTabs from "@/components/request/RequestTabs";
import StatusBadge from "@/components/request/StatusBadge";
import { getRequest } from "@/lib/requests";

type Props = {
  children: React.ReactNode;
  params: Promise<{ requestId: string }>;
};

/**
 * Everything above the tab strip is shared by all three tabs, so it lives in
 * the layout and survives navigation between them.
 */
export default async function RequestDetailLayout({ children, params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <nav className="pb-2 text-sm text-muted-foreground">
        <Link href="/Request" className="transition-colors hover:text-foreground">
          Manage Requests
        </Link>
        <span className="px-1.5">&gt;</span>
        <span>Request #{request.id}</span>
      </nav>

      <header className="flex items-start justify-between gap-4 pb-5">
        <h1 className="font-heading text-3xl font-bold">
          Request #{request.id}
        </h1>
        <StatusBadge status={request.status} />
      </header>

      <RequestTabs requestId={request.id} />

      <div className="flex-1 pt-6">{children}</div>
    </div>
  );
}
