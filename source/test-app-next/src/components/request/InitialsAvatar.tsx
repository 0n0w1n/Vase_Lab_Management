import { cn } from "cn";

const TONES = [
  "bg-brand-soft text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
];

const SYSTEM_TONE = "bg-slate-200 text-slate-600";

/** Same initials always land on the same colour, so people stay recognisable. */
function toneFor(initials: string) {
  if (initials === "SYS") return SYSTEM_TONE;
  const sum = [...initials].reduce((total, char) => total + char.charCodeAt(0), 0);
  return TONES[sum % TONES.length];
}

type Props = {
  initials: string;
  className?: string;
};

export default function InitialsAvatar({ initials, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold tracking-tight",
        toneFor(initials),
        className
      )}
    >
      {initials}
    </span>
  );
}
