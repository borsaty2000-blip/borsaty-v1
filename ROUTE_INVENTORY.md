# Route Inventory and Phase 1 Security Audit

Inventory generated from `apps/web/src/app` and `apps/web/src/middleware.ts`.
Dynamic segments are shown in brackets; grouped API rows list each matching
handler path.

## Summary

- **Pages:** 21
- **API route handlers:** 58
- **Explicit page-level ErrorBoundary wrappers:** 12 page modules
- **Segment-specific `error.tsx` / `loading.tsx`:** 0
- **Root fallbacks:** `app/error.tsx`, `app/loading.tsx`, and `app/not-found.tsx`
- **APIs covered by middleware rate limiting:** 58
- **Additional APIs with route-handler rate limiting:** 4 (some overlap middleware)
- **APIs without a detected rate limiter:** 0
- **Page transitions:** No global `template.tsx`; animations are component-level.

## Page Routes

“Auth” describes route-level enforcement, not an informal expectation that a
user sign in. Portfolio, watchlist, and alerts page routes are protected by
Clerk middleware. Their APIs rely on handler-level user checks to return 401
JSON when signed out.

| Route | Type | Auth | Rate Limit | Error Boundary | Motion |
|---|---|---|---|---|---|
| `/` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/about` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/alerts` | Page | Middleware Clerk protection | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/calendar` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/changelog` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/compare` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/docs` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/news` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/portfolio` | Page | Middleware Clerk protection | N/A | Root `error.tsx`; explicit page wrapper | Component-level |
| `/privacy` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/screener` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/signals` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/sign-in/[[...sign-in]]` | Page | Public sign-in flow | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/sign-up/[[...sign-up]]` | Page | Public sign-up flow | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/status` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/stock/[symbol]` | Page | Public | N/A | Root `error.tsx`; explicit page wrapper | Component-level |
| `/stock/[symbol]/report` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/strategies` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/strategies/[name]` | Page | Public | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |
| `/terms` | Page | Public | N/A | Root `error.tsx`; explicit wrapper | Component-level |
| `/watchlist` | Page | Middleware Clerk protection | N/A | Root `error.tsx`; no page-source wrapper found | Component-level |

The root `loading.tsx` is the only app loading boundary. There are no
route-specific loading skeletons or `error.tsx` files. Root `error.tsx` does
not catch failures in the root layout itself.

## API Route Handlers

All rows are Next.js route handlers. “No route boundary” is expected for JSON
handlers: errors must be handled by the route itself. Motion is not applicable.
Rate limits below reflect the current middleware and handler implementations.

