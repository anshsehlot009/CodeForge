"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./shell/ThemeProvider";
import { CommandPaletteProvider } from "./shell/CommandPalette";
import { ToastProvider } from "./primitives/Toast";

/**
 * Global providers, mounted at the root so theming, ⌘K, and toasts work everywhere — the
 * (app) shell AND /dev/styleguide. (The spec lists these under the (app) layout; hoisting to
 * the root makes them truly global, which is what "global CommandPalette" implies.)
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
