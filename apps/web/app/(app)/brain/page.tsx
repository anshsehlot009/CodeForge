import { GlassPanel } from "@/components/primitives";

export default function BrainPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-fg">Brain</h1>
      <GlassPanel className="text-sm text-muted">
        The repo&apos;s learned conventions and retrieval index.
      </GlassPanel>
    </div>
  );
}
