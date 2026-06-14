"use client";

import {
  cloneElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { cn } from "./cn";

export interface TooltipProps {
  content: ReactNode;
  side?: "top" | "bottom";
  children: ReactElement;
}

/** Shows on hover AND keyboard focus; links the trigger via aria-describedby. */
export function Tooltip({ content, side = "top", children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  // Compose with any handlers the child already has rather than clobbering them.
  const childProps = (children.props ?? {}) as {
    onMouseEnter?: (e: SyntheticEvent) => void;
    onMouseLeave?: (e: SyntheticEvent) => void;
    onFocus?: (e: SyntheticEvent) => void;
    onBlur?: (e: SyntheticEvent) => void;
  };
  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    "aria-describedby": open ? id : undefined,
    onMouseEnter: (e: SyntheticEvent) => {
      childProps.onMouseEnter?.(e);
      setOpen(true);
    },
    onMouseLeave: (e: SyntheticEvent) => {
      childProps.onMouseLeave?.(e);
      setOpen(false);
    },
    onFocus: (e: SyntheticEvent) => {
      childProps.onFocus?.(e);
      setOpen(true);
    },
    onBlur: (e: SyntheticEvent) => {
      childProps.onBlur?.(e);
      setOpen(false);
    },
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {open ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-strong bg-elevated px-2 py-1 text-xs text-fg shadow-elevated",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
