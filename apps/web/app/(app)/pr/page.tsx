import { GlassPanel } from "@/components/primitives";
import { PrDetailView, PrQueue } from "@/components/pr/review";
import { readPrDetail, readPrQueue } from "@/lib/data";

export default async function PrPage({ searchParams }: { searchParams: Promise<{ pr?: string }> }) {
  const { pr } = await searchParams;
  const queue = await readPrQueue();
  // Only honor ?pr= if it's a real queue id; otherwise default to the first PR.
  const selectedId = pr && queue.some((q) => q.id === pr) ? pr : (queue[0]?.id ?? "");
  const detail = await readPrDetail(selectedId);

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-lg border border-subtle bg-surface">
      <div className="flex w-80 shrink-0 flex-col overflow-auto border-r border-subtle">
        <div className="border-b border-subtle px-3 py-3">
          <h1 className="text-sm font-semibold text-fg">Review queue</h1>
        </div>
        <PrQueue items={queue} selectedId={selectedId} />
      </div>
      <div className="flex-1 overflow-auto p-5">
        {detail ? (
          <PrDetailView detail={detail} />
        ) : (
          <GlassPanel className="text-sm text-muted">Select a pull request.</GlassPanel>
        )}
      </div>
    </div>
  );
}
