import { cn } from "./primitives/cn";

/** Inline sparkline (token-stroked). Presentational / server-safe. */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => height - ((v - min) / range) * (height - 2) - 1;
  const points = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastIndex = data.length - 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: "var(--accent-blue)" }}
      />
      <circle cx={x(lastIndex)} cy={y(data[lastIndex]!)} r={2.2} style={{ fill: "var(--accent-cyan)" }} />
    </svg>
  );
}

type MeterTone = "accent" | "warning" | "danger";

const BAR: Record<MeterTone, string> = {
  accent: "bg-aurora-cta",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Labeled progress bar (value vs max). Presentational / server-safe. */
export function MeterBar({
  label,
  value,
  max,
  valueLabel,
  tone = "accent",
}: {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  tone?: MeterTone;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-fg">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
        <div className={cn("h-full rounded-full transition-all duration-500", BAR[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
