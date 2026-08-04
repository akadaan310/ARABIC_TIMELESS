import type { Metadata, Viewport } from "next";
import { Amiri } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
};

const NAV = [
  { href: "/", label: "Open sesame", ar: "إفتح" },
  { href: "/read", label: "Read", ar: "القراءة" },
  { href: "/compose", label: "Compose", ar: "التأليف" },
  { href: "/live", label: "Live", ar: "الحوار" },
  { href: "/workspace", label: "Workspace", ar: "المشغل" },
  { href: "/alphabet", label: "Alphabet", ar: "الحروف" },
  { href: "/layers", label: "Layers", ar: "الطبقات" },
  { href: "/invariance", label: "Invariance", ar: "الثابت" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={amiri.variable}>
      <body className="min-h-screen bg-ink text-bright antialiased grain">
        <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-5">
            <div className="flex items-center gap-3 py-3">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="rasm text-lg leading-none">ٮٯٮ</span>
                <span className="text-[12px] font-medium tracking-wide text-bright">
                  ARABIC TIMELESS
                </span>
              </Link>
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
      </body>
    </html>
  );
}
