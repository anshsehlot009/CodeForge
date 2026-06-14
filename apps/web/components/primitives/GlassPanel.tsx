import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

/** Frosted surface (token-driven `.glass`) with an ambient shadow. */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn("glass rounded-lg p-4 shadow-ambient", className)} {...props} />;
});
