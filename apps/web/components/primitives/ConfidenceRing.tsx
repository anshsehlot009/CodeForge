import { useId } from "react";
import { cn } from "./cn";

export interface ConfidenceRingProps {
  /** 0–1. */
  score: number;
  size?: number;
  strokeWidth?: number;
  /** Show the percentage in the center. */
  showLabel?: boolean;
  className?: string;
}

/** Radial gauge that fills by score, stroked with the aurora gradient. */
export function ConfidenceRing({
  score,
  size = 48,
  strokeWidth = 5,
  showLabel = true,
  className,
}: ConfidenceRingProps) {
  const clamped = Math.min(1, Math.max(0, score));
  const pct = Math.round(clamped * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const gradientId = useId();

  return (
    <div
      role="img"
      aria-label={`Confidence ${pct}%`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent-violet)" }} />
            <stop offset="50%" style={{ stopColor: "var(--accent-blue)" }} />
            <stop offset="100%" style={{ stopColor: "var(--accent-cyan)" }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: "var(--border-subtle)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showLabel ? (
        <span className="absolute text-xs font-semibold text-fg">{pct}</span>
      ) : null}
    </div>
  );
}
