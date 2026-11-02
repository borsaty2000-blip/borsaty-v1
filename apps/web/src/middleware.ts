export const runtime = 'nodejs';

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isIpBlocked, blockIp, checkRateLimit } from "@/lib/rateLimit";

const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/watchlist(.*)",
  "/api/portfolio(.*)",
  "/api/watchlist(.*)",
]);

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const clientIp = getClientIp(req);

  // 1. Permanent Firewall Block check
  if (isIpBlocked(clientIp)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: Access permanently blocked by security firewall" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Borsaty-Origin": "proprietary",
        },
      }
    );
  }

  // 2. Honeypot Endpoint Trap
  if (pathname === "/api/admin/secret-endpoint-do-not-use") {
    blockIp(clientIp, "Accessed honeypot trap /api/admin/secret-endpoint-do-not-use");
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied: Your IP address has been permanently flagged and blocked.",
        origin: "borsaty",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Borsaty-Origin": "proprietary",
        },
      }
    );
  }

  // 3. API Rate Limiting (Prevent Scraping & DDoS)
  if (pathname.startsWith("/api/")) {
    let rateLimitConfig: { maxRequests: number; windowMs: number } | null = null;
    let rateKey = `${clientIp}:${pathname}`;

    if (pathname.startsWith("/api/analysis")) {
      rateLimitConfig = { maxRequests: 30, windowMs: 60000 }; // 30 req/min
    } else if (pathname.startsWith("/api/screener/query")) {
      rateLimitConfig = { maxRequests: 10, windowMs: 60000 }; // 10 req/min
    } else if (pathname.startsWith("/api/technical-score")) {
      rateLimitConfig = { maxRequests: 60, windowMs: 60000 }; // 60 req/min
    } else if (pathname.startsWith("/api/calendar")) {
      rateLimitConfig = { maxRequests: 30, windowMs: 60000 }; // 30 req/min
    } else if (pathname.startsWith("/api/portfolio")) {
      rateLimitConfig = { maxRequests: 100, windowMs: 60000 }; // 100 req/min per user/IP
      try {
        const authData = await auth();
        if (authData?.userId) {
          rateKey = `user:${authData.userId}:portfolio`;
        }
      } catch {
        // Fall back to IP-based rateKey
      }
    }

    if (rateLimitConfig) {
      const { allowed, retryAfter } = await checkRateLimit(rateKey, rateLimitConfig);
      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please slow down your requests.",
            retryAfter: retryAfter || 60,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter || 60),
              "X-Borsaty-Origin": "proprietary",
            },
          }
        );
      }
    }
  }

  // 4. Validate Clerk environment configuration to prevent unexpected 500 runtime crashes
  const hasClerkPublishable = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY);

  if (!hasClerkPublishable || !hasClerkSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Clerk Middleware] Clerk keys are missing or incomplete in environment.");
    }
    // If route is protected but Clerk isn't configured, safely redirect to home with notice
    if (isProtectedRoute(req)) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Authentication service unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
        );
      }
      const homeUrl = new URL("/", req.url);
      homeUrl.searchParams.set("auth_error", "unconfigured");
      return NextResponse.redirect(homeUrl);
    }
  }

  // 5. Maintain existing /api/admin security
  if (pathname.startsWith("/api/admin")) {
    const isProduction = process.env.NODE_ENV === "production";
    const allowAdminTests = process.env.ALLOW_ADMIN_TESTS === "true";

    // In production, hide and disable admin test endpoints unless explicitly enabled
    if (isProduction && !allowAdminTests) {
      return new NextResponse(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" },
      });
    }

    // Fail-closed: In production, ADMIN_TOKEN must be explicitly set and non-empty
    const rawAdminToken = process.env.ADMIN_TOKEN?.trim();
    if (isProduction && (!rawAdminToken || rawAdminToken.length === 0)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: ADMIN_TOKEN is not configured on server (fail-closed)" }),
        { status: 401, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
      );
    }

    const expectedToken = rawAdminToken || "borsaty_admin_dev_secret";
    if (!expectedToken || expectedToken.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: Server authentication is misconfigured (fail-closed)" }),
        { status: 401, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
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
        { status: 401, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
      );
    }
  }

  // 6. Protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  response.headers.set("X-Borsaty-Origin", "proprietary");
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk frontend API routes
    "/__clerk/(.*)",
  ],
};
