"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Braces,
  LayoutGrid,
  CalendarDays,
  Inbox,
  LineChart,
  Search,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  LogOut,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Topic } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  label: string;
  icon: typeof LayoutGrid;
  href: string;
  badge?: number;
  active?: boolean;
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Roadmap", icon: Map, href: "/roadmap" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
];

const secondaryNav: NavItem[] = [
  { label: "Inbox", icon: Inbox, href: "#", badge: 6 },
  { label: "Analytics", icon: LineChart, href: "#" },
];

function masteryLevel(topic: Topic) {
  return topic.solved / topic.total;
}

function SignalBars({ level, color }: { level: number; color: string }) {
  const active = level >= 0.66 ? 3 : level >= 0.33 ? 2 : 1;
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full transition-colors"
          style={{
            height: `${5 + i * 3}px`,
            backgroundColor: i < active ? color : "var(--sidebar-border)",
          }}
        />
      ))}
    </span>
  );
}

function NavButton({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const { icon: Icon, label, href, badge, active } = item;
  const content = (
    <Link
      href={href}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-white/[0.07] text-foreground"
          : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute right-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
      )}
      <Icon className="size-[1.15rem] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[0.6875rem] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export function AppSidebar({ topics }: { topics: Topic[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
        "transition-[width] duration-200 ease-out",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-[oklch(0.55_0.2_280)] shadow-sm shadow-brand/30">
          <Braces className="size-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
            Algo
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "ml-auto grid size-7 place-items-center rounded-md text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
            collapsed && "ml-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        {collapsed ? (
          <button
            type="button"
            className="grid h-9 w-full place-items-center rounded-lg bg-white/[0.04] text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
        ) : (
          <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 text-sidebar-foreground ring-1 ring-inset ring-transparent transition focus-within:bg-white/[0.06] focus-within:ring-white/10">
            <Search className="size-4 shrink-0" />
            <input
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="flex items-center gap-0.5 rounded border border-sidebar-border px-1 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
              ⌘F
            </kbd>
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {primaryNav.map((item) => (
          <NavButton
            key={item.label}
            item={{ ...item, active: isActive(item.href) }}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="mx-4 my-2 border-t border-sidebar-border" />

      {/* Secondary nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-1">
        {secondaryNav.map((item) => (
          <NavButton key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mx-4 my-2 border-t border-sidebar-border" />

      {/* Topics */}
      {!collapsed && (
        <div className="flex min-h-0 flex-1 flex-col px-3">
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              My topics
            </span>
            <button
              type="button"
              className="grid size-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              aria-label="Add topic"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {topics.slice(0, 4).map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: topic.color }}
                />
                <span className="flex-1 truncate text-left">{topic.name}</span>
                <SignalBars level={masteryLevel(topic)} color={topic.color} />
              </button>
            ))}
          </div>
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      {/* User */}
      <UserFooter collapsed={collapsed} />
    </aside>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { user, configured, logout } = useAuth();
  const name = user?.name ?? "Guest";
  const subtitle = configured ? (user?.email ?? "Signed in") : "Demo mode";

  const avatar = user?.photoURL ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      className="size-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.7_0.15_250)] to-brand text-xs font-semibold text-white">
      {initials(name)}
    </span>
  );

  // Demo mode — no account to manage, just show who you are.
  if (!configured) {
    return (
      <div className="mt-auto border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-1.5",
            collapsed && "justify-center",
          )}
        >
          {avatar}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none",
            collapsed && "justify-center",
          )}
        >
          {avatar}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={collapsed ? "right" : "top"}
          align="start"
          className="w-56"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{name}</span>
              {user?.email && (
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => logout()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
