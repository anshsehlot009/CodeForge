import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type PillProps = HTMLAttributes<HTMLSpanElement>;

/** Small neutral rounded label (e.g. the branch pill). Text stays AA-legible in both themes. */
export function Pill({ className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-subtle bg-elevated px-2.5 py-0.5 text-xs font-medium text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
