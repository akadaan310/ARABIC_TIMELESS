import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import Link from "next/link";
import "../globals.css";

/**
 * Arabic Timeless's own chrome, scoped to this subtree — moved out of the
 * root layout (which now belongs to EngineLab, see app/layout.tsx) without
 * changing anything about how this app looks or behaves at its own routes.
 * A nested layout can't redeclare <html>/<body> (only the root layout may),
 * so the font-variable class and body-level styling that used to live on
 * those elements now live on this wrapping <div> instead — Tailwind's CSS
 * custom properties still cascade to every descendant exactly the same way.
 */

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arabic Timeless — the twenty layers, running",
  description:
    "An engine for the twenty layers of dotless Arabic, applied to modern written Arabic.",
};

const NAV = [
  { href: "/arabic-timeless", label: "Open sesame", ar: "إفتح" },
  { href: "/arabic-timeless/read", label: "Read", ar: "القراءة" },
  { href: "/arabic-timeless/compose", label: "Compose", ar: "التأليف" },
  { href: "/arabic-timeless/live", label: "Live", ar: "الحوار" },
  { href: "/arabic-timeless/workspace", label: "Workspace", ar: "المشغل" },
  { href: "/arabic-timeless/alphabet", label: "Alphabet", ar: "الحروف" },
  { href: "/arabic-timeless/layers", label: "Layers", ar: "الطبقات" },
  { href: "/arabic-timeless/invariance", label: "Invariance", ar: "الثابت" },
];

export default function ArabicTimelessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${amiri.variable} min-h-screen bg-ink text-bright antialiased grain`}>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <div className="flex items-center gap-3 py-3">
            <Link href="/arabic-timeless" className="flex items-baseline gap-2">
              <span className="rasm text-lg leading-none">ٮٯٮ</span>
              <span className="text-[12px] font-medium tracking-wide text-bright">
                ARABIC TIMELESS
              </span>
            </Link>
            {/*
              A plain <a>, not next/link's <Link>: EngineLab is a separate,
              independently built app mounted only for asset hosting (see
              app/page.tsx) — crossing into it must always be a full browser
              navigation, never Next's client-side router, or EngineLab's
              script (already evaluated once) won't re-run and its UI won't
              remount.
            */}
            <a
              href="/"
              className="ms-auto shrink-0 rounded px-2.5 py-1.5 text-[11px] text-dim transition hover:bg-ink-3 hover:text-bright"
            >
              ← EngineLab
            </a>
          </div>
          <nav className="scroll-x -mx-1 flex gap-0.5 pb-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="shrink-0 rounded px-2.5 py-1.5 text-[12px] text-mid transition active:bg-ink-3 hover:bg-ink-3 hover:text-bright"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        {children}
      </main>

      <footer className="mt-12 border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-6 text-[11px] leading-relaxed text-dim sm:px-5">
          Every number this app shows is computed, not asserted. The engine
          confirms what a patient hand would find — it does not replace it.
        </div>
      </footer>
    </div>
  );
}
