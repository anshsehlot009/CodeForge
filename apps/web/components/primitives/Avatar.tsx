"use client";

import { useState } from "react";
import { cn } from "./cn";

export type Presence = "online" | "busy" | "offline";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  status?: Presence | null;
  className?: string;
}

const PRESENCE: Record<Presence, string> = {
  online: "bg-success",
  busy: "bg-warning",
  offline: "bg-muted",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = 32, status = null, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-subtle bg-elevated text-xs font-semibold text-fg",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <>
          <span aria-hidden="true">{initials(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
      {status ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg",
            PRESENCE[status],
          )}
        />
      ) : null}
    </span>
  );
}
