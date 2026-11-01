import { NextResponse } from "next/server";
import { resolveInstrument } from "@borsaty/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";

  if (!q.trim()) {
    return NextResponse.json({
      resolved: null,
      alternatives: [],
    });
  }

  const result = resolveInstrument(q);
  return NextResponse.json(result);
}
