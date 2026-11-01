import { NextResponse } from "next/server";
import { dlq } from "@borsaty/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const data = await dlq.list(provider, limit, offset);

  return NextResponse.json({
    success: true,
    provider: provider || "ALL",
    limit,
    offset,
    total: data.total,
    entries: data.entries,
  });
}
