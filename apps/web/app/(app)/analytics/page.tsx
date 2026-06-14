import { GlassPanel } from "@/components/primitives";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-fg">Analytics</h1>
      <GlassPanel className="text-sm text-muted">
        Review throughput, suggestion acceptance, and convention signal trends.
      </GlassPanel>
    </div>
  );
}
