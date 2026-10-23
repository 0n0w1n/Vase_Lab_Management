// app/equipment/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { formatEquipmentId, getEquipment } from "@/lib/equipment";
import { type Equipment, type EquipmentState } from "@/types/equipment";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import { cn } from "cn";

export const metadata = {
  title: "Lab Equipment",
};

// Shared button look for the header actions.
const actionButton =
  "flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold transition-colors hover:bg-sidebar/85";

// One column template shared by the header row and every data row,
// so the two stay aligned by construction instead of by coincidence.
const rowColumns =
  "grid grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_7rem] items-center gap-4 px-4";

export default async function EquipmentPage() {
  const [items, user] = await Promise.all([getEquipment(), getCurrentUser()]);
  const isLabManager = user?.role === "lab_manager";

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-14">
      <BackgroundGlow />

      <div className="mx-auto max-w-5xl">
        <PageHeader isLabManager={isLabManager} />

        <div className="rounded-3xl bg-white/60 p-4 pb-12 ring-3 ring-black/10 backdrop-blur-xl">
          <p className="pb-3 text-sm text-muted-foreground">
            To borrow equipment,{" "}
            <Link href="/request/new" className="font-semibold text-brand underline">
              create a request
            </Link>{" "}
            and choose the equipment in the request form.
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-[44rem]">
              <TableHeaderRow />
              <ul className="flex flex-col gap-1 pt-2">
                {items.map((item) => (
                  <EquipmentRow key={item.id} item={item} />
                ))}
              </ul>
              {items.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No equipment yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function PageHeader({ isLabManager }: { isLabManager: boolean }) {
  return (
    <header className="flex items-end justify-between pb-3">
      <h1 className="text-4xl font-extrabold text-brand">Lab Equipment</h1>

      {/* Only lab managers see this button. */}
      {isLabManager && (
        <Link href="/equipment/new" className={cn(actionButton, "text-brand")}>
          <Plus className="size-3.5" />
          Add Equipment
        </Link>
      )}
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
      <span>EQUIPMENT ID</span>
      <span>NAME</span>
      <span>MODEL</span>
      <span>STATE</span>
      <span>EXPECTED RETURN</span>
    </div>
  );
}

function EquipmentRow({ item }: { item: Equipment }) {
  return (
    <li>
      <Link
        href={`/equipment/${item.id}`}
        className={cn(
          rowColumns,
          "rounded-lg bg-white py-4 ring-1 ring-black/5 hover:ring-black/30"
        )}
      >
        <span className="text-sm font-bold text-[#4F46E5]">
          {formatEquipmentId(item.id)}
        </span>
        <p className="min-w-0 text-sm font-semibold">{item.name}</p>
        <span className="text-sm text-muted-foreground">{item.model}</span>
        <StatePill state={item.state} />
        {/* Only show the date while the item is out on loan. */}
        <ReturnCell date={item.state === "in_use" ? item.expectedReturn : null} />
      </Link>
    </li>
  );
}

const stateStyles: Record<EquipmentState, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-700" },
  in_use: { label: "In Use", className: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Maintenance", className: "bg-amber-100 text-amber-700" },
  retired: { label: "Retired", className: "bg-gray-200 text-gray-600" },
};

function StatePill({ state }: { state: EquipmentState }) {
  const { label, className } = stateStyles[state];
  return (
    <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

function ReturnCell({ date }: { date: string | null | undefined }) {
  if (!date) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <time dateTime={date} className="text-sm text-muted-foreground">
      {formatDate(date)}
    </time>
  );
}