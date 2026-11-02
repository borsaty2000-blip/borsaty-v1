import { NextResponse } from "next/server";
import { dlq } from "@borsaty/db";
import { validateAdminAuth } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = validateAdminAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to replay DLQ";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
