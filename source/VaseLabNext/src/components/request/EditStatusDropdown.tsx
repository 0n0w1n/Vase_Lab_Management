"use client";

import type { LabRequest } from "@/types/request";
import type { UserRole } from "@/lib/auth";
import { Menu } from "@base-ui/react";
import { RequestStatus } from "@/types/request";
import StatusBadge from "@/components/request/StatusBadge";
import StatusPill from "@/components/request/StatusPill";
import { startTransition, useActionState } from "react";
import { updateStatusAction } from "@/app/(main)/request/[requestId]/actions";

type Props = {
  request: LabRequest;
  role?: UserRole;
  className?: string;
};

const MANAGER_STATUSES: RequestStatus[] = ["pending", "in-progress", "review", "close", "reject"]
const TA_STATUSES: RequestStatus[] = ["in-progress", "review"]

const itemClass =
  "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100";

export default function EditStatusDropdown({ request, role, className }: Props) {

    const [status, dispatchAction, isPending] = useActionState(updateStatusAction, request.status);

    let statuses: RequestStatus[] = [];

    if (!role) {
      return (<StatusBadge status={status} className={className}></StatusBadge>)
    }

    if (role === "lab_manager" || role === "admin") {
      statuses = MANAGER_STATUSES;
    }
    else if (role === "lab_ta" && request.myAsk == "approved") {
      statuses = TA_STATUSES;
    }

    if (!(statuses.find((i) => i === request.status) ?? false)) {
      return (<StatusBadge status={status} className={className}></StatusBadge>)
    }

  return (

    <Menu.Root>
      <Menu.Trigger>
        <StatusBadge status={status} className={className} is_menu={true}></StatusBadge>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-40 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
            <Menu.RadioGroup
              value={request.status}
              onValueChange={(next) => startTransition( () => dispatchAction({status: next, requestId: request.id}) )}
            >
              {statuses.map((option) => (
                <Menu.RadioItem key={option} value={option} closeOnClick className={itemClass}>
                  <span className="col-start-2">{<StatusPill status={option}/>}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
