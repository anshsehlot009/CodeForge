import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type Status = "neutral" | "info" | "success" | "warning" | "danger";

// Status colour lives in the DOT (a fill — legible in both themes); the label stays text-fg,
// avoiding low-contrast coloured text on the light "Daybreak" surfaces.
const DOT: Record<Status, string> = {
  neutral: "bg-muted",
  info: "bg-accent-blue",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  /** Pulse the dot (e.g. "reviewing…"). */
  pulse?: boolean;
}

export function StatusPill({ status = "neutral", pulse = false, className, children, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-subtle bg-elevated px-2.5 py-0.5 text-xs font-medium text-fg",
        className,
      )}
      {...props}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT[status], pulse && "animate-pulse")} />
      {children}
    </span>
  );
}
