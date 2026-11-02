import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/watchlist(.*)",
  "/api/watchlist(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Maintain existing /api/admin security
  if (pathname.startsWith("/api/admin")) {
    const isProduction = process.env.NODE_ENV === "production";
    const allowAdminTests = process.env.ALLOW_ADMIN_TESTS === "true";

    // In production, hide and disable admin test endpoints unless explicitly enabled
    if (isProduction && !allowAdminTests) {
      return new NextResponse(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fail-closed: In production, ADMIN_TOKEN must be explicitly set and non-empty
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

    // Extract and validate client token
    const headerToken = req.headers.get("x-admin-token")?.trim();
    const authHeader = req.headers.get("authorization")?.trim();
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const provided = headerToken || bearerToken;

    if (!provided || provided.length === 0 || provided !== expectedToken) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: Invalid or missing admin credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
