"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeSwitch, useTheme } from "@/components/shell/ThemeProvider";
import { PrimitivesShowcase } from "./PrimitivesShowcase";

/* ── token manifests (names are literal so Tailwind keeps the classes) ───────── */

const SURFACES = [
  { name: "bg/sunken", v: "--bg-sunken", cls: "bg-sunken" },
  { name: "bg/base", v: "--bg-base", cls: "bg-bg" },
  { name: "bg/surface", v: "--bg-surface", cls: "bg-surface" },
  { name: "bg/elevated", v: "--bg-elevated", cls: "bg-elevated" },
] as const;

const ACCENTS = [
  { name: "accent/violet", v: "--accent-violet", cls: "bg-accent-violet" },
  { name: "accent/blue", v: "--accent-blue", cls: "bg-accent-blue" },
  { name: "accent/cyan", v: "--accent-cyan", cls: "bg-accent-cyan" },
] as const;

const SIGNALS = [
  { name: "human/amber", v: "--human-amber", cls: "bg-human" },
  { name: "success", v: "--success", cls: "bg-success" },
  { name: "warning", v: "--warning", cls: "bg-warning" },
  { name: "danger", v: "--danger", cls: "bg-danger" },
] as const;

const TEXTS = [
  { name: "text/hi", v: "--text-hi", cls: "text-fg" },
  { name: "text/mid", v: "--text-mid", cls: "text-muted" },
  { name: "text/lo", v: "--text-lo", cls: "text-faint" },
] as const;

const BORDERS = [
  { name: "border/subtle", v: "--border-subtle", cls: "border-subtle" },
  { name: "border/strong", v: "--border-strong", cls: "border-strong" },
] as const;

const RADII = [
  { name: "xs · 6", cls: "rounded-xs" },
  { name: "sm · 10", cls: "rounded-sm" },
  { name: "md · 14", cls: "rounded-md" },
  { name: "lg · 20", cls: "rounded-lg" },
  { name: "xl · 28", cls: "rounded-xl" },
  { name: "full", cls: "rounded-full" },
] as const;

const SPACES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const;

const TYPE = [
  { name: "xs", cls: "text-xs", v: "--fs-xs", lh: "--lh-xs" },
  { name: "sm", cls: "text-sm", v: "--fs-sm", lh: "--lh-sm" },
  { name: "base", cls: "text-base", v: "--fs-base", lh: "--lh-base" },
  { name: "md", cls: "text-md", v: "--fs-md", lh: "--lh-md" },
  { name: "lg", cls: "text-lg", v: "--fs-lg", lh: "--lh-lg" },
  { name: "xl", cls: "text-xl", v: "--fs-xl", lh: "--lh-xl" },
  { name: "2xl", cls: "text-2xl", v: "--fs-2xl", lh: "--lh-2xl" },
  { name: "3xl", cls: "text-3xl", v: "--fs-3xl", lh: "--lh-3xl" },
  { name: "4xl", cls: "text-4xl", v: "--fs-4xl", lh: "--lh-4xl" },
  { name: "5xl", cls: "text-5xl", v: "--fs-5xl", lh: "--lh-5xl" },
  { name: "6xl", cls: "text-6xl", v: "--fs-6xl", lh: "--lh-6xl" },
  { name: "7xl", cls: "text-7xl", v: "--fs-7xl", lh: "--lh-7xl" },
] as const;

const SHADOWS = [
  { name: "ambient", cls: "shadow-ambient" },
  { name: "elevated", cls: "shadow-elevated" },
  { name: "glow/ai", cls: "shadow-glow-ai" },
] as const;

const ALL_VARS = [
  ...SURFACES,
  ...ACCENTS,
  ...SIGNALS,
  ...TEXTS,
  ...BORDERS,
].map((t) => t.v);

const TYPE_VARS = TYPE.flatMap((t) => [t.v, t.lh]);

/* ── layout helpers ──────────────────────────────────────────────────────────── */

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3 border-b border-subtle pb-2">
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-muted">{children}</span>;
}

/* ── page ────────────────────────────────────────────────────────────────────── */

