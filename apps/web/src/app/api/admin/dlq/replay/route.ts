import { NextResponse } from "next/server";
import { dlq } from "@borsaty/db";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "sahmk";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const result = await dlq.replay(provider, limit);
    return NextResponse.json({
      success: true,
      provider,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to replay DLQ",
      },
      { status: 400 }
    );
  }
}
