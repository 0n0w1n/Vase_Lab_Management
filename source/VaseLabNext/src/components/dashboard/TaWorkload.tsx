import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TaWorkload as Workload } from "@/types/workload";

export default function TaWorkload({ workload }: { workload: Workload[] }) {
  const maximum = Math.max(1, ...workload.map((ta) => ta.openCount));

  return (
    <section className="rounded-3xl bg-white/60 p-4 ring-3 ring-black/10 backdrop-blur-xl">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide">TA WORKLOAD</h2>
        <Link href="/dashboard/workload" className="flex items-center gap-1 rounded-lg bg-sidebar px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sidebar/85">
          Details <ChevronRight className="size-3.5" />
        </Link>
      </header>
      <ul className="flex flex-col gap-3 pt-4">
        {workload.slice(0, 3).map((ta) => (
          <li key={ta.id}>
            <Link href={`/dashboard/workload?ta=${ta.id}`} className="block rounded hover:bg-white/50">
              <div className="flex justify-between gap-2 pb-1 text-sm font-semibold">
                <span className="truncate">{ta.name}</span><span>{ta.openCount}</span>
              </div>
              <progress aria-label={`${ta.name}: open requests`} value={ta.openCount} max={maximum} className="block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-black/5 [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand" />
            </Link>
          </li>
        ))}
      </ul>
      {workload.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No TAs available.</p>}
    </section>
  );
}
