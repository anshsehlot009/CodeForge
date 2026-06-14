import { GlassPanel } from "@/components/primitives";
import { MeterBar, Sparkline } from "@/components/metrics";
import type { PulseData } from "@/lib/mock";

/** Slim right-rail of workspace health. Server component (static read). */
export function PulseRail({ data }: { data: PulseData }) {
  const costRatio = data.costThisMonth / data.costCap;
  const costTone = costRatio > 0.9 ? "danger" : costRatio > 0.7 ? "warning" : "accent";
  const noiseTone = data.noiseLevel / data.noiseCap > 0.85 ? "warning" : "accent";

  return (
    <aside className="flex w-full flex-col gap-3" aria-label="Pulse">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Pulse</h2>

      <GlassPanel className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Accept rate</span>
          <span className="text-lg font-bold text-fg">{Math.round(data.acceptRate * 100)}%</span>
        </div>
        <Sparkline data={data.acceptRateSeries} className="h-8 w-full" />
      </GlassPanel>

      <GlassPanel>
        <MeterBar
          label="Noise level"
          value={data.noiseLevel}
          max={data.noiseCap}
          valueLabel={`${data.noiseLevel.toFixed(1)} / ${data.noiseCap} per PR`}
          tone={noiseTone}
        />
      </GlassPanel>

      <GlassPanel>
        <MeterBar
          label="Cost this month"
          value={data.costThisMonth}
          max={data.costCap}
          valueLabel={`$${data.costThisMonth.toFixed(0)} / $${data.costCap}`}
          tone={costTone}
        />
      </GlassPanel>
    </aside>
  );
}
