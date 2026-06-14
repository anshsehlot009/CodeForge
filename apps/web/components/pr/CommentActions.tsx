"use client";

import { useState } from "react";
import { cn, focusRing } from "@/components/primitives";
import { CloseIcon } from "@/components/icons";

/**
 * 👍 / dismiss for a review comment. MOCK: keeps local state only — wire to the reaction-signal
 * + dismiss endpoints (recordReactionSignal / suggestion.accepted) when they're exposed.
 */
export function CommentActions({ commentId: _commentId }: { commentId: string }) {
  const [state, setState] = useState<"idle" | "liked" | "dismissed">("idle");

  if (state === "dismissed") {
    return (
      <span className="text-xs text-muted">
        Dismissed —{" "}
        <button
          type="button"
          onClick={() => setState("idle")}
          aria-label="Undo dismiss"
          className={cn("rounded underline hover:text-fg", focusRing)}
        >
          undo
        </button>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setState((s) => (s === "liked" ? "idle" : "liked"))}
        aria-pressed={state === "liked"}
        aria-label="Helpful — raise this convention's signal"
        title="Helpful"
        className={cn(
          "rounded px-1.5 py-1 text-sm transition-colors",
          focusRing,
          state === "liked" ? "text-success" : "text-muted hover:text-fg",
        )}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => setState("dismissed")}
        aria-label="Dismiss comment"
        title="Dismiss"
        className={cn("rounded p-1 text-muted transition-colors hover:text-fg", focusRing)}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
