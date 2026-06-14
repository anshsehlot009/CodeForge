import { NoiseBudgetEditor } from "@/components/settings/NoiseBudgetEditor";
import { readNoiseBudget, readSamplePr } from "@/lib/data";

// Reads the live noise budget from Supabase per request (and avoids a DB call at build time).
export const dynamic = "force-dynamic";

export default async function NoiseSettingsPage() {
  const [budget, sample] = await Promise.all([readNoiseBudget(), readSamplePr()]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg">Noise budget</h1>
        <p className="text-sm text-muted">Tune how much the reviewer says. Drag to preview on a sample PR.</p>
      </div>
      <NoiseBudgetEditor initial={budget} sample={sample} />
    </div>
  );
}
