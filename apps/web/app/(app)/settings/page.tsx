import Link from "next/link";
import { GlassPanel, cn, focusRing } from "@/components/primitives";

const SECTIONS = [
  { href: "/settings/noise", title: "Noise budget", desc: "Tune review verbosity with a live preview." },
  { href: "/settings/billing", title: "Billing", desc: "Plan, monthly spend cap, and cost log." },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-fg">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={cn("rounded-lg", focusRing)}>
            <GlassPanel className="h-full transition-colors hover:border-strong">
              <p className="font-medium text-fg">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
