import { NextResponse } from "next/server";
import { dlq } from "@borsaty/db";
import { validateAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = validateAdminAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  const stats = await dlq.getStats();
  return NextResponse.json({
    success: true,
    ...stats,
  });
}
