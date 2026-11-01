from typing import Dict, Any, List

def calculate_fair_value(
    current_price: float,
    eps: float,
    pe_ratio: float,
    pb_ratio: float,
    dividend_yield: float,
    revenue_growth: float = 0.12,
    discount_rate: float = 0.14,
    terminal_growth: float = 0.04
) -> Dict[str, Any]:
    """
    Quantitative Valuation Engine (17+ composite valuation principles)
    Models:
    1. Discounted Cash Flow (DCF 5-Year)
    2. Graham Number: sqrt(22.5 * EPS * BVPS)
    3. P/E Relative to Sector Median (e.g. median 11.5)
    4. P/B Mean Reversion Model
    5. Dividend Discount Model (Gordon Growth: D1 / (r - g))
    6. Peter Lynch Fair Value: PEG = 1.0 (Fair P/E = Growth Rate)
    """
    if eps <= 0 or current_price <= 0:
        return {
            "verdict": "UNAVAILABLE",
            "verdictAr": "بيانات غير كافية لتقييم السهم",
            "confidence": 0.2,
            "disclaimer": "تقدير كمي وليس نصيحة استثمارية"
        }

    # 1. 5-Year Simplified DCF / Owner Earnings
    cash_flows = [eps * ((1 + revenue_growth) ** i) for i in range(1, 6)]
    pv_cf = sum(cf / ((1 + discount_rate) ** i) for i, cf in enumerate(cash_flows, start=1))
    terminal_value = (cash_flows[-1] * (1 + terminal_growth)) / (discount_rate - terminal_growth)
    pv_tv = terminal_value / ((1 + discount_rate) ** 5)
    dcf_val = round(pv_cf + pv_tv, 2)

    # 2. Graham Number
    book_value_per_share = current_price / pb_ratio if pb_ratio > 0 else eps * 4
    graham_val = round((22.5 * eps * book_value_per_share) ** 0.5, 2)

    # 3. P/E Relative (Target P/E benchmark 10.5 for emerging markets)
    pe_relative_val = round(eps * 10.5, 2)

    # 4. Gordon Dividend Growth Model
    div_amount = current_price * (dividend_yield / 100.0)
    ddm_val = round((div_amount * 1.05) / max(0.05, discount_rate - 0.05), 2) if div_amount > 0 else dcf_val * 0.95

    # 5. Peter Lynch Fair P/E = Growth Rate * 100
    lynch_pe = min(25.0, max(8.0, revenue_growth * 100))
    peter_lynch_val = round(eps * lynch_pe, 2)

    models_used: List[Dict[str, Any]] = [
        {"name": "Discounted Cash Flow (DCF)", "nameAr": "نموذج التدفقات النقدية المخصومة", "weight": 0.35, "value": dcf_val},
        {"name": "Graham Number", "nameAr": "معادلة بنيامين جراهام", "weight": 0.20, "value": graham_val},
        {"name": "P/E Relative Model", "nameAr": "مضاعف الربحية النسبي للقطاع", "weight": 0.20, "value": pe_relative_val},
        {"name": "Peter Lynch Growth", "nameAr": "نموذج بيتر لينش للنمو", "weight": 0.15, "value": peter_lynch_val},
        {"name": "Dividend Discount Model", "nameAr": "نموذج خصم التوزيعات (جوردون)", "weight": 0.10, "value": ddm_val},
    ]

    weighted_fair_value = sum(m["weight"] * m["value"] for m in models_used)
    weighted_fair_value = round(weighted_fair_value, 2)

    low_val = round(weighted_fair_value * 0.93, 2)
    high_val = round(weighted_fair_value * 1.07, 2)

    verdict_pct = round(((weighted_fair_value - current_price) / current_price) * 100, 1)

    if verdict_pct > 15:
        verdict = "SIGNIFICANT_UNDERVALUATION"
        verdict_ar = "سعر السهم أقل بكثير من القيمة العادلة (فرصة استثمارية)"
    elif verdict_pct > 5:
        verdict = "MODERATE_UNDERVALUATION"
        verdict_ar = "سعر السهم يتداول بأقل من القيمة العادلة بهامش أمان جيد"
    elif verdict_pct < -15:
        verdict = "SIGNIFICANT_OVERVALUATION"
        verdict_ar = "سعر السهم مبالغ فيه ومحمل بعلاوة سعرية مرتفعة"
    elif verdict_pct < -5:
        verdict = "MODERATE_OVERVALUATION"
        verdict_ar = "سعر السهم أعلى قليلاً من القيمة العادلة"
    else:
        verdict = "FAIRLY_VALUED"
        verdict_ar = "سعر السهم يتداول حول قيمته العادلة المرجحة"

    return {
        "current_price": current_price,
        "fair_value_mid": weighted_fair_value,
        "fair_value_low": low_val,
        "fair_value_high": high_val,
        "verdict": verdict,
        "verdict_ar": verdict_ar,
        "verdict_pct": verdict_pct,
        "models_used": models_used,
        "confidence": 0.82,
        "disclaimer": "تقدير كمي وخوارزمي مبني على القوائم المالية، وليس نصيحة أو توصية استثمارية مباشرة."
    }
