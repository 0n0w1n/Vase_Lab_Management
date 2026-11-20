// app/equipment/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate, formatEquipmentId } from "@/utils/format";
import { getCurrentUser } from "@/lib/auth";
import { getEquipment } from "@/lib/equipment";
import { type Equipment, type EquipmentState } from "@/types/equipment";
import PageHeader from "@/components/layout/PageHeader";
import { EquipmentActions } from "@/components/equipment/ActionPopups";
import UrlSearch from "@/components/ui/UrlSearch";

import { cn } from "cn";

export const metadata = {
  title: "Lab Equipment",
};

// Shared button look for the header actions.
const actionButton =
  "flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold transition-colors hover:bg-sidebar/85";

// One column template shared by the header row and every data row,
// so the two stay aligned by construction instead of by coincidence.
// Below the @2xl container width each row becomes a small stacked card
// (ID + state / name / model + return date) instead of a squashed table.
const rowColumns =
  "grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 @2xl:grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_7rem]";

// Where each cell sits in the narrow card; @2xl: puts them back in table order.
const cell = {
  topLeft: "row-start-1 @2xl:row-auto",
  topRight: "col-start-2 row-start-1 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:justify-self-auto",
  main: "col-span-2 row-start-2 @2xl:col-span-1 @2xl:row-auto",
  bottomLeft: "row-start-3 @2xl:row-auto",
  bottomRight: "col-start-2 row-start-3 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:justify-self-auto",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EquipmentPage({searchParams}: Props) {
  const params = await searchParams;
  const [items, user] = await Promise.all([getEquipment(), getCurrentUser()]);
  // SRS-12: TAs manage equipment the same as lab managers
  const canManage = user?.role === "lab_manager" || user?.role === "admin" || user?.role === "lab_ta";

  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const equipments = items.filter((request) =>(!query || matchesQuery(request, query)));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Lab Equipment"
        actions={
          canManage && (
            <Link href="/equipment/new" className={cn(actionButton, "text-brand")}>
              <Plus className="size-3.5" />
              Add Equipment
            </Link>
          )
        }
      />

      <div className="@container rounded-3xl bg-white/60 p-3 pb-8 ring-3 ring-black/10 backdrop-blur-xl sm:p-4 sm:pb-12">
        {/* Toolbar: hint on the left, search on the right; stacks when narrow */}
        <div className="flex flex-col gap-3 pb-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <p className="text-sm text-muted-foreground">
            To borrow equipment,{" "}
            <Link href="/request/new" className="font-semibold text-brand underline">
              create a request
            </Link>{" "}
            and choose the equipment in the request form.
          </p>
          <UrlSearch placeholder="Search by name, EQP-ID, or model" className="w-full shrink-0 @2xl:w-72" />
        </div>

        <TableHeaderRow />
        <ul className="flex flex-col gap-2 @2xl:gap-1 @2xl:pt-2">
          {equipments.map((item) => (
            <EquipmentRow key={item.id} item={item} canManage={canManage} />
          ))}
        </ul>

        {equipments.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {query ? "No equipment matches this search." : "No equipment yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function matchesQuery(equipment: Equipment, query: string) {
  if (equipment.name.toLowerCase().includes(query)) return true;
  if (equipment.model !== null && equipment.model.toLowerCase().includes(query)) return true;
  const id = query.replace(/^eqp-?/, "");
  return id !== "" && String(equipment.id) === id;
}

function TableHeaderRow() {
  return (
    <div
      className={cn(
        "hidden @2xl:grid",
        rowColumns,
        "rounded-lg bg-black/10 py-2.5 pr-12 text-[0.6rem] font-bold tracking-wide"
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

function EquipmentRow({ item, canManage }: { item: Equipment; canManage: boolean }) {
  return (
    <li className="group relative">
      <Link
        href={`/equipment/${item.id}`}
        className={cn(
          "grid",
          rowColumns,
          // pr-12 reserves room for the ⋮ actions button so it never covers a cell.
          "rounded-lg bg-white py-3 pr-12 ring-1 ring-black/5 hover:ring-black/30 @2xl:py-4"
        )}
      >
        <span className={cn(cell.topLeft, "text-sm font-bold text-[#4F46E5]")}>
          {formatEquipmentId(item.id)}
        </span>
        <p className={cn(cell.main, "min-w-0 text-sm font-semibold break-words")}>{item.name}</p>
        <span className={cn(cell.bottomLeft, "min-w-0 truncate text-sm text-muted-foreground")}>
          {item.model}
        </span>
        <StatePill state={item.state} className={cell.topRight} />
        {/* Only show the date while the item is out on loan. */}
        <ReturnCell date={item.state === "in_use" ? item.expectedReturn : null} className={cell.bottomRight} />
      </Link>
      {canManage &&
      <EquipmentActions item={item} variant="hover" />}
    </li>
  );
}

const stateStyles: Record<EquipmentState, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-700" },
  in_use: { label: "In Use", className: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Maintenance", className: "bg-amber-100 text-amber-700" },
  retired: { label: "Retired", className: "bg-gray-200 text-gray-600" },
};

function StatePill({ state, className: position }: { state: EquipmentState; className?: string }) {
  const { label, className } = stateStyles[state];
  return (
    <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-semibold", className, position)}>
      {label}
    </span>
  );
}

function ReturnCell({ date, className }: { date: string | null | undefined; className?: string }) {
  if (!date) {
    // The dash only makes sense under a column header, so the card view drops it.
    return <span className={cn(className, "hidden text-sm text-muted-foreground @2xl:inline")}>—</span>;
  }
  return (
    <time dateTime={date} className={cn(className, "text-sm text-muted-foreground")}>
      <span className="@2xl:hidden">Back </span>
      {formatDate(date)}
    </time>
  );
}