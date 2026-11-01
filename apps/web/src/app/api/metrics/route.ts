import { NextResponse } from "next/server";
import { metricsCollector } from "@borsaty/db";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const allowed = await metricsCollector.checkRateLimit(ip, 60);
  if (!allowed) {
    return new NextResponse("Rate limit exceeded: max 60 requests per minute\n", {
      status: 429,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const text = await metricsCollector.renderPrometheusText();

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
