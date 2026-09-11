import { cn } from "cn";
import type { RequestPriority } from "@/types/request";

const PRIORITY: Record<RequestPriority, { label: string; dot: string }> = {
  high: { label: "High", dot: "bg-red-500" },
  medium: { label: "Medium", dot: "bg-orange-400" },
  low: { label: "Low", dot: "bg-emerald-500" },
};

type Props = {
  priority: RequestPriority;
  className?: string;
};

/** Colored dot + plain label for dense lists; the detail page uses PriorityLabel. */
export default function PriorityDot({ priority, className }: Props) {
  const { label, dot } = PRIORITY[priority];

  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
