"use client";

import { usePathname } from "next/navigation";
import { Avatar } from "../primitives/Avatar";
import { Pill } from "../primitives/Pill";
import { StatusPill } from "../primitives/StatusPill";
import { Tooltip } from "../primitives/Tooltip";
import { cn, focusRing } from "../primitives/cn";
import { SearchIcon } from "../icons";
import { NAV_ITEMS } from "./nav";
import { ThemeSwitch } from "./ThemeProvider";
import { useCommandPalette } from "./CommandPalette";

const PRESENCE = [
  { name: "Ada Lovelace", status: "online" as const },
  { name: "Grace Hopper", status: "busy" as const },
  { name: "Alan Turing", status: "offline" as const },
];

function breadcrumbLabel(pathname: string): string {
  if (pathname === "/") return "Home";
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return NAV_ITEMS.find((n) => n.href === `/${seg}`)?.label ?? seg;
}

export function TopBar() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const crumb = breadcrumbLabel(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-subtle bg-surface px-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <span className="text-muted">Code Forge</span>
        <span className="text-faint" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-fg">{crumb}</span>
      </nav>

      <Pill className="ml-1">
        <span aria-hidden="true" className="text-faint">
          ⎇
        </span>
        main
      </Pill>
      <StatusPill status="success">Review passing</StatusPill>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={open}
          aria-label="Open command palette"
          className={cn(
            "hidden items-center gap-2 rounded-md border border-subtle bg-elevated px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-fg sm:inline-flex",
            focusRing,
          )}
        >
          <SearchIcon size={14} />
          <span>Search</span>
          <kbd className="rounded border border-subtle bg-surface px-1 text-[10px]">⌘K</kbd>
        </button>

        <ul className="flex -space-x-2" aria-label="Present collaborators">
          {PRESENCE.map((p) => (
            <li key={p.name}>
              <Tooltip content={p.name} side="bottom">
                <span
                  tabIndex={0}
                  role="img"
                  aria-label={`${p.name} (${p.status})`}
                  className={cn("inline-flex rounded-full", focusRing)}
                >
                  <Avatar name={p.name} status={p.status} size={28} className="ring-2 ring-surface" />
                </span>
              </Tooltip>
            </li>
          ))}
        </ul>

        <ThemeSwitch />
      </div>
    </header>
  );
}
