"use client"

import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { Field, STATE_OPTIONS, inputBox } from "@/components/equipment/NewEquipmentForm";
import { formatEquipmentId } from "@/lib/format";
import type { Equipment } from "@/types/equipment";

const menuItem =
  "block cursor-default rounded-md px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

const dialogBackdrop = "fixed inset-0 z-50 bg-black/40";

// Fixed to the middle of the screen, whichever row opened it.
const dialogPopup =
  "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/10 outline-none";

const cancelButton =
  "h-10 rounded-lg border border-[#44607F]/40 bg-white/70 px-6 text-sm font-semibold text-[#44607F]";

type DialogProps = {
  item: Equipment;
  open: boolean;
  onClose: () => void;
};

export function ActionsOnHover({ item }: { item: Equipment }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-r-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 has-[[data-popup-open]]:pointer-events-auto has-[[data-popup-open]]:opacity-100"
    >
        {/* <ShowOptionsv2 item={item} /> */}
        <ShowOptions/>
    </div>
  );
}

export function ShowOptions(){
    const [open, SetOpen] = useState(false);
    return (
      <div className="relative hover:bg-foreground">
          <button
              type="button"
              onClick={() => SetOpen((current) => !current)}
              className= "relative"
          >
            <EllipsisVertical className="size-5" />
          </button>

          {/* Clicking the button toogles this menu */}
          {open && (
            <div className="absolute -top-10 -right-12 mt-2">
              <button type="button" className="block w-full px-3 py-2 text-left hover:bg-gray-100">
                    View
              </button>
            </div>
          )}
      </div>
    )
}
