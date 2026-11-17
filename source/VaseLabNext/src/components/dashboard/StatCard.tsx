import { cn } from "cn";

type Props = {
  label: string;
  value: number;
  /** the card currently filtering the table: green outline */
  selected?: boolean;
  /** something needs action: red number */
  urgent?: boolean;
};

export default function StatCard({ label, value, selected, urgent }: Props) {
  return (
    <div
      className={cn(
        "h-full rounded-2xl bg-white px-5 py-5 ring-1 ring-black/5",
        selected && "ring-2 ring-brand"
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "pt-2 text-4xl font-extrabold",
          selected && "text-brand",
          urgent && "text-warn"
        )}
      >
        {value}
      </p>
    </div>
  );
}
