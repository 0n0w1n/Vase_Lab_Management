import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { getEquipmentActivity, getEquipmentById } from "@/lib/equipment";

type Props = {
  params: Promise<{ equipmentId: string }>;
};

export default async function EquipmentActivityPage({ params }: Props) {
  const { equipmentId } = await params;
  if (!/^\d+$/.test(equipmentId)) notFound();

  const id = Number(equipmentId);
  const equipment = await getEquipmentById(id);
  if (!equipment) notFound();

  const activity = await getEquipmentActivity(id);

  return (
    <section aria-labelledby="activity-history-heading">
      <header className="flex items-center justify-between gap-3 pb-4">
        <h3 id="activity-history-heading" className="font-heading text-lg font-bold">
          Activity History
        </h3>
        <span className="text-sm text-muted-foreground">
          {activity.length} {activity.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing has changed on this equipment yet.</p>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l border-surface-border pl-6">
          {activity.map((entry) => (
            <li key={entry.id} className="relative">
              <span aria-hidden className="absolute top-2 -left-[1.6rem] size-2.5 rounded-full bg-brand ring-4 ring-surface" />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-bold">{entry.by}</p>
                <time dateTime={entry.at} className="text-sm text-muted-foreground">
                  {formatDateTime(entry.at, ", ")}
                </time>
              </div>
              <p className="pt-1 text-sm">{entry.action}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}