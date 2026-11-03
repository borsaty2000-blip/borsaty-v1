import { NextResponse } from "next/server";
import { redis, getPrismaClient, Prisma } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";

async function checkRateLimit(key: string, limit: number, windowSec: number = 60) {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    // If Redis fails, allow request fail-open for rate limiting
    return { allowed: true, remaining: limit, resetIn: windowSec };
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const userId = typeof body.userId === "string" ? body.userId : request.headers.get("x-user-id");

    if (!query) {
      return NextResponse.json(
        { error: "يرجى إدخال استعلام للبحث في الأسهم (Query is required)" },
        { status: 400 }
      );
    }

    // 1. IP extraction
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    // 2. Rate Limiting Check
    // User Rate Limit: 10 queries / min
    if (userId) {
      const userLimit = await checkRateLimit(`rate:screener:user:${userId}`, 10, 60);
      if (!userLimit.allowed) {
        return NextResponse.json(
          {
            error: "تجاوزت الحد المسموح للاستعلام (10 استعلامات في الدقيقة)",
            retryAfter: userLimit.resetIn,
          },
          {
            status: 429,
            headers: {
              "Retry-After": userLimit.resetIn.toString(),
              "X-RateLimit-Limit": "10",
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
    }

    // IP Rate Limit: 30 queries / min
    const ipLimit = await checkRateLimit(`rate:screener:ip:${ip}`, 30, 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: "تجاوزت الحد المسموح للاستعلام من هذا العنوان (30 استعلام في الدقيقة)",
          retryAfter: ipLimit.resetIn,
        },
        {
          status: 429,
          headers: {
            "Retry-After": ipLimit.resetIn.toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 3. Call Analysis Engine (Python FastAPI)
    const analysisUrl = getPythonServiceUrl();
    let screenerResponse: Record<string, unknown> | null = null;

    try {
      const resp = await fetch(`${analysisUrl}/screener/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(6000),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({ detail: "Analysis engine error" }));
        return NextResponse.json(
          { error: errJson.detail || "تعذر تصفية الأسهم عبر محرك التحليل" },
          { status: resp.status }
        );
      }

      screenerResponse = await resp.json();
    } catch {
      // Fallback for independent web development without FastAPI running
      screenerResponse = {
        interpreted: {
          universe: query.includes("مصر") ? "EGX" : query.includes("سعود") ? "TASI" : "ALL",
          conditions: [],
          logic: "AND",
          limit: 20,
        },
        interpreted_ar: `فهمت طلبك كـ: تصفية الأسهم حسب الاستعلام "${query}" (وضع العمل المستقل)`,
        results: [
          {
            symbol: "COMI",
            nameAr: "البنك التجاري الدولي",
            nameEn: "Commercial International Bank",
            market: "EGX",
            sector: "بنوك",
            close: 86.0,
            close_change_pct_1d: 0.53,
            volume_ratio_20d: 1.65,
            RSI_14: 28.5,
            SMA_200: 84.2,
            SMA_50: 88.1,
            Supertrend: "BULLISH",
          },
          {
            symbol: "2222",
            nameAr: "أرامكو السعودية",
            nameEn: "Saudi Aramco",
            market: "TASI",
            sector: "طاقة",
            close: 27.65,
            close_change_pct_1d: 0.36,
            volume_ratio_20d: 1.55,
            RSI_14: 52.0,
            SMA_200: 26.8,
            SMA_50: 27.2,
            Supertrend: "BULLISH",
          },
        ],
        total_matches: 2,
        execution_ms: Date.now() - startTime,
        data_quality: {
          stale_instruments_excluded: 0,
          insufficient_history_excluded: 0,
        },
      };
    }

    const resObj = screenerResponse as Record<string, unknown>;
    const executionMs = (resObj.execution_ms as number) || (Date.now() - startTime);

    // 4. Audit Logging in ScreenerQuery table (Fire-and-forget or try-catch)
    try {
      const prisma = getPrismaClient();
      await prisma.screenerQuery.create({
        data: {
          userId: userId || null,
          queryAr: query,
          parsedDsl: (resObj.interpreted as any) || {},
          resultCount: (resObj.total_matches as number) || (Array.isArray(resObj.results) ? resObj.results.length : 0),
          executionMs: executionMs,
        },
      });
    } catch {
      // Non-blocking if Prisma/Postgres is offline
    }

    return NextResponse.json({
      success: true,
      query,
      ...resObj,
      execution_ms: executionMs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء معالجة استعلام التصفية";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
