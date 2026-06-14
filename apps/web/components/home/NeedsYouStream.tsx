"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button, ConfidenceRing, StatusPill, cn, focusRing, type Status } from "@/components/primitives";
import { ChevronDownIcon } from "@/components/icons";
import type { StreamItem } from "@/lib/mock";

function statusPill(item: StreamItem) {
  const map: Record<StreamItem["status"], { status: Status; label: string; pulse?: boolean }> = {
    reviewed: { status: "success", label: `Reviewed · ${item.commentCount}` },
    silent: { status: "info", label: "Silent · clean" },
    reviewing: { status: "neutral", label: "Reviewing…", pulse: true },
    failing: { status: "danger", label: "Failing" },
  };
  const m = map[item.status];
  return (
    <StatusPill status={m.status} pulse={m.pulse}>
      {m.label}
    </StatusPill>
  );
}

function StreamRow({ item }: { item: StreamItem }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-subtle last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn("flex w-full items-center gap-4 rounded-md px-2 py-4 text-left", focusRing)}
      >
        <ConfidenceRing score={item.confidence} size={40} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-fg">{item.title}</span>
            <span className="shrink-0 text-xs text-muted">
              {item.repo} #{item.prNumber}
            </span>
          </span>
          <span className="block truncate text-sm text-muted">{item.reason}</span>
        </span>
        {statusPill(item)}
        <span className="shrink-0 text-xs text-muted">{item.updatedAt}</span>
        <ChevronDownIcon
          size={16}
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        style={{ overflow: "hidden" }}
      >
        <div className="flex flex-col items-start gap-3 pb-4 pl-16 pr-2">
          <p className="text-sm text-muted">{item.detail}</p>
          {item.prId ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/pr?pr=${item.prId}`}>Open in PR Review</Link>
            </Button>
          ) : (
            <span className="text-xs text-muted">Review resumes automatically once CI passes.</span>
          )}
        </div>
      </motion.div>
    </li>
  );
}

/** The single prioritized "Needs you" stream (not a card grid). */
export function NeedsYouStream({ items }: { items: StreamItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-sm text-muted">You&apos;re all caught up. 🎉</p>;
  }
  return <ul className="flex flex-col">{items.map((item) => <StreamRow key={item.id} item={item} />)}</ul>;
}
