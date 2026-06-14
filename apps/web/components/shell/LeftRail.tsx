"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, focusRing } from "../primitives/cn";
import { Tooltip } from "../primitives/Tooltip";
import { ChevronsLeftIcon } from "../icons";
import { NAV_ITEMS } from "./nav";

export interface LeftRailProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function LeftRail({ collapsed, onToggle }: LeftRailProps) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-subtle bg-surface transition-[width] duration-200",
        collapsed ? "w-11" : "w-56",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-subtle", collapsed ? "justify-center" : "px-4")}>
        <span className="aurora-text text-lg font-bold">{collapsed ? "C" : "Code Forge"}</span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ id, label, href, Icon }) => {
          const active = isActive(href);
          const link = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md text-sm transition-colors",
                focusRing,
                collapsed ? "justify-center" : "px-3",
                active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed ? <span>{label}</span> : null}
              {active && !collapsed ? (
                <span aria-hidden="true" className="ml-auto h-4 w-1 rounded-full bg-aurora" />
              ) : null}
            </Link>
          );
          return (
            <div key={id}>
              {collapsed ? (
                <Tooltip content={label} side="bottom">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-subtle p-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-md text-sm text-muted transition-colors hover:bg-elevated hover:text-fg",
            focusRing,
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <ChevronsLeftIcon size={18} className={cn("shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
