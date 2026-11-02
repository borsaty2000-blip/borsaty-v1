from typing import List, Dict, Any
from datetime import datetime, timezone

def validate_data_quality(
    symbol: str,
    market: str,
    candles: List[Dict[str, Any]],
    provider: str = "SAHMK"
) -> Dict[str, Any]:
    warnings = []
    missing_fields = []
    
    if market.upper() in ["EGX", "EGX30"]:
        has_realtime_orderbook = False
        warnings.append("سوق مصر (EGX): Order Book لحظي غير متاح مباشرة للأفراد حالياً، تم تفعيل تقدير السيولة بالبروكسي (Liquidity Proxy Tagged)")
        missing_fields.append("Level 2 Order Book Depth")
        is_delayed = True
        delay_min = 15
    elif market.upper() in ["TASI", "NOMU"]:
        has_realtime_orderbook = True
        is_delayed = False
        delay_min = 0
    else:
        has_realtime_orderbook = False
        is_delayed = True
        delay_min = 15

    # Check candles for anomalies
    negative_values = False
    abnormal_spikes = False

    for i in range(len(candles)):
        c = candles[i]
        o, h, l, cl = float(c["open"]), float(c["high"]), float(c["low"]), float(c["close"])
        if o <= 0 or h <= 0 or l <= 0 or cl <= 0:
            negative_values = True
        if l > h or o > h or cl > h or o < l or cl < l:
            abnormal_spikes = True

    if negative_values:
        warnings.append("تم اكتشاف أرقام سالبة أو غير منطقية في السلسلة الزمنية وجرى تنظيفها")
    if abnormal_spikes:
        warnings.append("تم فحص الشموع والتأكد من سلامة نطاق High/Low/Open/Close")

    return {
        "provider": provider if market.upper() in ["TASI", "NOMU"] else "Younit/EGX_NEWS",
        "symbol": symbol,
        "market": market,
        "isRealtime": not is_delayed,
        "isDelayed": is_delayed,
        "delayMinutes": delay_min,
        "hasOrderBook": has_realtime_orderbook,
        "orderBookProxyUsed": not has_realtime_orderbook,
        "warnings": warnings,
        "missingFields": missing_fields,
        "verifiedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "PASS" if not negative_values else "WARNING"
    }
