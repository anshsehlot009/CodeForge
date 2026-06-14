"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cn, focusRing } from "../primitives/cn";
import { Portal, useFocusTrap, useLockScroll, useOnEscape } from "../primitives/internal";
import { SearchIcon } from "../icons";
import { NAV_ITEMS } from "./nav";
import { useTheme } from "./ThemeProvider";

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

const CommandPaletteContext = createContext<{ open: () => void } | null>(null);

/** Global ⌘K command palette. Mount once near the root. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  const commands = useMemo<Command[]>(
    () => [
      ...NAV_ITEMS.map((n) => ({
        id: `go:${n.id}`,
        label: `Go to ${n.label}`,
        hint: "Navigate",
        run: () => router.push(n.href),
      })),
      { id: "theme:midnight", label: "Theme: Midnight", hint: "Theme", run: () => setTheme("midnight") },
      { id: "theme:daybreak", label: "Theme: Daybreak", hint: "Theme", run: () => setTheme("daybreak") },
      { id: "theme:auto", label: "Theme: Auto", hint: "Theme", run: () => setTheme("auto") },
    ],
    [router, setTheme],
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);

  return (
    <CommandPaletteContext.Provider value={{ open }}>
      {children}
      {isOpen ? <Palette commands={commands} onClose={() => setIsOpen(false)} /> : null}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): { open: () => void } {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within a <CommandPaletteProvider>");
  return ctx;
}

function Palette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, true);
  useLockScroll(true);
  useOnEscape(true, onClose);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  const activeCmd = filtered[active];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) {
        onClose();
        cmd.run();
      }
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="glass relative w-[min(560px,100%)] overflow-hidden rounded-lg border border-strong shadow-elevated outline-none"
        >
          <div className="flex items-center gap-2 border-b border-subtle px-3">
            <SearchIcon size={16} className="text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a command…"
              aria-label="Command"
              role="combobox"
              aria-expanded={filtered.length > 0}
              aria-controls="cmd-listbox"
              aria-activedescendant={activeCmd ? `cmd-opt-${activeCmd.id}` : undefined}
              className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
            />
            <kbd className="rounded border border-subtle bg-surface px-1.5 py-0.5 text-xs text-muted">esc</kbd>
          </div>
          <ul id="cmd-listbox" role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">No commands</li>
            ) : (
              filtered.map((c, i) => (
                <li key={c.id} id={`cmd-opt-${c.id}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      onClose();
                      c.run();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      focusRing,
                      i === active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    <span>{c.label}</span>
                    {c.hint ? <span className="text-xs text-muted">{c.hint}</span> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Portal>
  );
}
