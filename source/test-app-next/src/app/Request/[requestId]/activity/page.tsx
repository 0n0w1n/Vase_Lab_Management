import { notFound } from "next/navigation";
import InitialsAvatar from "@/components/request/InitialsAvatar";
import { formatDateTime } from "@/lib/format";
import { getRequest } from "@/lib/requests";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function ActivityHistoryPage({ params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  const { activity } = request;

  return (
    <section>
      <header className="flex items-center justify-between pb-4">
        <h2 className="font-heading text-lg font-bold">Activity History</h2>
        <span className="text-sm text-muted-foreground">
          {activity.length} {activity.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing has happened on this request yet.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l border-surface-border pl-6">
          {activity.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                aria-hidden
                className="absolute top-2 -left-[1.6rem] size-2.5 rounded-full bg-brand ring-4 ring-surface"
              />
              <div className="flex items-center gap-2">
                <InitialsAvatar initials={entry.actor.initials} />
                <p className="text-sm font-bold">{entry.actor.name}</p>
                <time
                  dateTime={entry.at}
                  className="text-sm text-muted-foreground"
                >
                  {formatDateTime(entry.at, ", ")}
                </time>
              </div>
              <p className="pt-1 text-sm">{entry.message}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
