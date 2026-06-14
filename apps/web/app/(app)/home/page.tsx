import { NeedsYouStream } from "@/components/home/NeedsYouStream";
import { PulseRail } from "@/components/home/PulseRail";
import { readPulse, readStream } from "@/lib/data";

export default async function HomePage() {
  const [stream, pulse] = await Promise.all([readStream(), readPulse()]);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold text-fg">Needs you</h1>
          <span className="text-sm text-muted">
            {stream.length} item{stream.length === 1 ? "" : "s"}
          </span>
        </div>
        <NeedsYouStream items={stream} />
      </section>
      <PulseRail data={pulse} />
    </div>
  );
}
