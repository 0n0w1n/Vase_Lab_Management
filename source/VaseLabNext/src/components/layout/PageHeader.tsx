import Link from "next/link";
import { cn } from "cn";

export type Crumb = {
  label: React.ReactNode;
  /** Leave out for the current page (the last crumb). */
  href?: string;
};

type Props = {
  title: React.ReactNode;
  /** Trail shown above the title, e.g. Manage Requests / New Request. */
  breadcrumbs?: Crumb[];
  /** Buttons or info shown on the right of the title. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Shared page title block so every page lines up the same way.
 * Layout is fixed (crumbs above, title, actions on the right); pages only fill the slots.
 */
export default function PageHeader({ title, breadcrumbs, actions, className }: Props) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4 pb-6", className)}>
      <div className="min-w-0">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <h1 className="pt-1 text-3xl font-extrabold text-brand sm:text-4xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-y-1 text-xs text-muted-foreground">
      {items.map((crumb, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <span className="px-1.5">/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
