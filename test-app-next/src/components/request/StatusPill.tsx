import { cn } from "cn";
import type { RequestStatus } from "@/types/request";

const STATUS: Record<RequestStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-600" },
  "pending-review": { label: "Pending", className: "bg-zinc-200 text-zinc-700" },
  "in-progress": { label: "In Progress", className: "bg-orange-100 text-warn" },
  completed: { label: "Close", className: "bg-emerald-100 text-emerald-600" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-600" },
};

type Props = {
  status: RequestStatus;
  className?: string;
};

/** Compact tinted chip for dense lists; the detail header uses StatusBadge. */
export default function StatusPill({ status, className }: Props) {
  const { label, className: tone } = STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className
      )}
    >
      {label}
    </span>
  );
}
