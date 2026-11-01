import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    // 1. In production, disable test endpoints completely unless explicitly permitted
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_ADMIN_TESTS) {
      return new NextResponse(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Token authentication
    const expectedToken =
      process.env.ADMIN_TOKEN ||
      (process.env.NODE_ENV !== "production" ? "borsaty_admin_dev_secret" : null);

    if (!expectedToken) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: ADMIN_TOKEN is not configured on server" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const headerToken = request.headers.get("x-admin-token");
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const provided = headerToken || bearerToken;

    if (!provided || provided !== expectedToken) {
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
