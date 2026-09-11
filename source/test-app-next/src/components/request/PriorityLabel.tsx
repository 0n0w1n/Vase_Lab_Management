import { ArrowDown, ArrowRight, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { RequestPriority } from "@/types/request";

const PRIORITY: Record<
  RequestPriority,
  { label: string; icon: LucideIcon; className: string }
> = {
  high: { label: "High", icon: TriangleAlert, className: "text-warn" },
  medium: { label: "Medium", icon: ArrowRight, className: "text-sky-600" },
  low: { label: "Low", icon: ArrowDown, className: "text-muted-foreground" },
};

type Props = {
  priority: RequestPriority;
  className?: string;
};

export default function PriorityLabel({ priority, className }: Props) {
  const { label, icon: Icon, className: tone } = PRIORITY[priority];

  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", tone, className)}>
      <Icon className="size-4" />
      {label}
    </span>
  );
}
