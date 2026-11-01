import { NextResponse } from "next/server";
import { metricsCollector } from "@borsaty/db";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Rate limiting
  const allowed = await metricsCollector.checkRateLimit(ip, 60);
  if (!allowed) {
    return new NextResponse("Rate limit exceeded: max 60 requests per minute\n", {
      status: 429,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. In production, protect metrics with Basic Auth / Token against scrapers and competitors
  if (process.env.NODE_ENV === "production" || process.env.REQUIRE_METRICS_AUTH === "true") {
    const authHeader = request.headers.get("authorization");
    const adminToken = request.headers.get("x-admin-token");

    const expectedUser = process.env.METRICS_USER || "prometheus";
    const expectedPass = process.env.METRICS_PASSWORD || process.env.ADMIN_TOKEN;

    let authorized = false;

    if (adminToken && expectedPass && adminToken === expectedPass) {
      authorized = true;
    } else if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const credentials = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
        const [user, pass] = credentials.split(":");
        if (user === expectedUser && pass === expectedPass) {
          authorized = true;
        }
      } catch {}
    }

    if (!authorized) {
      return new NextResponse("Unauthorized: Prometheus metrics require authentication\n", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Borsaty Prometheus Metrics"',
          "Content-Type": "text/plain",
        },
      });
    }
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
