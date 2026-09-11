import { cn } from "cn";

type Props = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export default function DetailField({ label, children, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl bg-background px-5 py-4 ring-1 ring-surface-border",
        className
      )}
    >
      <p className="pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <div className="font-semibold text-foreground">{children}</div>
    </div>
  );
}
