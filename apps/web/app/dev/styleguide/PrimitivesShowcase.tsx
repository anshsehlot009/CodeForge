"use client";

import { useState, type ReactNode } from "react";
import {
  Avatar,
  Button,
  ConfidenceRing,
  GlassPanel,
  Pill,
  Sheet,
  StatusPill,
  Tooltip,
  useToast,
} from "@/components/primitives";

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-subtle pb-6 last:border-0">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function PrimitivesShowcase() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-6">
      <Row title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button disabled>Disabled</Button>
      </Row>

      <Row title="GlassPanel">
        <div className="bg-aurora-radial w-full max-w-md rounded-lg p-6">
          <GlassPanel>
            <p className="text-sm text-fg">Frosted glass over an aurora field.</p>
          </GlassPanel>
        </div>
      </Row>

      <Row title="Pill / StatusPill">
        <Pill>
          <span aria-hidden="true" className="text-faint">
            ⎇
          </span>
          main
        </Pill>
        <StatusPill status="success">Passing</StatusPill>
        <StatusPill status="warning">Flaky</StatusPill>
        <StatusPill status="danger">Failing</StatusPill>
        <StatusPill status="info">Queued</StatusPill>
        <StatusPill status="neutral" pulse>
          Reviewing…
        </StatusPill>
      </Row>

      <Row title="ConfidenceRing">
        <ConfidenceRing score={0.32} />
        <ConfidenceRing score={0.61} />
        <ConfidenceRing score={0.86} size={64} strokeWidth={6} />
        <ConfidenceRing score={1} size={40} showLabel={false} />
      </Row>

      <Row title="Avatar">
        <Avatar name="Ada Lovelace" status="online" />
        <Avatar name="Grace Hopper" status="busy" size={40} />
        <Avatar name="Alan Turing" status="offline" size={48} />
        <Avatar name="Linus T" src="https://avatars.githubusercontent.com/u/0" size={40} />
        <div className="flex -space-x-2">
          {["Ada Lovelace", "Grace Hopper", "Alan Turing"].map((n) => (
            <Avatar key={n} name={n} size={28} className="ring-2 ring-bg" />
          ))}
        </div>
      </Row>

      <Row title="Tooltip">
        <Tooltip content="Hover or focus me">
          <Button variant="secondary">Hover for tooltip</Button>
        </Tooltip>
        <Tooltip content="Below" side="bottom">
          <Button variant="ghost">Bottom</Button>
        </Tooltip>
      </Row>

      <Row title="Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Review settings"
          description="Focus-trapped, Escape or click-away to close."
        >
          <div className="flex flex-col gap-3 text-sm text-muted">
            <p>This panel traps focus and locks page scroll while open.</p>
            <Button variant="primary" onClick={() => setSheetOpen(false)}>
              Done
            </Button>
          </div>
        </Sheet>
      </Row>

      <Row title="Toast">
        <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Success</Button>
        <Button onClick={() => toast({ title: "Heads up", description: "Re-running review.", tone: "info" })}>
          Info
        </Button>
        <Button onClick={() => toast({ title: "Rate limited", tone: "warning" })}>Warning</Button>
        <Button onClick={() => toast({ title: "Failed to post review", tone: "danger" })}>Danger</Button>
      </Row>
    </div>
  );
}
