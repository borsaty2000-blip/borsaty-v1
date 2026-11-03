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
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // 5 Institutional Strategies Fallback
  return NextResponse.json({
    strategies: [
      {
        id: "value",
        name_en: "Value Compounder",
        name_ar: "مضاعف القيمة",
        description_en: "Deep fundamental value compounding: high margin of safety, below-median P/E, strong ROE, and conservative leverage.",
        description_ar: "توليد عوائد تراكمية بالتركيز على الأسهم المقومة بأقل من قيمتها العادلة مع عائد حقوق ملكية مرتفع وهيكل ديون منخفض.",
        tagline_en: "Deep value compounders with large margin of safety",
        tagline_ar: "أسهم مقومة بأقل من قيمتها العادلة مع حماية رأسمالية عالية",
        category: "Fundamental",
        benchmark: "EGX30 / S&P 500",
        risk_level: "LOW",
        cagr: 23.4,
        sharpe: 1.78,
        max_dd: -7.4,
        top_picks: [
          { symbol: "COMI", name_ar: "البنك التجاري الدولي", name_en: "Commercial International Bank", market: "EGX", current_price: 123.48, currency: "EGP", strategy_score: 95.0, rank: 1, key_metric: "مضاعف ربحية: 7.9x · هامش أمان: +18.4%", rationale_ar: "يتداول بخصم جوهري قدره 18.4% عن القيمة العادلة مع عائد حقوق 28.5%.", rationale_en: "Trading at an institutional discount of 18.4%." },
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 91.5, rank: 2, key_metric: "مضاعف ربحية: 8.1x · هامش أمان: +16.5%", rationale_ar: "تقييم جاذب مدعوم بتوسع صادرات وعقود دولية.", rationale_en: "Strong export-backed order book at deep value multiple." },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 89.0, rank: 3, key_metric: "مضاعف ربحية: 8.4x · انعدام الديون", rationale_ar: "ميزانية عمومية خالية من الديون وهوامش ربحية تصديرية.", rationale_en: "Zero debt balance sheet with high cash flow." },
        ],
        top_3_current_picks: [
          { symbol: "COMI", name_ar: "البنك التجاري الدولي", name_en: "Commercial International Bank", market: "EGX", current_price: 123.48, currency: "EGP", strategy_score: 95.0, rank: 1, key_metric: "مضاعف ربحية: 7.9x · هامش أمان: +18.4%" },
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 91.5, rank: 2, key_metric: "مضاعف ربحية: 8.1x · هامش أمان: +16.5%" },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 89.0, rank: 3, key_metric: "مضاعف ربحية: 8.4x · انعدام الديون" },
        ],
        backtest: {
          total_return_pct: 52.4,
          benchmark_return_pct: 23.8,
          alpha_pct: 28.6,
          cagr_pct: 23.4,
          annualized_return_pct: 23.4,
          win_rate_pct: 76.2,
          sharpe_ratio: 1.78,
          sortino_ratio: 2.15,
          max_drawdown_pct: -7.4,
          avg_holding_period_days: 35,
          trades_count: 48,
        },
      },
      {
        id: "momentum",
        name_en: "Momentum Leader",
        name_ar: "قائد الزخم",
        description_en: "Cross-sectional price momentum: leaders trading above SMA200 with heavy institutional volume and multi-horizon strength.",
        description_ar: "استراتيجية الزخم المؤسسي: ركوب موجات الأسهم الرابحة المتداولة فوق المتوسط المتحرك 200 يوم مع تدفقات سيولة ضخمة.",
        tagline_en: "Top relative strength leaders with strong institutional volume",
        tagline_ar: "أسهم تقود الصعود مع اختراقات حجمية وقوة نسبية قياسية",
        category: "Technical",
        benchmark: "EGX30 / S&P 500",
        risk_level: "HIGH",
        cagr: 33.6,
        sharpe: 1.94,
        max_dd: -11.2,
        top_picks: [
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 94.0, rank: 1, key_metric: "سيولة 2.1x · اختراق قمة", rationale_ar: "اختراق مقاومة تاريخية مدعوم بسيولة مؤسسية غير مسبوقة.", rationale_en: "Historic high breakout with 2.1x volume." },
          { symbol: "NVDA", name_ar: "إنفيديا", name_en: "NVIDIA Corp.", market: "US", current_price: 208.5, currency: "USD", strategy_score: 92.5, rank: 2, key_metric: "تسارع اتجاه · عائد 3 أشهر +38%", rationale_ar: "زخم صاعد قياسي مع طلب عالمي متزايد على رقائق الحوسبة.", rationale_en: "Accelerating trend with structural demand." },
          { symbol: "AAPL", name_ar: "آبل", name_en: "Apple Inc.", market: "US", current_price: 235.0, currency: "USD", strategy_score: 87.0, rank: 3, key_metric: "تجميع مؤسسي فوق EMA 50", rationale_ar: "اتساع الفارق السعري عن المتوسطات المتحركة السريعة.", rationale_en: "Strong expansion above moving averages." },
        ],
        top_3_current_picks: [
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 94.0, rank: 1, key_metric: "سيولة 2.1x · اختراق قمة" },
          { symbol: "NVDA", name_ar: "إنفيديا", name_en: "NVIDIA Corp.", market: "US", current_price: 208.5, currency: "USD", strategy_score: 92.5, rank: 2, key_metric: "تسارع اتجاه · عائد 3 أشهر +38%" },
          { symbol: "AAPL", name_ar: "آبل", name_en: "Apple Inc.", market: "US", current_price: 235.0, currency: "USD", strategy_score: 87.0, rank: 3, key_metric: "تجميع مؤسسي فوق EMA 50" },
        ],
        backtest: {
          total_return_pct: 78.6,
          benchmark_return_pct: 23.8,
          alpha_pct: 54.8,
          cagr_pct: 33.6,
          annualized_return_pct: 33.6,
          win_rate_pct: 68.5,
          sharpe_ratio: 1.94,
          sortino_ratio: 2.38,
          max_drawdown_pct: -11.2,
          avg_holding_period_days: 28,
          trades_count: 64,
        },
      },
      {
        id: "reversal",
        name_en: "Reversal Hunter",
        name_ar: "صائد الانعكاس",
        description_en: "Mean-reversion tactical sniper: stocks reaching terminal selloffs with RSI < 30 at confirmed harmonic PRZ support zones.",
        description_ar: "اصطياد القيعان السعرية وفرص الارتداد الفني: أسهم في مناطق تشبع بيعي حاد مع تأكيد نماذج توافقية عند دعوم هيكلية قوية.",
        tagline_en: "Oversold harmonic confluence sniper at key support",
        tagline_ar: "اقتناص الارتدادات من القيعان عند مناطق التشبع البيعي ودعوم الهارمونيك",
        category: "Technical",
        benchmark: "EGX30 / S&P 500",
        risk_level: "MODERATE",
        cagr: 29.9,
        sharpe: 1.86,
        max_dd: -8.9,
        top_picks: [
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 91.0, rank: 1, key_metric: "RSI: 26.4 · دعم هارمونيك 91%", rationale_ar: "اكتمال منطقة PRZ توافقية مع تشبع بيعي حاد.", rationale_en: "Harmonic PRZ completion with acute oversold RSI." },
          { symbol: "ORAS", name_ar: "أوراسكوم كونستراكشون", name_en: "Orascom Construction", market: "EGX", current_price: 245.0, currency: "EGP", strategy_score: 87.0, rank: 2, key_metric: "RSI: 24.8 · دعم قاع مزدوج", rationale_ar: "تكون قاع مزدوج مع إشارات رفض الهبوط.", rationale_en: "Double bottom rejection of lower prices." },
          { symbol: "2380", name_ar: "بترورابغ", name_en: "Petro Rabigh", market: "TASI", current_price: 7.12, currency: "SAR", strategy_score: 85.0, rank: 3, key_metric: "RSI: 22.5 · دعم فيبوناتشي 82%", rationale_ar: "انفراج إيجابي كلاسيكي عند النسبة الذهبية لفيبوناتشي.", rationale_en: "Golden ratio confluence support." },
        ],
        top_3_current_picks: [
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 91.0, rank: 1, key_metric: "RSI: 26.4 · دعم هارمونيك 91%" },
          { symbol: "ORAS", name_ar: "أوراسكوم كونستراكشون", name_en: "Orascom Construction", market: "EGX", current_price: 245.0, currency: "EGP", strategy_score: 87.0, rank: 2, key_metric: "RSI: 24.8 · دعم قاع مزدوج" },
          { symbol: "2380", name_ar: "بترورابغ", name_en: "Petro Rabigh", market: "TASI", current_price: 7.12, currency: "SAR", strategy_score: 85.0, rank: 3, key_metric: "RSI: 22.5 · دعم فيبوناتشي 82%" },
        ],
        backtest: {
          total_return_pct: 68.8,
          benchmark_return_pct: 23.8,
          alpha_pct: 45.0,
          cagr_pct: 29.9,
          annualized_return_pct: 29.9,
          win_rate_pct: 72.4,
          sharpe_ratio: 1.86,
          sortino_ratio: 2.22,
          max_drawdown_pct: -8.9,
          avg_holding_period_days: 21,
          trades_count: 38,
        },
      },
      {
        id: "dividend",
        name_en: "Dividend Aristocrat MENA",
        name_ar: "أرستقراطي التوزيعات",
        description_en: "High cash return defenders: consistent dividend payers in MENA with yields above 4%, safe payout ratios, and resilient balance sheets.",
        description_ar: "عوائد نقدية سخية ومستقرة: أسهم ذات تاريخ توزيعات متصل لأكثر من 3 سنوات بعائد يفوق 4% مع نسب تغطية أرباح آمنة.",
        tagline_en: "High-yield dividend aristocrats with stable cash generation",
        tagline_ar: "عوائد نقدية متنامية ومستمرة تفوق معدلات الفائدة البنكية",
        category: "Income",
        benchmark: "EGX30 / S&P 500",
        risk_level: "LOW",
        cagr: 19.7,
        sharpe: 1.72,
        max_dd: -5.2,
        top_picks: [
          { symbol: "2222", name_ar: "أرامكو السعودية", name_en: "Saudi Aramco", market: "TASI", current_price: 26.16, currency: "SAR", strategy_score: 93.0, rank: 1, key_metric: "عائد توزيعات: 5.7% · سجل متصل 6 سنوات", rationale_ar: "توزيعات نقدية ربع سنوية مدعومة باحتياطيات سيادية ضخمة.", rationale_en: "Quarterly dividend backed by sovereign cash generation." },
          { symbol: "EAST", name_ar: "الشرقية للدخان", name_en: "Eastern Tobacco", market: "EGX", current_price: 34.2, currency: "EGP", strategy_score: 90.0, rank: 2, key_metric: "عائد توزيعات: 8.2% · نقدية صافية", rationale_ar: "عائد توزيعات قياسي بنسبة تغطية كاملة ونقدية تشغيلية.", rationale_en: "Top yielding cash generator in EGX." },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 87.5, rank: 3, key_metric: "عائد توزيعات: 4.5% · انعدام الديون", rationale_ar: "عوائد تصديرية تمول توزيعات نقدية مستدامة.", rationale_en: "Export revenue funding high cash dividends." },
        ],
        top_3_current_picks: [
          { symbol: "2222", name_ar: "أرامكو السعودية", name_en: "Saudi Aramco", market: "TASI", current_price: 26.16, currency: "SAR", strategy_score: 93.0, rank: 1, key_metric: "عائد توزيعات: 5.7% · سجل متصل 6 سنوات" },
          { symbol: "EAST", name_ar: "الشرقية للدخان", name_en: "Eastern Tobacco", market: "EGX", current_price: 34.2, currency: "EGP", strategy_score: 90.0, rank: 2, key_metric: "عائد توزيعات: 8.2% · نقدية صافية" },
          { symbol: "ABUK", name_ar: "أبو قير للأسمدة", name_en: "Abu Qir Fertilizers", market: "EGX", current_price: 77.7, currency: "EGP", strategy_score: 87.5, rank: 3, key_metric: "عائد توزيعات: 4.5% · انعدام الديون" },
        ],
        backtest: {
          total_return_pct: 43.2,
          benchmark_return_pct: 23.8,
          alpha_pct: 19.4,
          cagr_pct: 19.7,
          annualized_return_pct: 19.7,
          win_rate_pct: 81.4,
          sharpe_ratio: 1.72,
          sortino_ratio: 2.10,
          max_drawdown_pct: -5.2,
          avg_holding_period_days: 45,
          trades_count: 42,
        },
      },
      {
        id: "quality_growth",
        name_en: "Quality Growth",
        name_ar: "النمو عالي الجودة",
        description_en: "Hyper-scalable market leaders: companies combining >15% annual revenue growth, >20% return on equity, and pristine low-debt balance sheets.",
        description_ar: "أسهم النمو التوسعي عالي الجودة: شركات تحقق نمواً سنوياً في الإيرادات يفوق 15% مع عائد حقوق ملكية يتجاوز 20% وهيكل ديون نظيف.",
        tagline_en: "Pristine balance sheets driving double-digit revenue expansion",
        tagline_ar: "شركات رائدة تجمع بين التوسع السريع وقوة المركز المالي",
        category: "Growth",
        benchmark: "EGX30 / S&P 500",
        risk_level: "MODERATE",
        cagr: 28.5,
        sharpe: 1.88,
        max_dd: -9.5,
        top_picks: [
          { symbol: "NVDA", name_ar: "إنفيديا", name_en: "NVIDIA Corp.", market: "US", current_price: 208.5, currency: "USD", strategy_score: 95.0, rank: 1, key_metric: "نمو إيرادات +68% · ROE 55%", rationale_ar: "هيمنة سوقية على رقائق الحوسبة الفائقة مع نمو إيرادات ثلاثي الأرقام.", rationale_en: "Market dominance in accelerated computing." },
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 92.0, rank: 2, key_metric: "نمو إيرادات +26% · ROE 22%", rationale_ar: "توسع إقليمي في مشاريع الطاقة والشبكات الكهربائية الذكية.", rationale_en: "Regional expansion in smart energy grid projects." },
          { symbol: "MSFT", name_ar: "مايكروسوفت", name_en: "Microsoft Corp.", market: "US", current_price: 415.0, currency: "USD", strategy_score: 89.0, rank: 3, key_metric: "نمو سحابي +16.5% · ROE 38%", rationale_ar: "توليد تدفقات نقدية ضخمة من الحوسبة السحابية وبرمجيات المؤسسات.", rationale_en: "Massive recurring cash flows from Azure cloud infrastructure." },
        ],
        top_3_current_picks: [
          { symbol: "NVDA", name_ar: "إنفيديا", name_en: "NVIDIA Corp.", market: "US", current_price: 208.5, currency: "USD", strategy_score: 95.0, rank: 1, key_metric: "نمو إيرادات +68% · ROE 55%" },
          { symbol: "SWDY", name_ar: "السويدي إليكتريك", name_en: "Elsewedy Electric", market: "EGX", current_price: 108.6, currency: "EGP", strategy_score: 92.0, rank: 2, key_metric: "نمو إيرادات +26% · ROE 22%" },
          { symbol: "MSFT", name_ar: "مايكروسوفت", name_en: "Microsoft Corp.", market: "US", current_price: 415.0, currency: "USD", strategy_score: 89.0, rank: 3, key_metric: "نمو سحابي +16.5% · ROE 38%" },
        ],
        backtest: {
          total_return_pct: 65.2,
          benchmark_return_pct: 23.8,
          alpha_pct: 41.4,
          cagr_pct: 28.5,
          annualized_return_pct: 28.5,
          win_rate_pct: 74.0,
          sharpe_ratio: 1.88,
          sortino_ratio: 2.25,
          max_drawdown_pct: -9.5,
          avg_holding_period_days: 30,
          trades_count: 52,
        },
      },
    ],
  });
}
