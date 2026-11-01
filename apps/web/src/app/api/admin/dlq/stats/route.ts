import { NextResponse } from "next/server";
import { dlq } from "@borsaty/db";

export async function GET() {
  const stats = await dlq.getStats();
  return NextResponse.json({
    success: true,
    ...stats,
  });
}