export default function StyleguidePage() {
  const { resolved: activeTheme } = useTheme();
  const [resolved, setResolved] = useState<Record<string, string>>({});

  // Re-read resolved CSS variables when the theme changes. rAF defers the read until after
  // ThemeProvider has applied the new data-theme to <html>.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const cs = getComputedStyle(document.documentElement);
      setResolved(
        Object.fromEntries([...ALL_VARS, ...TYPE_VARS].map((v) => [v, cs.getPropertyValue(v).trim()])),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTheme]);

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-fg">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        {/* header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="aurora-text text-5xl font-bold">Code Forge</h1>
            <p className="text-sm text-muted">
              Design system styleguide — {activeTheme === "dark" ? "Midnight" : "Daybreak"}
            </p>
          </div>
          <ThemeSwitch />
        </header>

        {/* colors */}
        <Section title="Surfaces" hint="bg/* — sunken · base · surface · elevated">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SURFACES.map((t) => (
              <div key={t.v} className="flex flex-col gap-2">
                <div className={`${t.cls} h-20 rounded-lg border border-subtle`} />
                <div className="flex flex-col">
                  <span className="text-sm text-fg">{t.name}</span>
                  <Mono>{resolved[t.v] || t.v}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Accents" hint="the aurora gradient stops">
          <div className="grid grid-cols-3 gap-4">
            {ACCENTS.map((t) => (
              <div key={t.v} className="flex flex-col gap-2">
                <div className={`${t.cls} h-20 rounded-lg`} />
                <div className="flex flex-col">
                  <span className="text-sm text-fg">{t.name}</span>
                  <Mono>{resolved[t.v] || t.v}</Mono>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-aurora h-12 rounded-lg" />
        </Section>

        <Section title="Signals" hint="human + status">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SIGNALS.map((t) => (
              <div key={t.v} className="flex flex-col gap-2">
                <div className={`${t.cls} h-20 rounded-lg`} />
                <div className="flex flex-col">
                  <span className="text-sm text-fg">{t.name}</span>
                  <Mono>{resolved[t.v] || t.v}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Text & borders">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              {TEXTS.map((t) => (
                <div key={t.v} className="flex items-baseline justify-between">
                  <span className={`${t.cls} text-lg`}>The quick brown fox — {t.name}</span>
                  <Mono>{resolved[t.v] || t.v}</Mono>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {BORDERS.map((t) => (
                <div key={t.v} className="flex flex-col gap-2">
                  <div className={`${t.cls} h-16 rounded-lg border-2 bg-surface`} />
                  <div className="flex flex-col">
                    <span className="text-sm text-fg">{t.name}</span>
                    <Mono>{resolved[t.v] || t.v}</Mono>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* radius */}
        <Section title="Radius" hint="xs6 · sm10 · md14 · lg20 · xl28 · full">
          <div className="flex flex-wrap gap-6">
            {RADII.map((r) => (
              <div key={r.cls} className="flex flex-col items-center gap-2">
                <div className={`${r.cls} h-20 w-20 border border-strong bg-elevated`} />
                <Mono>{r.name}</Mono>
              </div>
            ))}
          </div>
        </Section>

        {/* spacing */}
        <Section title="Spacing" hint="4px base unit">
          <div className="flex flex-col gap-2">
            {SPACES.map((n) => (
              <div key={n} className="flex items-center gap-3">
                <Mono>
                  space-{n} · {n * 4}px
                </Mono>
                <div
                  className="h-3 rounded-xs bg-accent-violet"
                  style={{ width: `var(--space-${n})` }}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* type */}
        <Section title="Type scale" hint="font-size / line-height">
          <div className="flex flex-col gap-3">
            {TYPE.map((t) => (
              <div key={t.cls} className="flex items-baseline gap-4">
                <Mono>
                  <span className="inline-block w-10">{t.name}</span>
                  <span className="inline-block w-24">
                    {resolved[t.v] || "·"} / {resolved[t.lh] || "·"}
                  </span>
                </Mono>
                <span className={`${t.cls} text-fg`}>Forge ahead with retrieval.</span>
              </div>
            ))}
          </div>
        </Section>

        {/* shadows */}
        <Section title="Elevation" hint="ambient · elevated · glow/ai">
          <div className="grid grid-cols-1 gap-8 py-4 sm:grid-cols-3">
            {SHADOWS.map((s) => (
              <div key={s.cls} className="flex flex-col items-center gap-3">
                <div className={`${s.cls} h-24 w-full rounded-lg bg-elevated`} />
                <Mono>shadow-{s.name}</Mono>
              </div>
            ))}
          </div>
        </Section>

        {/* utilities */}
        <Section title="Utilities" hint=".glass · .aurora-text · .glow-ai · .bg-noise">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* glass over an aurora field with sharp-edged content, so the blur shows */}
            <div className="bg-aurora-radial relative h-44 overflow-hidden rounded-lg p-4">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <span className="absolute left-4 top-2 text-7xl font-black text-fg opacity-70">AI</span>
                <div className="absolute right-5 top-6 h-12 w-12 rounded-xs bg-accent-cyan" />
                <div className="absolute bottom-5 left-12 h-7 w-20 bg-human" />
                <div className="absolute bottom-9 right-14 h-7 w-7 rounded-full bg-danger" />
              </div>
              <div className="glass absolute inset-4 flex items-center justify-center rounded-md">
                <span className="text-sm font-medium text-fg">.glass — blur + saturate</span>
              </div>
            </div>

            {/* aurora text + glow */}
            <div className="flex flex-col gap-6 rounded-lg border border-subtle bg-surface p-4">
              <span className="aurora-text text-3xl font-bold">.aurora-text</span>
              <div className="glow-ai flex h-20 items-center justify-center rounded-md bg-elevated">
                <span className="text-sm text-fg">.glow-ai</span>
              </div>
            </div>

            {/* noise */}
            <div className="bg-noise flex h-44 items-center justify-center rounded-lg border border-subtle bg-surface sm:col-span-2">
              <span className="text-sm text-muted">.bg-noise — subtle 2.5% film grain</span>
            </div>
          </div>
        </Section>

        <Section title="Primitives" hint="components/primitives — all token-driven, dark + light">
          <PrimitivesShowcase />
        </Section>

        <footer className="border-t border-subtle pt-4 text-xs text-faint">
          Every swatch reads its value live from{" "}
          <span className="font-mono">styles/tokens.css</span> via the active{" "}
          <span className="font-mono">[data-theme]</span>.
        </footer>
      </div>
    </main>
  );
}
