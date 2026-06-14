import { BillingPanel } from "@/components/settings/BillingPanel";
import { readBilling } from "@/lib/data";

export default async function BillingSettingsPage() {
  const billing = await readBilling();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg">Billing</h1>
        <p className="text-sm text-muted">Plan, monthly spend cap, and a per-action cost log.</p>
      </div>
      <BillingPanel initial={billing} />
    </div>
  );
}