| Route(s) | Type | Auth | Rate Limit | Error Boundary | Motion |
|---|---|---|---|---|---|
| `/api/admin/call-provider`, `/api/admin/dlq`, `/api/admin/dlq/replay`, `/api/admin/dlq/stats`, `/api/admin/simulate-failure` (5) | API | Admin token; production routes return 404 unless `ALLOW_ADMIN_TESTS=true` | Middleware 10/min/IP | Route-level response handling | N/A |
| `/api/ai-narrator` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/alerts`, `/api/alerts/[id]` (2) | API | User auth checked in handlers | Middleware 100/min/IP per route | Route-level response handling | N/A |
| `/api/analysis/[symbol]/full` (1) | API | Public | Middleware 20/min/IP; handler also limits to 60/min/IP | Route-level response handling | N/A |
| `/api/backtest/[symbol]`, `/api/backtest/leaderboard` (2) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/calendar` (1) | API | Public | Middleware 30/min/IP | Route-level response handling | N/A |
| `/api/classical/[symbol]`, `/api/classical/[symbol]/near-misses` (2) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/company` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/decision/[symbol]` (1) | API | Public | Middleware 30/min/IP | Route-level response handling | N/A |
| `/api/elliott/[symbol]` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/fundamental/analyst-consensus/[symbol]`, `/api/fundamental/dividends/[symbol]`, `/api/fundamental/fair-value/[symbol]`, `/api/fundamental/fair-value/[symbol]/history`, `/api/fundamental/financials/[symbol]` (5) | API | Public | Middleware 30/min/IP | Route-level response handling | N/A |
| `/api/harmonic/[symbol]`, `/api/harmonic/[symbol]/prz` (2) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/health/data` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/historical` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/indicators/[symbol]` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/instruments`, `/api/instruments/[symbol]`, `/api/instruments/resolve` (3) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/intelligence/earnings/[symbol]` (1) | API | Public | Handler 20/min/IP (in-memory) | Route-level response handling | N/A |
| `/api/intelligence/earnings/[symbol]/history`, `/api/intelligence/insider/[symbol]`, `/api/intelligence/insider/[symbol]/history` (3) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/market/conviction`, `/api/market/overview`, `/api/market/pulse` (3) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/metrics` (1) | API | Token/Basic Auth in production or when required by config | Handler 60/min/IP | Route-level response handling | N/A |
| `/api/narrate/[symbol]` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/news/[symbol]`, `/api/news/market` (2) | API | Public | Middleware 20/min/IP, shared across news routes | Route-level response handling | N/A |
| `/api/opportunities` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/pivots/[symbol]` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/portfolio`, `/api/portfolio/transaction`, `/api/portfolio/transaction/[id]` (3) | API | Handler user checks (401 JSON when signed out) | Middleware 100/min/user or IP | Route-level response handling | N/A |
| `/api/quotes` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/report/[symbol]/pdf` (1) | API | Public | Middleware 60/min/IP per route; endpoint currently returns 410 | Route-level response handling | N/A |
| `/api/screener/query` (1) | API | Public | Middleware 10/min/IP; handler 10/min/user and 30/min/IP | Route-level response handling | N/A |
| `/api/signals` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/strategies`, `/api/strategies/[strategy]`, `/api/strategies/[strategy]/backtest`, `/api/strategies/[strategy]/picks` (4) | API | Public | Middleware 20/min/IP | Route-level response handling | N/A |
| `/api/technical-score/[symbol]` (1) | API | Public | Middleware 60/min/IP | Route-level response handling | N/A |
| `/api/trade-plan/[symbol]` (1) | API | Public | Middleware 60/min/IP per route | Route-level response handling | N/A |
| `/api/watchlist`, `/api/watchlist/[symbol]` (2) | API | Handler user checks (401 JSON when signed out) | Middleware 100/min/IP per route | Route-level response handling | N/A |

## Phase 1 Findings

1. **API rate limits now cover all handlers.** The middleware matches every
   `/api/*` route. Existing endpoint-specific limits remain; otherwise the
   middleware applies a 60/min/IP per-route baseline. News uses a shared
   20/min/IP bucket and admin endpoints use 10/min/IP. Four handlers also
   enforce route-local limits. The backing limiter can still fall back to
   process-local memory if Redis is unavailable.
2. **Account pages now require Clerk authentication in middleware.**
   Portfolio, watchlist, and alerts redirect signed-out page requests.
   Account APIs keep their handler-level identity checks and return 401 JSON
   for unauthenticated callers.
3. **Rate-limit identity uses trusted-edge headers only.** `CF-Connecting-IP`
   and `X-Real-IP` are accepted after IP-address validation. The
   client-controlled `X-Forwarded-For` header is ignored; requests without a
   trusted address share a conservative `unknown` bucket. Origin access should
   remain restricted to the configured edge proxy.
4. **Admin credential failures consistently return 403.** A disabled admin
   test route still returns 404 in production to keep that endpoint hidden.
5. **Fallback coverage is global, not segment-specific.** All routes share
   root `loading.tsx`, `error.tsx`, and `not-found.tsx`; only 12 page modules
   contain an explicit ErrorBoundary wrapper. Pages that need targeted recovery
   do not yet have route-specific boundaries.
6. **No global page-transition template exists.** Motion is used in selected
   client components, but reduced-motion handling and route-wide transitions
   are not established centrally.

## Scope Notes

This is a route and control-coverage inventory, not a penetration test. The
counts identify paths with visible controls in this codebase; they do not
verify deployed proxy configuration, runtime Clerk settings, or production
Redis behavior.
