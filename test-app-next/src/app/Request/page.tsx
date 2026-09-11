import Link from "next/link";
import {ChevronsUpDown, Plus} from "lucide-react";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import {formatDate} from "@/lib/format";
import { getRequests } from "@/lib/requests";

export const metadata = {
  title: "Manage Requests",
};

const columns = "grid grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_7rem] items-center gap-4 px-4";
const mainButton = "flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold transition-colors hover:bg-sidebar/85";

export default async function ManageRequestsPage() {
  const requests = await getRequests()
  return (
    <div className="relative isolate min-h-screen overflow-hidden py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-[38%] size-80 rounded-full bg-[#5B92F5]/50 blur-sm" />
        <div className="absolute -bottom-28 -left-24 size-96 rounded-full bg-[#93E8C1]/50 blur-sm" />
        <div className="absolute -bottom-20 left-[52%] size-64 rounded-full bg-[#93E8C1]/50 blur-xl" />
        <div className="absolute right-16 bottom-16 size-72 rounded-full bg-[#5B92F5]/50 blur-xl" />
      </div>

      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between pb-3 items-end">
          <h1 className="text-4xl font-extrabold text-brand">
            Manage Request
          </h1>
          <button type="button" className={`${mainButton} text-brand`}>
            <Link href="/Request/new" className={`${mainButton} text-brand`}>
              <Plus className="size-3.5" />
              New Request
            </Link>
          </button>
        </header>

        <div className="rounded-3xl bg-white/60 p-4 pb-12 ring-3 ring-black/10 backdrop-blur-xl">
          <div className="flex justify-end gap-2 pb-4">
            <button type="button" className={`${mainButton} text-white`}>
              Status Filter
              <ChevronsUpDown className="size-3.5" />
            </button>
            <button type="button" className={`${mainButton} text-white`}>
              Priority Filter
              <ChevronsUpDown className="size-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[44rem]">
              <div className={`${columns} rounded-lg bg-black/10 py-2.5 text-[0.6rem] font-bold tracking-wide`}>
                <span>REQUEST ID</span>
                <span>TITLE</span>
                <span>STATUS</span>
                <span>PRIORITY</span>
                <span>DATE DEADLINE</span>
              </div>

              <ul className="flex flex-col gap-1 pt-2">
                {requests.map((request) => (
                  <li key={request.id}>
                    <Link href={`/Request/${request.id}NOTFOUNDPAGE`} className={`${columns} rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30`}>
                      <span className="text-sm font-bold text-[#4F46E5]">
                        REQ-{request.id}
                      </span>
                      <p className="min-w-0 text-sm font-semibold">
                        {request.title}
                      </p>
                      <span>
                        <StatusPill status={request.status} />
                      </span>
                      <PriorityDot priority={request.priority} />
                      {request.deadline ? (
                        <time dateTime={request.deadline} className="text-sm text-muted-foreground">
                          {formatDate(request.deadline)}
                        </time>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
