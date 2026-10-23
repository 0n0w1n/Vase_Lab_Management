"use client";

import { useActionState, useState } from "react";
import { updateCapacity, type ActionState } from "@/app/(main)/request/[requestId]/actions";

const INITIAL_STATE: ActionState = {};

type Props = {
  requestId: string;
  capacity: number;
  assignedCount: number;
};

/** Lab manager only: "2 / [4] TAs", with Save appearing once the number changes. */
export default function CapacityForm({ requestId, capacity, assignedCount }: Props) {
  const [state, formAction, pending] = useActionState(updateCapacity, INITIAL_STATE);
  const [value, setValue] = useState(String(capacity));
  const changed = value !== String(capacity);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex items-center gap-2">
        <span>{assignedCount} /</span>
        <input
          type="number"
          name="capacity"
          aria-label="Capacity"
          required
          step={1}
          // Can't go below the TAs already approved; the server checks this too
          min={Math.max(1, assignedCount)}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-8 w-16 rounded-md bg-white px-2 text-sm ring-1 ring-surface-border focus:ring-2 focus:ring-brand focus:outline-none"
        />
        <span>{capacity === 1 ? "TA" : "TAs"}</span>
        {changed && (
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand/85 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      {state.message && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
