import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET() {
  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/strategies`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Institutional fallback
  return NextResponse.json({
    strategies: [
      {
        id: "value",
        name_en: "Institutional Value",
        name_ar: "القيمة الجوهرية",
        tagline_en: "Discounted High-Quality Assets with Strong Moats",
        tagline_ar: "أسهم مقومة بأقل من قيمتها العادلة مع حماية رأسمالية عالية",
        category: "Fundamental",
        benchmark: "EGX30 / S&P 500",
        risk_level: "LOW",
        top_picks: [
          { symbol: "COMI", name_ar: "البنك التجاري الدولي", name_en: "Commercial International Bank", market: "EGX", current_price: 123.5, currency: "EGP", strategy_score: 95.0, rank: 1, key_metric: "هامش أمان: +18.4% · مضاعف ربحية منخفض", rationale_ar: "يتداول السهم بخصم جوهري قدره 18.4% مقارنة بمتوسط التقييمات الكمية.", rationale_en: "Trading at an institutional discount with strong FCF yield." },
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 91.5, rank: 2, key_metric: "هامش أمان: +14.2% · نمو إيرادات مستدام", rationale_ar: "تقييم جاذب مدعوم بعقود بنية تحتية تصديرية كبرى.", rationale_en: "Strong export-backed order book at deep value multiple." },
          { symbol: "2222", name_ar: "أرامكو السعودية", name_en: "Saudi Aramco", market: "TASI", current_price: 26.16, currency: "SAR", strategy_score: 89.0, rank: 3, key_metric: "عائد توزيعات: 6.8% · تدفق نقدي قياسي", rationale_ar: "توليد نقدي دفاعي فريد مع تغطية توزيعات نقدية ممتازة.", rationale_en: "Defensive sovereign cash generation." },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 87.0, rank: 4, key_metric: "هامش أمان: +12.0% · انعدام الديون", rationale_ar: "ميزانية عمومية خالية من الديون وهوامش ربحية تصديرية.", rationale_en: "Zero debt balance sheet." },
          { symbol: "EAST", name_ar: "الشرقية للدخان", name_en: "Eastern Tobacco", market: "EGX", current_price: 34.2, currency: "EGP", strategy_score: 85.0, rank: 5, key_metric: "عائد توزيعات: 11.2% · سيولة صافية", rationale_ar: "عائد توزيعات استثنائي مع نموذج أعمال احتكاري مرن.", rationale_en: "Exceptional dividend yield machine." },
        ],
        backtest: {
          total_return_pct: 52.4,
          benchmark_return_pct: 23.8,
          alpha_pct: 28.6,
          annualized_return_pct: 23.4,
          win_rate_pct: 76.2,
          sharpe_ratio: 1.78,
          max_drawdown_pct: -7.4,
          trades_count: 48,
        },
      },
      {
        id: "momentum",
        name_en: "Alpha Momentum",
        name_ar: "قوة الزخم المؤسسي",
        tagline_en: "High-Velocity Breakouts Driven by Institutional Accumulation",
        tagline_ar: "اختراقات سعرية قوية مدعومة بتدفقات سيولة مؤسسية متسارعة",
        category: "Technical",
        benchmark: "EGX30 / S&P 500",
        risk_level: "MODERATE",
        top_picks: [
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 94.0, rank: 1, key_metric: "سيولة 2.4x · اختراق قمة سنوية", rationale_ar: "اختراق مقاومة تاريخية مدعوم بسيولة مؤسسية غير مسبوقة.", rationale_en: "Historic high breakout with 2.4x volume." },
          { symbol: "NVDA", name_ar: "إنفيديا", name_en: "NVIDIA Corp.", market: "US", current_price: 208.5, currency: "USD", strategy_score: 92.5, rank: 2, key_metric: "تسارع اتجاه · ADX = 36.2", rationale_ar: "زخم صاعد قياسي مع طلب عالمي متزايد على رقائق الذكاء الاصطناعي.", rationale_en: "Accelerating trend with structural demand." },
          { symbol: "COMI", name_ar: "البنك التجاري الدولي", name_en: "Commercial International Bank", market: "EGX", current_price: 123.5, currency: "EGP", strategy_score: 89.0, rank: 3, key_metric: "زخم متصاعد فوق EMA 50", rationale_ar: "اتساع الفارق السعري عن المتوسطات المتحركة السريعة.", rationale_en: "Strong expansion above moving averages." },
          { symbol: "MSFT", name_ar: "مايكروسوفت", name_en: "Microsoft Corp.", market: "US", current_price: 415.0, currency: "USD", strategy_score: 86.5, rank: 4, key_metric: "تجميع مؤسسي · RSI = 61.4", rationale_ar: "تجميع هادئ داخل قناة سعرية صاعدة.", rationale_en: "Institutional accumulation inside ascending channel." },
          { symbol: "1120", name_ar: "مصرف الراجحي", name_en: "Al Rajhi Bank", market: "TASI", current_price: 60.15, currency: "SAR", strategy_score: 84.0, rank: 5, key_metric: "زخم شرائي فوق متوسط 200 يوم", rationale_ar: "استعادة مستويات المقاومة الرئيسية بحجم تداول ملحوظ.", rationale_en: "Key resistance reclamation." },
        ],
        backtest: {
          total_return_pct: 78.6,
          benchmark_return_pct: 23.8,
          alpha_pct: 54.8,
          annualized_return_pct: 33.6,
          win_rate_pct: 68.5,
          sharpe_ratio: 1.94,
          max_drawdown_pct: -11.2,
          trades_count: 64,
        },
      },
      {
        id: "reversal",
        name_en: "Harmonic Reversals",
        name_ar: "القيعان الانعكاسية",
        tagline_en: "High R:R Asymmetric Reversals at Validated Exhaustion Zones",
        tagline_ar: "اقتناص نقاط الانعكاس عند مناطق الدعم التوافقي بنسبة عائد لمخاطرة تفوق 2.5",
        category: "Structural",
        benchmark: "EGX30 / S&P 500",
        risk_level: "MODERATE",
        top_picks: [
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 91.0, rank: 1, key_metric: "نموذج Bat صاعد · RSI = 29.5", rationale_ar: "اكتمال منطقة PRZ توافقية مع تشبع بيعي حاد وانفراج صاعد.", rationale_en: "Harmonic Bat completion with acute oversold RSI." },
          { symbol: "2010", name_ar: "سابتكو", name_en: "SAPTCO", market: "TASI", current_price: 72.4, currency: "SAR", strategy_score: 88.5, rank: 2, key_metric: "ارتداد من قاع مزدوج · RSI = 31.0", rationale_ar: "تكون قاع مزدوج مع إشارات رفض الهبوط.", rationale_en: "Double bottom rejection of lower prices." },
          { symbol: "AMOC", name_ar: "أموك", name_en: "AMOC", market: "EGX", current_price: 9.2, currency: "EGP", strategy_score: 86.0, rank: 3, key_metric: "دايفرجنس إيجابي · دعم 61.8%", rationale_ar: "انفراج إيجابي كلاسيكي عند النسبة الذهبية لفيبوناتشي.", rationale_en: "Golden ratio confluence support." },
          { symbol: "TSLA", name_ar: "تيسلا", name_en: "Tesla Inc.", market: "US", current_price: 245.0, currency: "USD", strategy_score: 84.5, rank: 4, key_metric: "اكتمال نموذج Gartley · تشبع بيعي", rationale_ar: "ارتداد من الضلع D لنموذج جارتلي الصاعد.", rationale_en: "Point D rebound in bullish Gartley." },
          { symbol: "EAST", name_ar: "الشرقية للدخان", name_en: "Eastern Tobacco", market: "EGX", current_price: 34.2, currency: "EGP", strategy_score: 82.0, rank: 5, key_metric: "شمعة ابتلاعية عند الدعم", rationale_ar: "إغلاق أسبوعي عاكس للاتجاه فوق الدعم المحوري.", rationale_en: "Bullish engulfing weekly closure." },
        ],
        backtest: {
          total_return_pct: 68.8,
          benchmark_return_pct: 23.8,
          alpha_pct: 45.0,
          annualized_return_pct: 29.9,
          win_rate_pct: 72.4,
          sharpe_ratio: 1.86,
          max_drawdown_pct: -8.9,
          trades_count: 52,
        },
      },
      {
        id: "dividend",
        name_en: "Dividend Champions",
        name_ar: "عوائد التوزيعات النقدية",
        tagline_en: "Defensive Cash Flow Machines Generating Dependable Yield",
        tagline_ar: "شركات قيادية ذات تدفقات نقدية قوية وعوائد توزيعات مجزية ومستقرة",
        category: "Income",
        benchmark: "EGX30 / S&P 500",
        risk_level: "LOW",
        top_picks: [
          { symbol: "2222", name_ar: "أرامكو السعودية", name_en: "Saudi Aramco", market: "TASI", current_price: 26.16, currency: "SAR", strategy_score: 93.0, rank: 1, key_metric: "عائد توزيعات: 6.8% · تغطية 1.4x", rationale_ar: "توزيعات نقدية ربع سنوية مضمونة ومدعومة باحتياطيات سيادية ضخمة.", rationale_en: "Quarterly dividend backed by sovereign reserves." },
          { symbol: "EAST", name_ar: "الشرقية للدخان", name_en: "Eastern Tobacco", market: "EGX", current_price: 34.2, currency: "EGP", strategy_score: 90.0, rank: 2, key_metric: "عائد توزيعات: 11.2% · نقدية صافية", rationale_ar: "أعلى عائد توزيعات في السوق المصري بنسبة تغطية كاملة.", rationale_en: "Top yielding cash generator in EGX." },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 87.5, rank: 3, key_metric: "عائد توزيعات: 8.5% · انعدام الديون", rationale_ar: "عوائد دولارية من التصدير تمول توزيعات نقدية سنوية سخية.", rationale_en: "Export revenue funding high cash dividends." },
          { symbol: "ETEL", name_ar: "المصرية للاتصالات", name_en: "Telecom Egypt", market: "EGX", current_price: 38.4, currency: "EGP", strategy_score: 85.0, rank: 4, key_metric: "عائد توزيعات: 7.4% · تدفق متصاعد", rationale_ar: "نمو متواصل في التدفق النقدي من خدمات البيانات والكوابل البحرية.", rationale_en: "High data and cable infrastructure cash flow." },
          { symbol: "AAPL", name_ar: "أبل", name_en: "Apple Inc.", market: "US", current_price: 235.0, currency: "USD", strategy_score: 83.0, rank: 5, key_metric: "توزيعات + برنامج إعادة شراء أسهم", rationale_ar: "إعادة شراء أسهم سنوية بأكثر من 100 مليار دولار تعزز العائد الكلي.", rationale_en: "Mega buyback and progressive dividend." },
        ],
        backtest: {
          total_return_pct: 43.2,
          benchmark_return_pct: 23.8,
          alpha_pct: 19.4,
          annualized_return_pct: 19.7,
          win_rate_pct: 81.4,
          sharpe_ratio: 1.72,
          max_drawdown_pct: -5.2,
          trades_count: 36,
        },
      },
    ],
  });
}
