"use client"

import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

export type ActionKind = "edit" | "delete";

type Props = {
  /** "buttons" for a detail page header, "hover" for a list row (needs `group relative` on the row) */
  variant: "buttons" | "hover";
  /** Renders the edit + delete modals; `open` says which one is showing. */
  dialogs: (open: ActionKind | null, close: () => void) => React.ReactNode;
};

const headerButton =
  "h-9 rounded-lg px-4 text-xs font-semibold text-white";

const menuItem =
  "block cursor-default rounded-md px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

/** Edit / Delete triggers. Both variants open the same modals. */
export function ItemActions({ variant, dialogs }: Props) {
  const [open, setOpen] = useState<ActionKind | null>(null);
  const close = () => setOpen(null);

  return (
    <>
      {variant === "buttons" ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen("edit")} className={cn(headerButton, "bg-indigo-600")}>
            Edit
          </button>
          <button type="button" onClick={() => setOpen("delete")} className={cn(headerButton, "bg-red-600")}>
            Delete
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-r-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 has-[[data-popup-open]]:pointer-events-auto has-[[data-popup-open]]:opacity-100">
          <Menu.Root>
            <Menu.Trigger aria-label="Actions">
              <EllipsisVertical className="size-5" />
            </Menu.Trigger>

            <Menu.Portal>
              <Menu.Positioner side="right" align="end" sideOffset={15} collisionAvoidance={{ side: "flip" }} className="z-50 outline-none">
                <Menu.Popup className="min-w-28 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
                  <Menu.Item onClick={() => setOpen("edit")} className={menuItem}>
                    Edit
                  </Menu.Item>
                  <Menu.Item onClick={() => setOpen("delete")} className={cn(menuItem, "text-red-600")}>
                    Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      )}

      {/* Outside Menu.Root so the modals stay open after the menu closes */}
      {dialogs(open, close)}
    </>
  );
}
