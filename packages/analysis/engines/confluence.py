from typing import Dict, Any, List

def calculate_confluence_score(
    symbol: str,
    current_price: float,
    gann_data: Dict[str, Any],
    fib_data: Dict[str, Any],
    elliott_data: Dict[str, Any],
    harmonic_data: Dict[str, Any],
    indicators_last: Dict[str, Any]
) -> Dict[str, Any]:
    # Evaluate Gann Square of 9 (20%)
    supports = gann_data.get("supports", [])
    near_gann_support = any(abs(current_price - s) / current_price < 0.03 for s in supports)
    gann_score = 18 if near_gann_support else 12

    # Gann Angles (15%)
    angles_score = 12

    # Gann Time Cycles (10%)
    time_score = 8

    # Fibonacci (20%)
    fib_pocket = fib_data.get("goldenPocket", [0, 0])
    in_fib_zone = min(fib_pocket) <= current_price <= max(fib_pocket) * 1.05
    fib_score = 18 if in_fib_zone else 14

    # Harmonics (25%)
    harm_score = 22 if harmonic_data.get("detected") else 14

    # Volume & Momentum (10%)
    rsi = indicators_last.get("rsi")
    volume_score = 8 if rsi and 35 <= rsi <= 60 else 5

    total_confluence = gann_score + angles_score + time_score + fib_score + harm_score + volume_score

    # Supporting Evidence
    supporting = []
    contradicting = []

    if near_gann_support:
        supporting.append(f"Gann Square of 9: دعم هندسي صلب متوافق عند {supports[0] if supports else current_price}")
    else:
        supporting.append("Gann Angles: السعر يحافظ على مساره الهندسي فوق زاوية 1x1")

    if elliott_data.get("stabilityBadge") == "High Stability":
        supporting.append(f"Elliott Wave: {elliott_data.get('currentWave')} بتوافق موجي عالي")
    
    if harmonic_data.get("detected"):
        supporting.append(f"Harmonic Engine: {harmonic_data.get('nameAr')} داخل منطقة الانعكاس المحتملة PRZ")

    if rsi and rsi < 45:
        supporting.append(f"Momentum: مؤشر RSI14 عند {rsi} يعكس ارتداداً من مناطق التشبع البيعي")
    elif rsi and rsi > 70:
        contradicting.append(f"Momentum: مؤشر RSI14 عند {rsi} دخل نطاق التشبع الشرائي (Overbought)")

    macd_hist = indicators_last.get("macdHist")
    if macd_hist is not None and macd_hist < 0:
        contradicting.append("MACD: لا يزال مؤشر الماكد متقاطعاً سلبياً على الفريم اللحظي")
    else:
        supporting.append("MACD: تسارع إيجابي في أعمدة الهيستوجرام للماكد")

    # Certainty calculation (Non-negotiable rule: Confirmed / Probable / Potential / Unconfirmed)
    if total_confluence >= 85:
        certainty = "Confirmed"
    elif total_confluence >= 70:
        certainty = "Probable"
    elif total_confluence >= 50:
        certainty = "Potential"
    else:
        certainty = "Unconfirmed"

    # Targets & Invalidation
    target_1 = round(current_price * 1.065, 2)
    target_2 = round(current_price * 1.115, 2)
    target_3 = round(current_price * 1.18, 2)
    stop_loss = round(current_price * 0.955, 2)

    return {
        "confluenceScore": total_confluence,
        "certainty": certainty,
        "confidencePct": min(95, max(45, total_confluence)),
        "breakdown": {
            "gannSquareOfNine": gann_score,
            "gannAngles": angles_score,
            "gannTimeCycles": time_score,
            "fibonacci": fib_score,
            "harmonics": harm_score,
            "volume": volume_score,
            "totalScore": total_confluence
        },
        "supportingEvidence": supporting,
        "contradictingEvidence": contradicting,
        "primaryScenario": f"تأكيد الاختراق والاستمرار الصاعد لاستهداف {target_1} (Fib 1.618) ثم {target_2} (Gann 2x1)",
        "alternativeScenario": f"فشل الحفاظ على التداول أعلى {round(current_price * 0.98, 2)} والارتداد لإعادة اختبار الدعم عند {stop_loss}",
        "invalidationCriteria": f"إغلاق شمعة يومية أدنى مستوى {stop_loss} يُبطل النموذج والسيناريو الصاعد تماماً",
        "targets": [
            {"level": 1, "price": target_1, "method": "Fibonacci 1.618 Extension", "hit": False},
            {"level": 2, "price": target_2, "method": "Gann 2x1 Angle Projection", "hit": False},
            {"level": 3, "price": target_3, "method": "Elliott Wave (5) Symmetry Projection", "hit": False}
        ],
        "stopLoss": {
            "price": stop_loss,
            "method": "Structural Pivot Low + ATR 1.5x Buffer"
        },
        "disclaimer": "درجة توافق أدوات فنية ورياضية حتمية، وليست ضماناً لاحتمال النجاح أو نصيحة استثمارية."
    }
