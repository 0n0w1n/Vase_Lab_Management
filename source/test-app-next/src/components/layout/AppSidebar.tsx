"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Megaphone,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Manage Requests", href: "/Request", icon: ClipboardList },
  { label: "Manage Equipments", href: "/Equipment", icon: SlidersHorizontal },
  { label: "Operational Dashboard", href: "/Dashboard", icon: LayoutGrid },
];

type Props = {
  /** Signed-in user shown in the profile block at the bottom. */
  user?: { role: string; email: string };
};

export default function AppSidebar({
  user = { role: "LAB MEMBER", email: "Definate@example.com" },
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative shrink-0">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col rounded-tr-[2.5rem] bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-20 px-3" : "w-72 px-6"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-1 pt-9 pb-6 text-2xl font-bold tracking-[0.18em]",
            collapsed && "justify-center text-lg tracking-normal"
          )}
        >
          <span className="text-brand">VASE</span>
          {!collapsed && <span>LAB</span>}
        </Link>

        <div className="border-b border-white/15" />

        <nav className="flex flex-col gap-4 pt-7">
          {!collapsed && (
            <p className="text-sm font-semibold text-sidebar-foreground">Menu</p>
          )}
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-brand-soft",
                  active && "text-brand ring-2 ring-brand",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className={cn("size-5", active && "text-brand")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Link
          href="/Announcements"
          title={collapsed ? "Announcements" : undefined}
          className={cn(
            "flex items-center gap-3 py-4 text-sm font-semibold text-warn transition-opacity hover:opacity-80",
            collapsed && "justify-center"
          )}
        >
          <Megaphone className="size-5" />
          {!collapsed && <span>Announcements</span>}
        </Link>

        <div className="border-b border-white/15" />

        <div className="py-6">
          {!collapsed && (
            <p className="pb-4 text-sm font-semibold text-sidebar-foreground">
              Profile
            </p>
          )}
          <div
            className={cn(
              "flex items-center gap-3 pb-5",
              collapsed && "justify-center"
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
              {user.email.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold">{user.role}</p>
                <p className="truncate text-sm text-sidebar-muted">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            title={collapsed ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            )}
          >
            <LogOut className="size-4 text-sky-600" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="absolute top-24 -right-4 z-10 grid size-8 place-items-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-black/5 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft
          className={cn("size-4 transition-transform", collapsed && "rotate-180")}
        />
      </button>
    </div>
  );
}
