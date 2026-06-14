import type { Config } from "tailwindcss";

/**
 * Tokens are defined as CSS variables in `styles/tokens.css` (the single source of
 * truth) and mapped to semantic Tailwind utilities here. Components use the utilities
 * (`bg-surface`, `text-fg`, `border-subtle`, `shadow-elevated`, `rounded-lg`,
 * `text-2xl`) — never raw hex. Colors resolve per theme via [data-theme].
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // surfaces
        sunken: "var(--bg-sunken)",
        bg: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",

        // text / foreground
        fg: "var(--text-hi)",
        muted: "var(--text-mid)",
        faint: "var(--text-lo)",

        // brand accents (namespaced so we don't clobber Tailwind's default palettes)
        accent: {
          DEFAULT: "var(--accent-violet)",
          violet: "var(--accent-violet)",
          blue: "var(--accent-blue)",
          cyan: "var(--accent-cyan)",
          contrast: "var(--accent-contrast)",
        },

        // signal colors
        human: "var(--human-amber)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },

      borderColor: {
        DEFAULT: "var(--border-subtle)",
        subtle: "var(--border-subtle)",
        strong: "var(--border-strong)",
      },

      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },

      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
      },

      fontSize: {
        xs: ["var(--fs-xs)", { lineHeight: "var(--lh-xs)" }],
        sm: ["var(--fs-sm)", { lineHeight: "var(--lh-sm)" }],
        base: ["var(--fs-base)", { lineHeight: "var(--lh-base)" }],
        md: ["var(--fs-md)", { lineHeight: "var(--lh-md)" }],
        lg: ["var(--fs-lg)", { lineHeight: "var(--lh-lg)" }],
        xl: ["var(--fs-xl)", { lineHeight: "var(--lh-xl)" }],
        "2xl": ["var(--fs-2xl)", { lineHeight: "var(--lh-2xl)" }],
        "3xl": ["var(--fs-3xl)", { lineHeight: "var(--lh-3xl)" }],
        "4xl": ["var(--fs-4xl)", { lineHeight: "var(--lh-4xl)", letterSpacing: "-0.01em" }],
        "5xl": ["var(--fs-5xl)", { lineHeight: "var(--lh-5xl)", letterSpacing: "-0.02em" }],
        "6xl": ["var(--fs-6xl)", { lineHeight: "var(--lh-6xl)", letterSpacing: "-0.02em" }],
        "7xl": ["var(--fs-7xl)", { lineHeight: "var(--lh-7xl)", letterSpacing: "-0.03em" }],
      },

      boxShadow: {
        ambient: "var(--shadow-ambient)",
        elevated: "var(--shadow-elevated)",
        "glow-ai": "var(--shadow-glow-ai)",
      },

      backgroundImage: {
        // aurora accent gradient: #7C5CFF → #4D7CFF → #34E5C8 (via tokens)
        aurora:
          "linear-gradient(90deg, var(--accent-violet), var(--accent-blue), var(--accent-cyan))",
        "aurora-radial":
          "radial-gradient(120% 120% at 0% 0%, var(--accent-violet) 0%, var(--accent-blue) 45%, var(--accent-cyan) 100%)",
        // Darker violet→blue aurora for filled CTAs so white (accent-contrast) text stays legible
        // (the full gradient's cyan end is too light under white text).
        "aurora-cta":
          "linear-gradient(90deg, color-mix(in srgb, var(--accent-violet) 85%, #000), color-mix(in srgb, var(--accent-blue) 82%, #000))",
      },
    },
  },
  plugins: [],
};

export default config;
