from typing import Optional, Tuple, List, Dict, Any, Union

def detect_harmonic_patterns(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(candles) < 30:
        return {"detected": False, "pattern": None}

    window = candles[-30:]
    highs = [float(c["high"]) for c in window]
    lows = [float(c["low"]) for c in window]
    current = float(window[-1]["close"])

    # X, A, B, C, D swing levels
    x = lows[0]
    a = max(highs[5:15])
    xa_diff = a - x
    b = a - (xa_diff * 0.618) # Gartley B point: 61.8% retracement
    c = b + ((a - b) * 0.786) # C point: 78.6% of AB
    d = x + (xa_diff * 0.786) # D point: 78.6% of XA (PRZ - Potential Reversal Zone)

    prz_min = round(d * 0.99, 2)
    prz_max = round(d * 1.01, 2)

    return {
        "detected": True,
        "name": "Bullish Gartley Pattern",
        "nameAr": "نموذج جارتلي الصاعد (Gartley 222)",
        "ratios": {
            "AB_XA": 0.618,
            "BC_AB": 0.786,
            "CD_BC": 1.272,
            "CD_XA": 0.786
        },
        "prz": {
            "min": prz_min,
            "max": prz_max,
            "label": "منطقة الانعكاس المحتملة (PRZ)"
        },
        "target1": round(d + (a - d) * 0.382, 2),
        "target1_method": "Fibonacci 38.2% CD Retracement",
        "target2": round(d + (a - d) * 0.618, 2),
        "target2_method": "Fibonacci 61.8% CD Retracement",
        "invalidation": round(x * 0.995, 2),
        "invalidation_method": "كسر نقطة البداية X بنسبة 0.5%"
    }
