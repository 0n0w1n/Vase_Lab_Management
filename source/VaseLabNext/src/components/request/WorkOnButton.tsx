"use client";

import { useActionState } from "react";
import { Popover } from "@base-ui/react/popover";
import { askToWork, type ActionState } from "@/app/(main)/request/[requestId]/actions";

const INITIAL_STATE: ActionState = {};

/** TA only: opens a short optional message, then sends the ask to the lab manager. */
export default function WorkOnButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(askToWork, INITIAL_STATE);

  return (
    <Popover.Root>
      <Popover.Trigger className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/85">
        Work on
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="z-50 outline-none">
          <Popover.Popup className="w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/10 outline-none">
            <Popover.Title className="text-sm font-bold">Ask to work on this</Popover.Title>
            <Popover.Description className="pt-0.5 text-xs text-muted-foreground">
              The lab manager sees your message when deciding.
            </Popover.Description>
            {/* On success the page re-renders with "Asked · waiting", which replaces this button */}
            <form action={formAction} className="flex flex-col gap-2 pt-3">
              <input type="hidden" name="requestId" value={requestId} />
              <textarea
                name="message"
                rows={3}
                maxLength={1000}
                placeholder="Why you'd be a good fit (optional)"
                aria-label="Message"
                className="resize-none rounded-md bg-background px-3 py-2 text-sm ring-1 ring-surface-border placeholder:text-muted-foreground focus:ring-2 focus:ring-brand focus:outline-none"
              />
              {state.message && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {state.message}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="self-end rounded-md bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand/85 disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send"}
              </button>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
