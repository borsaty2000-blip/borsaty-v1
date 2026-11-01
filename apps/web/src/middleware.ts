import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const isProduction = process.env.NODE_ENV === "production";
    const allowAdminTests = process.env.ALLOW_ADMIN_TESTS === "true";

    // 1. In production, hide and disable admin test endpoints unless explicitly enabled
    if (isProduction && !allowAdminTests) {
      return new NextResponse(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fail-closed: In production, ADMIN_TOKEN must be explicitly set and non-empty
    const rawAdminToken = process.env.ADMIN_TOKEN?.trim();
    if (isProduction && (!rawAdminToken || rawAdminToken.length === 0)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: ADMIN_TOKEN is not configured on server (fail-closed)" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const expectedToken = rawAdminToken || "borsaty_admin_dev_secret";
    if (!expectedToken || expectedToken.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: Server authentication is misconfigured (fail-closed)" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Extract and validate client token
    const headerToken = request.headers.get("x-admin-token")?.trim();
    const authHeader = request.headers.get("authorization")?.trim();
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const provided = headerToken || bearerToken;

    if (!provided || provided.length === 0 || provided !== expectedToken) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: Invalid or missing admin credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
