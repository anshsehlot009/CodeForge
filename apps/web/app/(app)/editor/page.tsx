import { GlassPanel } from "@/components/primitives";

export default function EditorPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-fg">Editor</h1>
      <GlassPanel className="text-sm text-muted">The AI-native code editor.</GlassPanel>
    </div>
  );
}
