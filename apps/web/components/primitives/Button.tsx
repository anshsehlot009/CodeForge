import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";
import { cn, focusRing } from "./cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Primary = the (darker) aurora CTA gradient with on-accent (white) text + a legibility shadow.
  primary: "bg-aurora-cta text-accent-contrast shadow-ambient hover:opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]",
  secondary: "bg-elevated text-fg border border-strong hover:bg-surface",
  ghost: "text-fg hover:bg-surface",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-sm",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2 rounded-lg px-6 text-md",
};

const BASE =
  "inline-flex items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render the single child element with the button styling (e.g. wrap a <Link>) — avoids nesting <button> in <a>. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", asChild = false, children, ...props },
  ref,
) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], focusRing, className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { className: cn(classes, child.props.className) });
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});
