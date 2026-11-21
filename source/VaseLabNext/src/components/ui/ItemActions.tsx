"use client"

import { Fragment, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

export type ItemAction = {
  /** Button / menu text. Also the action's key, so keep it unique within one ItemActions. */
  label: string;
  /** Button color; "danger" also tints the menu item red. Defaults to "primary". */
  tone?: "primary" | "danger" | "neutral";
  /** The modal this action opens; `open` is true while it's the one showing. */
  dialog: (open: boolean, close: () => void) => React.ReactNode;
};

type Props = {
  /** "buttons" for a detail page header, "hover" for a list row (needs `group relative` on the row) */
  variant: "buttons" | "hover";
  /** One button / menu item each, in order. Leave an action out to hide it. */
  actions: ItemAction[];
};

const headerButton =
  "h-9 rounded-lg px-4 text-xs font-semibold text-white";

const toneButton: Record<NonNullable<ItemAction["tone"]>, string> = {
  primary: "bg-indigo-600",
  danger: "bg-red-600",
  neutral: "bg-zinc-600",
};

const menuItem =
  "block cursor-default rounded-md px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

/** A row of action triggers (or a hover menu) where each one opens its own modal. */
export function ItemActions({ variant, actions }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const close = () => setOpen(null);

  if (actions.length === 0) return null;

  return (
    <>
      {variant === "buttons" ? (
        <div className="flex gap-2">
          {actions.map(({ label, tone = "primary" }) => (
            <button key={label} type="button" onClick={() => setOpen(label)} className={cn(headerButton, toneButton[tone])}>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-r-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 has-[[data-popup-open]]:pointer-events-auto has-[[data-popup-open]]:opacity-100">
          <Menu.Root>
            <Menu.Trigger aria-label="Actions">
              <EllipsisVertical className="size-5" />
            </Menu.Trigger>

            <Menu.Portal>
              <Menu.Positioner side="right" align="end" sideOffset={15} collisionAvoidance={{ side: "flip" }} className="z-50 outline-none">
                <Menu.Popup className="min-w-28 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
                  {actions.map(({ label, tone }) => (
                    <Menu.Item key={label} onClick={() => setOpen(label)} className={cn(menuItem, tone === "danger" && "text-red-600")}>
                      {label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      )}

      {/* Outside Menu.Root so the modals stay open after the menu closes */}
      {actions.map(({ label, dialog }) => (
        <Fragment key={label}>{dialog(open === label, close)}</Fragment>
      ))}
    </>
  );
}
