import { NextResponse } from "next/server";
import { resolvePassage, lexiconStats } from "@/lib/engine/resolve";

export const runtime = "nodejs";

/** Resolve a passage once; the client runs every operation on the result. */
export async function POST(req: Request) {
  let body: { text?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").slice(0, 8000).trim();
  if (!text) return NextResponse.json({ error: "no text" }, { status: 400 });

  try {
    const passage = resolvePassage(text, body.title);
    return NextResponse.json({ passage, lexicon: lexiconStats() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "resolution failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ lexicon: lexiconStats() });
}
