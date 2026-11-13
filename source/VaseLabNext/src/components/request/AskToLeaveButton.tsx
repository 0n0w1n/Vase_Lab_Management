"use client";

import { useTransition } from "react";
import { askToLeave } from "@/app/(main)/request/[requestId]/actions";
import { useAlert } from "@/components/ui/Alert";

type Props = {
  requestId: string;
  /** already asked; waiting for the lab manager */
  requested: boolean;
};

/** Assigned TA only: asks the lab manager to take them off, who decides on the Decisions page. */
export default function AskToLeaveButton({ requestId, requested }: Props) {
  const [pending, startTransition] = useTransition();
  const showAlert = useAlert();

  if (requested) {
    return (
      <span className="shrink-0 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Leave requested
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await askToLeave(requestId);
          showAlert(
            result.message ? "error" : "success",
            result.message ?? "Asked the lab manager to take you off this request."
          );
        })
      }
      className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-300 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Asking…" : "Ask to leave"}
    </button>
  );
}
