"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown } from "lucide-react";

export type FilterOption = {
  /** What goes in the URL, e.g. ?status=pending */
  value: string;
  /** What the menu shows: plain text or a component like <StatusPill /> */
  label: React.ReactNode;
};

type Props = {
  /** The search param this filter owns */
  param: string;
  /** Button text: "Status Filter", or "Status: <label>" once picked */
  label: string;
  options: readonly FilterOption[];
};

/** Menu value for "no filter", never sent to the URL. */
const ALL = "__all__";

const itemClass =
  "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

/**
 * The client half of UrlFilter: a dropdown that reads and writes one search
 * param, leaving the others alone. Use UrlFilter instead of this directly.
 */
export default function UrlFilterMenu({ param, label, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // An unknown value in the URL shows as "no filter", same as the server treats it.
  const selected = options.find((option) => option.value === searchParams.get(param));

  function select(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === ALL) next.delete(param);
    else next.set(param, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-1.5 rounded-md bg-sidebar px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sidebar/85">
        {selected ? (
          <>
            {label}: {selected.label}
          </>
        ) : (
          `${label} Filter`
        )}
        <ChevronsUpDown className="size-3.5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-40 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
            <Menu.RadioGroup value={selected?.value ?? ALL} onValueChange={select}>
              {[{ value: ALL, label: "All" }, ...options].map((option) => (
                <Menu.RadioItem
                  key={option.value}
                  value={option.value}
                  closeOnClick
                  className={itemClass}
                >
                  <Menu.RadioItemIndicator>
                    <Check className="size-3.5" />
                  </Menu.RadioItemIndicator>
                  <span className="col-start-2">{option.label}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
