"use client";

import { useState, useTransition } from "react";
import { Button, GlassPanel, cn, focusRing, useToast } from "@/components/primitives";
import { MeterBar } from "@/components/metrics";
import { saveBillingSettings } from "@/lib/actions";
import type { BillingState } from "@/lib/mock";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        focusRing,
        checked ? "bg-aurora-cta" : "bg-elevated border border-strong",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-accent-contrast shadow-ambient transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function BillingPanel({ initial }: { initial: BillingState }) {
  const [cap, setCap] = useState(initial.cap);
  const [stopAtCap, setStopAtCap] = useState(initial.stopAtCap);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const spent = initial.costThisMonth;
  const ratio = cap > 0 ? spent / cap : 1;
  const tone = ratio > 0.9 ? "danger" : ratio > 0.7 ? "warning" : "accent";
  const capped = stopAtCap && spent >= cap;

  const save = () =>
    startTransition(async () => {
      await saveBillingSettings({ cap, stopAtCap });
      toast({ title: "Billing settings saved", tone: "success" });
    });

  return (
    <div className="flex flex-col gap-6">
      {/* current plan */}
      <GlassPanel className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Current plan</p>
          <p className="text-lg font-semibold text-fg">{initial.plan}</p>
        </div>
        <p className="text-sm text-muted">${initial.priceMonthly}/mo</p>
      </GlassPanel>

      {/* spend cap hero */}
      <GlassPanel className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">Monthly spend cap</h2>
            <p className="text-3xl font-bold text-fg">${cap}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-fg">
            <span>Stop at cap</span>
            <Switch checked={stopAtCap} onChange={setStopAtCap} label="Stop at cap" />
          </label>
        </div>

        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={cap}
          onChange={(e) => setCap(Number(e.target.value))}
          aria-label="Monthly spend cap (USD)"
          className={cn("w-full cursor-pointer rounded", focusRing)}
          style={{ accentColor: "var(--accent-violet)" }}
        />

        <MeterBar
          label={capped ? "Spent this month — cap reached, paused" : "Spent this month"}
          value={spent}
          max={cap}
          valueLabel={`$${spent.toFixed(2)} / $${cap}`}
          tone={capped ? "danger" : tone}
        />

        <p className="text-xs text-muted">Never charged for idle time or failed runs.</p>

        <div>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </GlassPanel>

      {/* per-action cost log */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-fg">Cost log</h2>
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Time</th>
                <th scope="col" className="px-3 py-2 font-medium">Action</th>
                <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Model</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {initial.log.map((row) => (
                <tr key={row.id} className="border-t border-subtle">
                  <td className="px-3 py-2 font-mono text-xs text-muted">{row.at}</td>
                  <td className="px-3 py-2 text-fg">{row.action}</td>
                  <td className="hidden px-3 py-2 text-muted sm:table-cell">{row.model}</td>
                  <td className="px-3 py-2 text-right font-mono text-fg">
                    {row.cost === 0 ? "$0.00" : `$${row.cost.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">Local-embedding runs are free; failed runs aren&apos;t billed.</p>
      </section>
    </div>
  );
}
