"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "./cn";
import { Portal, useFocusTrap, useLockScroll, useOnEscape } from "./internal";
import { Button } from "./Button";
import { CloseIcon } from "../icons";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left";
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

/** Accessible slide-in panel (focus-trapped, scroll-locked, Escape + overlay to close). */
export function Sheet({ open, onOpenChange, side = "right", title, description, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(panelRef, open);
  useLockScroll(open);
  useOnEscape(open, () => onOpenChange(false));

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          className={cn(
            "glass absolute bottom-0 top-0 flex w-[min(420px,90vw)] flex-col gap-4 p-6 shadow-elevated outline-none",
            side === "right" ? "right-0 border-l border-strong" : "left-0 border-r border-strong",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              {title ? (
                <h2 id={titleId} className="text-lg font-semibold text-fg">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descId} className="text-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" aria-label="Close" onClick={() => onOpenChange(false)}>
              <CloseIcon size={16} />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
