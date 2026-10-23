import Link from "next/link";
import { notFound } from "next/navigation";
import RequestTabs from "@/components/request/RequestTabs";
import StatusBadge from "@/components/request/StatusBadge";
import WorkOnButton from "@/components/request/WorkOnButton";
import { getCurrentUser } from "@/lib/auth";
import { getRequest } from "@/lib/requests";
import type { LabRequest } from "@/types/request";
import { cn } from "cn";

type Props = {
  children: React.ReactNode;
  params: Promise<{ requestId: string }>;
};

/**
 * Page shell for the three request tabs. The background, the page header and
 * the card itself live here, so only what is inside the card swaps out when
 * navigating between Detail / Activity History / Message Log.
 */
export default async function RequestDetailLayout({ children, params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  const user = await getCurrentUser();

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-12">
      <BackgroundGlow />

      <div className="mx-auto max-w-5xl px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link
            href="/request"
            className="transition-colors hover:text-foreground"
          >
            Manage Requests
          </Link>
          <span className="px-1.5">/</span>
          <span aria-current="page">Request #{request.id}</span>
        </nav>
        <h1 className="pt-1 text-4xl font-extrabold text-brand">
          Request #{request.id}
        </h1>

        <section className="mt-10 rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
          <header className="flex items-start justify-between gap-4 pb-5">
            <h2 className="font-heading text-2xl font-bold text-[#44607F]">
              Request #{request.id}
            </h2>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {user?.role === "lab_ta" && <WorkOnStatus request={request} />}
              <StatusBadge status={request.status} />
            </div>
          </header>

          <RequestTabs requestId={request.id} />

          <div className="pt-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

const ASK_CHIPS = {
  waiting: { label: "Asked · waiting", className: "text-muted-foreground ring-surface-border" },
  approved: { label: "You're on this", className: "text-emerald-700 ring-emerald-500" },
  declined: { label: "Declined", className: "text-red-700 ring-red-400" },
};

/** TA only: the Work on button, or where their ask stands once they've sent one. */
function WorkOnStatus({ request }: { request: LabRequest }) {
  if (request.status === "close" || request.status === "reject") return null;

  const chip = request.myAsk
    ? ASK_CHIPS[request.myAsk]
    : request.assignedCount >= request.capacity
      ? { label: "Full", className: "text-muted-foreground ring-surface-border" }
      : null;

  if (!chip) return <WorkOnButton requestId={request.id} />;
  return (
    <span className={cn("rounded-full bg-background px-4 py-1.5 text-sm font-semibold ring-1", chip.className)}>
      {chip.label}
    </span>
  );
}

/** Decorative blurred blobs behind the page content. Purely cosmetic. */
function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute top-20 left-[38%] size-80 rounded-full bg-[#5B92F5]/50 blur-sm" />
      <div className="absolute -bottom-28 -left-24 size-96 rounded-full bg-[#93E8C1]/50 blur-sm" />
      <div className="absolute -bottom-20 left-[52%] size-64 rounded-full bg-[#93E8C1]/50 blur-xl" />
      <div className="absolute right-16 bottom-16 size-72 rounded-full bg-[#5B92F5]/50 blur-xl" />
    </div>
  );
}
