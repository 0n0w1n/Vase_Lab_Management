"use client";

import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown } from "lucide-react";
import PriorityDot from "@/components/request/PriorityDot";
import StatusPill from "@/components/request/StatusPill";
import {
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  type RequestPriority,
  type RequestStatus,
} from "@/types/request";

type Filters = {
  status?: RequestStatus;
  priority?: RequestPriority;
};

/** Menu value for "no filter" — never sent to the URL. */
const ALL = "all";

/**
 * The filters live in the URL (?status=…&priority=…), so the page reads them
 * on the server and a filtered list can be refreshed or shared as a link.
 */
export default function RequestFilters({ status, priority }: Filters) {
  const router = useRouter();

  function apply(next: Filters) {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    const query = params.toString();
    router.replace(query ? `/request?${query}` : "/request", { scroll: false });
  }

  return (
    <div className="flex justify-end gap-2 pb-4">
      <FilterMenu
        label="Status"
        value={status}
        options={REQUEST_STATUSES}
        renderOption={(option) => <StatusPill status={option} />}
        onChange={(next) => apply({ status: next, priority })}
      />
      <FilterMenu
        label="Priority"
        value={priority}
        options={REQUEST_PRIORITIES}
        renderOption={(option) => <PriorityDot priority={option} className="text-xs" />}
        onChange={(next) => apply({ status, priority: next })}
      />
    </div>
  );
}

type FilterMenuProps<T extends string> = {
  label: string;
  value: T | undefined;
  options: readonly T[];
  renderOption: (option: T) => React.ReactNode;
  onChange: (value: T | undefined) => void;
};

const itemClass =
  "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

function FilterMenu<T extends string>({
  label,
  value,
  options,
  renderOption,
  onChange,
}: FilterMenuProps<T>) {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sidebar/85">
        {value ? (
          <>
            {label}: {renderOption(value)}
          </>
        ) : (
          `${label} Filter`
        )}
        <ChevronsUpDown className="size-3.5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-40 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
            <Menu.RadioGroup
              value={value ?? ALL}
              onValueChange={(next) => onChange(next === ALL ? undefined : next)}
            >
              <Menu.RadioItem value={ALL} closeOnClick className={itemClass}>
                <Menu.RadioItemIndicator>
                  <Check className="size-3.5" />
                </Menu.RadioItemIndicator>
                <span className="col-start-2">All</span>
              </Menu.RadioItem>
              {options.map((option) => (
                <Menu.RadioItem key={option} value={option} closeOnClick className={itemClass}>
                  <Menu.RadioItemIndicator>
                    <Check className="size-3.5" />
                  </Menu.RadioItemIndicator>
                  <span className="col-start-2">{renderOption(option)}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
