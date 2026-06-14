"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn, focusRing } from "./cn";
import { Portal } from "./internal";
import { CloseIcon } from "../icons";

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms before auto-dismiss; 0 to persist. Default 4000. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, "duration">> {
  id: string;
}

const DOT: Record<ToastTone, string> = {
  neutral: "bg-muted",
  info: "bg-accent-blue",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems((xs) => [
        ...xs,
        { id, title: input.title, description: input.description ?? "", tone: input.tone ?? "neutral" },
      ]);
      const duration = input.duration ?? 4000;
      if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Portal>
        <div
          className="fixed bottom-4 right-4 z-[60] flex w-[min(360px,90vw)] flex-col gap-2"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
        >
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast(): { toast: (input: ToastInput) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  // No role="status" here — the parent region is the single aria-live announcer (nesting live
  // regions double-announces).
  return (
    <div className="glass flex items-start gap-3 rounded-lg border border-strong p-3 shadow-elevated">
      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", DOT[item.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{item.title}</p>
        {item.description ? <p className="text-xs text-muted">{item.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={cn("rounded text-faint transition-colors hover:text-fg", focusRing)}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
