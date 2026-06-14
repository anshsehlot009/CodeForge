"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, GlassPanel, StatusPill, cn, focusRing, useToast } from "@/components/primitives";
import { saveNoiseBudget } from "@/lib/actions";
import type { SampleComment } from "@/lib/mock";

interface Budget {
  minConfidence: number;
  maxComments: number;
}

const RANGE = cn("w-full cursor-pointer", focusRing, "rounded");

// Mirror the real reviewer's ranking (apps/github selectFindings): confidence × severity weight.
const SEVERITY_WEIGHT: Record<SampleComment["severity"], number> = { low: 1, medium: 2, high: 3 };
const score = (c: SampleComment) => c.confidence * SEVERITY_WEIGHT[c.severity];

export function NoiseBudgetEditor({
  initial,
  sample,
}: {
  initial: Budget;
  sample: { title: string; comments: SampleComment[] };
}) {
  const [minConfidence, setMinConfidence] = useState(initial.minConfidence);
  const [maxComments, setMaxComments] = useState(initial.maxComments);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // The same selection the reviewer would make: filter by confidence, rank, cap.
  const visible = useMemo(
    () =>
      sample.comments
        .filter((c) => c.confidence >= minConfidence)
        .sort((a, b) => score(b) - score(a))
        .slice(0, maxComments),
    [sample.comments, minConfidence, maxComments],
  );
  const muted = sample.comments.length - visible.length;

  const save = () =>
    startTransition(async () => {
      const res = await saveNoiseBudget({ minConfidence, maxComments });
      toast(
        res.ok
          ? { title: "Noise budget saved", tone: "success" }
          : { title: "Couldn't save", description: res.error, tone: "danger" },
      );
    });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* hero controls */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="minc" className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-fg">Min confidence</span>
            <span className="text-2xl font-bold text-fg">{Math.round(minConfidence * 100)}%</span>
          </label>
          <input
            id="minc"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className={RANGE}
            style={{ accentColor: "var(--accent-violet)" }}
          />
          <p className="text-xs text-muted">Only post findings the model is at least this sure about.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="maxc" className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-fg">Max comments</span>
            <span className="text-2xl font-bold text-fg">{maxComments}</span>
          </label>
          <input
            id="maxc"
            type="range"
            min={0}
            max={20}
            step={1}
            value={maxComments}
            onChange={(e) => setMaxComments(Number(e.target.value))}
            className={RANGE}
            style={{ accentColor: "var(--accent-violet)" }}
          />
          <p className="text-xs text-muted">Hard cap on comments per review, after ranking.</p>
        </div>

        <div>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save budget"}
          </Button>
        </div>
      </div>

      {/* live preview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Live preview</h2>
          <StatusPill status="info">
            {visible.length} shown · {muted} muted
          </StatusPill>
        </div>
        <GlassPanel className="flex flex-col gap-2">
          <p className="text-sm font-medium text-fg">{sample.title}</p>
          <AnimatePresence initial={false}>
            {visible.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                style={{ overflow: "hidden" }}
              >
                <div className="mt-2 rounded-md border border-subtle bg-surface p-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-mono">
                      {c.path}:{c.line}
                    </span>
                    <span>{Math.round(c.confidence * 100)}%</span>
                  </div>
                  <p className="text-sm text-fg">{c.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {visible.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Silent — every finding is below the threshold.</p>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  );
}
