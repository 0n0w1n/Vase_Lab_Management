import {
  CheckCircle2,
  CircleDot,
  Clock,
  Loader,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { RequestStatus } from "@/types/request";

const STATUS: Record<
  RequestStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  open: {
    label: "Open",
    icon: CircleDot,
    className: "text-blue-600 ring-blue-500",
  },
  "pending-review": {
    label: "Pending Review",
    icon: Clock,
    className: "text-brand ring-brand",
  },
  "in-progress": {
    label: "In Progress",
    icon: Loader,
    className: "text-sky-600 ring-sky-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-emerald-600 ring-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "text-destructive ring-destructive",
  },
};

type Props = {
  status: RequestStatus;
  className?: string;
};

export default function StatusBadge({ status, className }: Props) {
  const { label, icon: Icon, className: tone } = STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-background px-4 py-1.5 text-sm font-semibold ring-1",
        tone,
        className
      )}
    >
      <Icon className="size-4" />
      {label}
    </span>
  );
}
