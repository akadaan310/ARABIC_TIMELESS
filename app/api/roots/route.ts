import { NextResponse } from "next/server";
import "server-only";
import { allRoots, getRoot, lemmasOfRoot } from "@/lib/engine/lexdata";

export const runtime = "nodejs";

/**
 * Root search, for the composer.
 *
 * Matches the Arabic root, its own glosses, and the glosses of every lemma
 * built on it — the last of those matters, because a root's semantic field in
 * this corpus is whatever its words happened to be used for. كتب glosses
 * overwhelmingly as "the Book", so "book" reaches it and "write" does not.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40), 120);

  const rows = allRoots()
    .map((root) => ({ root, e: getRoot(root)! }))
    .filter(({ root, e }) => {
      if (root.length !== 3) return false;
      if (!q) return true;
      if (root.includes(q) || e.d.includes(q)) return true;
      if (e.g.some((g) => g.toLowerCase().includes(q))) return true;
      return lemmasOfRoot(root).some((l) =>
        l.g.some((g) => g.toLowerCase().includes(q)),
      );
    })
    .sort((a, b) => b.e.n - a.e.n)
    .slice(0, limit)
    .map(({ root, e }) => ({
      root,
      display: e.d,
      glosses: e.g.slice(0, 4),
      count: e.n,
    }));

  return NextResponse.json({ roots: rows });
}
