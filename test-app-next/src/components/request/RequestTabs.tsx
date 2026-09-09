"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

type Props = {
  requestId: string;
};

export default function RequestTabs({ requestId }: Props) {
  const base = `/Request/${requestId}`;
  const pathname = usePathname();

  const tabs = [
    { label: "Detail", href: base },
    { label: "Activity History", href: `${base}/activity` },
    { label: "Message Log", href: `${base}/messages` },
  ];

  return (
    <nav className="flex gap-8 border-b border-surface-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
