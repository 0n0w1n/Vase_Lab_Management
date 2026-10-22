"use client";

import { useActionState } from "react";
import { submitDecision, type DecisionState } from "@/app/(main)/dashboard/decisions/actions";
import { cn } from "cn";

const INITIAL_STATE: DecisionState = {};

const buttonClass =
  "rounded-md px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  askId: string;
  /** request already has as many TAs as its capacity allows */
  full: boolean;
};

export default function DecisionButtons({ askId, full }: Props) {
  const [state, formAction, pending] = useActionState(submitDecision, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="id" value={askId} />
      <div className="flex gap-2">
        {/* Both disabled while saving, so a double click can't send two decisions */}
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending || full}
          title={full ? "Raise the request's capacity to approve more TAs" : undefined}
          className={cn(buttonClass, "bg-emerald-200 text-emerald-800 enabled:hover:bg-emerald-300")}
        >
          {full ? "Full" : "Approve"}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          disabled={pending}
          className={cn(buttonClass, "bg-red-300 text-red-800 enabled:hover:bg-red-400")}
        >
          Decline
        </button>
      </div>
      {state.message && (
        <p role="alert" className="text-right text-xs font-medium text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
