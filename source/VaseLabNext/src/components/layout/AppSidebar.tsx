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
import type { User, UserRole } from "@/lib/auth";
import { logout } from "@/app/(auth)/login/actions";

import Image from "next/image";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Manage Requests", href: "/request", icon: ClipboardList },
  { label: "Manage Equipments", href: "/equipment", icon: SlidersHorizontal },
  { label: "Operational Dashboard", href: "/dashboard", icon: LayoutGrid, roles: ["lab_manager"] },
];

type Props = {
  /** Signed-in user shown in the profile block at the bottom. */
  user: User;
};

export default function AppSidebar({ user }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="shrink-0">
      <aside
        className={cn(
          "sticky top-0 flex h-dvh flex-col rounded-tr-[2.5rem] bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-16 px-2 md:w-20 md:px-3" : "w-16 px-2 md:w-72 md:px-6"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center justify-center gap-1 pt-6 pb-6 text-sm font-bold md:justify-start md:pt-9 md:text-2xl md:tracking-[0.18em]",
            collapsed && "md:justify-center md:text-lg md:tracking-normal"
          )}
        >
          <span className="text-brand">VASE</span>
          {!collapsed && <span className="hidden md:inline">LAB</span>}
        </Link>

        <div className="border-b border-white/15" />

        <nav className="flex flex-col gap-4 pt-7">
          {!collapsed && (
            <p className="hidden text-sm font-semibold text-sidebar-foreground md:block">Menu</p>
          )}
          {NAV_ITEMS.filter(
            (item) => !item.roles || item.roles.includes(user.role)
          ).map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-3 rounded-md bg-white px-0 py-3 md:justify-start md:px-4 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-brand-soft",
                  active && "text-brand ring-2 ring-brand",
                  collapsed && "md:justify-center md:px-0"
                )}
              >
                <Icon className={cn("size-5", active && "text-brand")} />
                {!collapsed && <span className="hidden md:inline">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Link
          href="/Announcements"
          title="Announcements"
          aria-label="Announcements"
          className={cn(
            "flex items-center justify-center gap-3 py-4 md:justify-start text-sm font-semibold text-warn transition-opacity hover:opacity-80",
            collapsed && "md:justify-center"
          )}
        >
          <Megaphone className="size-5" />
          {!collapsed && <span className="hidden md:inline">Announcements</span>}
        </Link>

        <div className="border-b border-white/15" />

        <div className="py-6">
          {!collapsed && (
            <p className="hidden pb-4 text-sm font-semibold text-sidebar-foreground md:block">
              Profile
            </p>
          )}
          <Link
            href={`/profile/${user.id}`}
            aria-label={`View ${user.name}'s profile`}
            title={user.name}
            className={cn(
              "flex items-center justify-center gap-3 pb-5 md:justify-start",
              collapsed && "md:justify-center"
            )}
          >
            <Image src="/TripleTAvatar.svg" alt="Profile" width={67} height={67} className="size-10 shrink-0 rounded-full md:size-14" />
            {!collapsed && (
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-sm text-sidebar-muted">
                  {user.email}
                </p>
              </div>
            )}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              title="Log out"
              aria-label="Log out"
              className={cn(
                "flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-2 md:px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              )}
            >
              <LogOut className="size-4 text-sky-600" />
              {!collapsed && <span className="hidden md:inline">Log out</span>}
            </button>
          </form>
        </div>

        {/* Inside the sticky <aside> so the handle stays pinned while the
            page scrolls; sticky is a positioned ancestor, so it anchors this. */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="absolute top-19 -right-4 z-10 hidden size-8 md:grid place-items-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-black/5 transition-colors hover:bg-slate-50"
        >
          <ChevronLeft
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </aside>
    </div>
  );
}
