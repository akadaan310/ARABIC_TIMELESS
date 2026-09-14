import type { Metadata, Viewport } from "next";

/**
 * Minimal root layout. The root route ("/") serves EngineLab — an
 * independently built and versioned static app (apps/engine-lab) mounted
 * here as pre-rendered HTML/asset references (see app/page.tsx) — so this
 * layout intentionally carries no arabic-timeless-specific fonts, global
 * CSS, or chrome. Arabic Timeless itself now lives under /arabic-timeless
 * and supplies its own styling from its own nested layout
 * (app/arabic-timeless/layout.tsx), scoped to that subtree only.
 */

export const metadata: Metadata = {
  title: "EngineLab",
  description: "An experimental laboratory for composing, executing, and challenging Engines built on the Engine SDK.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0d0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
