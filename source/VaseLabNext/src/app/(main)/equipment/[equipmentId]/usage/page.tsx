import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import { formatEquipmentId, getEquipmentById, getEquipmentUsage } from "@/lib/equipment";
import type { EquipmentUsage } from "@/types/equipment";

type Props = {
  params: Promise<{ equipmentId: string }>;
};

const rowColumns = "grid grid-cols-[7rem_minmax(0,1fr)_8rem_9rem] items-center gap-4 px-4";

export default async function EquipmentUsagePage({ params }: Props) {
  const { equipmentId } = await params;
  if (!/^\d+$/.test(equipmentId)) notFound();

  const id = Number(equipmentId);
  const equipment = await getEquipmentById(id);
  if (!equipment) notFound();

  const usage = await getEquipmentUsage(id);

  return (
    <section aria-labelledby="usage-history-heading">
      <header className="flex items-center justify-between gap-3 pb-4">
        <h3 id="usage-history-heading" className="font-heading text-lg font-bold">
          Usage History
        </h3>
        <span className="text-sm text-muted-foreground">
          {usage.length} {usage.length === 1 ? "request" : "requests"}
        </span>
      </header>

      {usage.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests have borrowed this equipment.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[42rem]">
            <div className={`${rowColumns} rounded-lg bg-black/10 py-2.5 text-[0.6rem] font-bold tracking-wide`}>
              <span>REQUEST ID</span>
              <span>REQUESTED BY</span>
              <span>STATUS</span>
              <span>DEADLINE</span>
            </div>
            <ul className="flex flex-col gap-1 pt-2">
              {usage.map((entry, i) => (
                <li key={entry.requestId ?? `hidden-${i}`}>
                  {entry.requestId === null ? (
                    <div className={`${rowColumns} rounded-lg bg-white py-4 ring-1 ring-black/5`}>
                      <UsageCells entry={entry} />
                    </div>
                  ) : (
                    <Link
                      href={`/request/${entry.requestId}`}
                      className={`${rowColumns} rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30 focus-visible:outline-2 focus-visible:outline-brand`}
                    >
                      <UsageCells entry={entry} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <span className="sr-only">History for {formatEquipmentId(equipment.id)}</span>
    </section>
  );
}

// ID and status will be null if the viewer isnt staff
function UsageCells({ entry }: { entry: EquipmentUsage }) {
  return (
    <>
      <span className="text-sm font-bold text-brand">
        {entry.requestId === null ? "—" : `REQ-${String(entry.requestId).padStart(2, "0")}`}
      </span>
      <span className="truncate text-sm font-medium">{entry.requestedBy}</span>
      <span className="text-sm capitalize">
        {entry.status ? entry.status.replaceAll("_", " ").replaceAll("-", " ") : "—"}
      </span>
      <span className="text-sm text-muted-foreground">
        {entry.deadline ? formatDate(entry.deadline) : "—"}
      </span>
    </>
  );
}