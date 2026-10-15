import { cn } from "cn";

type Props = {
  label: string;
  value: number;
  /** highlights card*/
  alert?: string;
};

export default function StatCard({ label, value, alert }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white px-5 py-5 ring-1 ring-black/5",
        alert && "ring-2 ring-brand"
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex items-center justify-between gap-2 pt-2">
        <p className={cn("text-4xl font-extrabold", alert && "text-brand")}>{value}</p>
        {alert && (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[0.6rem] font-bold tracking-wide text-brand uppercase">
            {alert}
          </span>
        )}
      </div>
    </div>
  );
}
