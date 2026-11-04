export const runtime = 'nodejs';

import { isIP } from "node:net";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isIpBlocked, blockIp, checkRateLimit } from "@/lib/rateLimit";

const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/watchlist(.*)",
  "/alerts(.*)",
]);

const isRateLimitedAPI = createRouteMatcher([
  "/api/(.*)",
]);

const isAccountAPI = createRouteMatcher([
  "/api/portfolio(.*)",
  "/api/watchlist(.*)",
  "/api/alerts(.*)",
]);

function getClientIp(req: Request): string {
  for (const header of ["cf-connecting-ip", "x-real-ip"]) {
    const candidate = req.headers.get(header)?.trim();
    if (candidate && isIP(candidate)) {
      return candidate;
    }
  }

  // Never trust the client-controlled x-forwarded-for header as an identity.
  return "unknown";
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const clientIp = getClientIp(req);

  // 1. Permanent Firewall Block check
  if (clientIp !== "unknown" && isIpBlocked(clientIp)) {
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
  let accountUserId: string | null = null;
  const hasClerkConfiguration =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);
  if (isAccountAPI(req) && hasClerkConfiguration) {
    accountUserId = (await auth()).userId;
  }

  if (isRateLimitedAPI(req)) {
    let rateLimitConfig: { maxRequests: number; windowMs: number } | null = null;
    let rateKey = `${clientIp}:${pathname}`;

    if (pathname.startsWith("/api/admin")) {
      rateLimitConfig = { maxRequests: 10, windowMs: 60000 };
      rateKey = `${clientIp}:admin`;
    } else if (pathname.startsWith("/api/analysis")) {
      rateLimitConfig = { maxRequests: 20, windowMs: 60000 }; // 20 req/min per IP
      rateKey = `${clientIp}:analysis`;
    } else if (pathname.startsWith("/api/decision")) {
      rateLimitConfig = { maxRequests: 30, windowMs: 60000 }; // 30 req/min per IP
      rateKey = `${clientIp}:decision`;
    } else if (pathname.startsWith("/api/fundamental")) {
      rateLimitConfig = { maxRequests: 30, windowMs: 60000 }; // 30 req/min per IP
      rateKey = `${clientIp}:fundamental`;
    } else if (pathname.startsWith("/api/news")) {
      rateLimitConfig = { maxRequests: 20, windowMs: 60000 };
      rateKey = `${clientIp}:news`;
    } else if (pathname.startsWith("/api/strategies")) {
      rateLimitConfig = { maxRequests: 20, windowMs: 60000 }; // 20 req/min per IP
      rateKey = `${clientIp}:strategies`;
    } else if (pathname.startsWith("/api/screener/query")) {
      rateLimitConfig = { maxRequests: 10, windowMs: 60000 }; // 10 req/min
      rateKey = `${clientIp}:screener`;
    } else if (pathname.startsWith("/api/technical-score")) {
      rateLimitConfig = { maxRequests: 60, windowMs: 60000 }; // 60 req/min
      rateKey = `${clientIp}:technical-score`;
    } else if (pathname.startsWith("/api/calendar")) {
      rateLimitConfig = { maxRequests: 30, windowMs: 60000 }; // 30 req/min
      rateKey = `${clientIp}:calendar`;
    } else if (pathname.startsWith("/api/portfolio")) {
      rateLimitConfig = { maxRequests: 100, windowMs: 60000 }; // 100 req/min per user/IP
      if (accountUserId) {
        rateKey = `user:${accountUserId}:portfolio`;
      }
    } else if (isAccountAPI(req)) {
      rateLimitConfig = { maxRequests: 100, windowMs: 60000 };
      rateKey = `${clientIp}:${pathname}`;
    } else {
      // Apply a per-route baseline to every API endpoint, including new routes.
      rateLimitConfig = { maxRequests: 60, windowMs: 60000 };
    }

    if (rateLimitConfig) {
      const { allowed, retryAfter } = await checkRateLimit(rateKey, rateLimitConfig);
      if (!allowed) {
        if (isAccountAPI(req) && !accountUserId) {
          return new NextResponse(
            JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
            { status: 401, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
          );
        }
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
    // If a protected page is requested without Clerk, redirect with a notice.
    if (isProtectedRoute(req)) {
      if (isAccountAPI(req)) {
        return new NextResponse(JSON.stringify({ error: "Authentication service unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" },
        });
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
        JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
        { status: 403, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
      );
    }

    if (!rawAdminToken) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
        { status: 403, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
      );
    }

    // Extract and validate client token
    const headerToken = req.headers.get("x-admin-token")?.trim();
    const authHeader = req.headers.get("authorization")?.trim();
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const provided = headerToken || bearerToken;

    if (!provided || provided.length === 0 || provided !== rawAdminToken) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
        { status: 403, headers: { "Content-Type": "application/json", "X-Borsaty-Origin": "proprietary" } }
      );
    }
  }

  // API handlers return a 401 JSON response using Clerk auth; protect pages here.
  if (isProtectedRoute(req) && !isAccountAPI(req)) {
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
