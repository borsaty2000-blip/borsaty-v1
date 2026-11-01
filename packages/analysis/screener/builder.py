import time
from typing import List, Dict, Any, Optional
from .dsl import ScreenQuery

class ScreenerEngine:
    """
    Deterministic Financial Screener Execution Engine.
    Executes ScreenQuery DSL using parameterized evaluations and returns matched instruments.
    """

    def __init__(self, instruments_store: Optional[List[Dict[str, Any]]] = None):
        self.instruments = instruments_store or self._load_default_instruments()

    def _load_default_instruments(self) -> List[Dict[str, Any]]:
        # Mock universe representation for deterministic analysis engine testing
        return [
            {
                "symbol": "COMI",
                "nameAr": "البنك التجاري الدولي",
                "nameEn": "Commercial International Bank",
                "market": "EGX",
                "assetClass": "EQUITY",
                "sector": "بنوك",
                "close": 86.00,
                "open": 85.20,
                "high": 87.50,
                "low": 84.50,
                "volume": 2500000,
                "close_change_pct_1d": 0.53,
                "volume_ratio_20d": 1.65,
                "pe_ratio": 8.4,
                "market_cap": 250000000000,
                "RSI_14": 28.5,
                "SMA_200": 84.20,
                "SMA_50": 88.10,
                "MACD_hist": 0.45,
                "Supertrend": "BULLISH",
                "history_days": 730,
                "last_updated_hours_ago": 2,
            },
            {
                "symbol": "ABUK",
                "nameAr": "أبو قير للأسمدة",
                "nameEn": "Abu Qir Fertilizers",
                "market": "EGX",
                "assetClass": "EQUITY",
                "sector": "أسمدة وكيماويات",
                "close": 64.50,
                "open": 63.80,
                "high": 65.20,
                "low": 63.50,
                "volume": 1200000,
                "close_change_pct_1d": 1.10,
                "volume_ratio_20d": 1.20,
                "pe_ratio": 7.2,
                "market_cap": 85000000000,
                "RSI_14": 42.0,
                "SMA_200": 60.10,
                "SMA_50": 62.00,
                "MACD_hist": -0.15,
                "Supertrend": "BULLISH",
                "history_days": 730,
                "last_updated_hours_ago": 3,
            },
            {
                "symbol": "2222",
                "nameAr": "أرامكو السعودية",
                "nameEn": "Saudi Aramco",
                "market": "TASI",
                "assetClass": "EQUITY",
                "sector": "طاقة",
                "close": 27.65,
                "open": 27.50,
                "high": 27.80,
                "low": 27.45,
                "volume": 15000000,
                "close_change_pct_1d": 0.36,
                "volume_ratio_20d": 1.55,
                "pe_ratio": 15.2,
                "market_cap": 6800000000000,
                "RSI_14": 52.0,
                "SMA_200": 26.80,
                "SMA_50": 27.20,
                "MACD_hist": 0.12,
                "Supertrend": "BULLISH",
                "history_days": 730,
                "last_updated_hours_ago": 1,
            },
            {
                "symbol": "1120",
                "nameAr": "مصرف الراجحي",
                "nameEn": "Al Rajhi Bank",
                "market": "TASI",
                "assetClass": "EQUITY",
                "sector": "بنوك",
                "close": 88.50,
                "open": 87.90,
                "high": 89.20,
                "low": 87.50,
                "volume": 6500000,
                "close_change_pct_1d": 0.80,
                "volume_ratio_20d": 1.80,
                "pe_ratio": 18.5,
                "market_cap": 350000000000,
                "RSI_14": 65.0,
                "SMA_200": 82.00,
                "SMA_50": 86.50,
                "MACD_hist": 0.55,
                "Supertrend": "BULLISH",
                "history_days": 730,
                "last_updated_hours_ago": 1,
            },
            {
                "symbol": "1180",
                "nameAr": "البنك الأهلي السعودي",
                "nameEn": "Saudi National Bank",
                "market": "TASI",
                "assetClass": "EQUITY",
                "sector": "بنوك",
                "close": 36.40,
                "open": 36.20,
                "high": 36.80,
                "low": 36.10,
                "volume": 8200000,
                "close_change_pct_1d": 0.55,
                "volume_ratio_20d": 1.60,
                "pe_ratio": 12.8,
                "market_cap": 220000000000,
                "RSI_14": 29.0,
                "SMA_200": 35.10,
                "SMA_50": 37.00,
                "MACD_hist": -0.05,
                "Supertrend": "BEARISH",
                "history_days": 730,
                "last_updated_hours_ago": 1,
            },
            {
                "symbol": "BTCUSD",
                "nameAr": "بيتكوين",
                "nameEn": "Bitcoin",
                "market": "GLOBAL",
                "assetClass": "CRYPTO",
                "sector": "عملات مشفرة",
                "close": 68500.0,
                "open": 67200.0,
                "high": 69200.0,
                "low": 67000.0,
                "volume": 28000000000,
                "close_change_pct_1d": 2.10,
                "volume_ratio_20d": 1.90,
                "pe_ratio": 0.0,
                "market_cap": 1350000000000,
                "RSI_14": 68.0,
                "SMA_200": 62000.0,
                "SMA_50": 65500.0,
                "MACD_hist": 320.0,
                "Supertrend": "BULLISH",
                "history_days": 1800,
                "last_updated_hours_ago": 0,
            },
            {
                "symbol": "AAPL",
                "nameAr": "شركة أبل",
                "nameEn": "Apple Inc.",
                "market": "US",
                "assetClass": "EQUITY",
                "sector": "تكنولوجيا",
                "close": 235.50,
                "open": 233.00,
                "high": 236.20,
                "low": 232.50,
                "volume": 45000000,
                "close_change_pct_1d": 1.05,
                "volume_ratio_20d": 1.15,
                "pe_ratio": 34.2,
                "market_cap": 3600000000000,
                "RSI_14": 58.0,
                "SMA_200": 210.0,
                "SMA_50": 228.0,
                "MACD_hist": 1.25,
                "Supertrend": "BULLISH",
                "history_days": 2000,
                "last_updated_hours_ago": 1,
            },
            {
                "symbol": "STALE_STOCK",
                "nameAr": "سهم بيانات قديمة",
                "nameEn": "Stale Stock",
                "market": "EGX",
                "assetClass": "EQUITY",
                "sector": "عقارات",
                "close": 12.0,
                "open": 12.0,
                "high": 12.2,
                "low": 11.9,
                "volume": 10000,
                "close_change_pct_1d": 0.0,
                "volume_ratio_20d": 0.5,
                "pe_ratio": 10.0,
                "market_cap": 500000000,
                "RSI_14": 25.0,
                "SMA_200": 11.0,
                "SMA_50": 12.5,
                "MACD_hist": -0.2,
                "Supertrend": "BEARISH",
                "history_days": 500,
                "last_updated_hours_ago": 36,  # Stale > 24h
            },
            {
                "symbol": "NEW_IPO",
                "nameAr": "اكتتاب جديد",
                "nameEn": "New IPO",
                "market": "EGX",
                "assetClass": "EQUITY",
                "sector": "بنوك",
                "close": 15.0,
                "open": 14.5,
                "high": 15.2,
                "low": 14.3,
                "volume": 500000,
                "close_change_pct_1d": 3.0,
                "volume_ratio_20d": 1.0,
                "pe_ratio": 12.0,
                "market_cap": 1000000000,
                "RSI_14": 28.0,
                "SMA_200": None,  # Insufficient history for SMA 200
                "SMA_50": None,
                "MACD_hist": None,
                "Supertrend": "BULLISH",
                "history_days": 30,  # < 1 year
                "last_updated_hours_ago": 1,
            }
        ]

    def execute(self, query: ScreenQuery) -> Dict[str, Any]:
        start_time = time.time()

        stale_excluded = 0
        insufficient_history_excluded = 0
        matched_results = []

        for inst in self.instruments:
            # 1. Filter out stale data (> 24h)
            if inst.get("last_updated_hours_ago", 0) > 24:
                stale_excluded += 1
                continue

            # 2. Universe filtering
            if query.universe != "ALL" and inst["market"].upper() != query.universe.upper():
                continue

            # 3. Asset Class filtering
            if query.assetClass and inst.get("assetClass", "").upper() != query.assetClass.upper():
                continue

            # 4. Sector filtering
            if query.sector and query.sector.lower() not in inst.get("sector", "").lower():
                continue

            # 5. Condition evaluations
            condition_matches = []
            has_insufficient_history = False

            for cond in query.conditions:
                field_val = inst.get(cond.field)

                # Check if condition compares against another indicator (e.g. close > SMA_200)
                comp_val = cond.value
                if hasattr(comp_val, "name"):
                    period = getattr(comp_val, "params", {}).get("period")
                    ind_key = f"{comp_val.name}_{period}" if period else comp_val.name
                    comp_val = inst.get(ind_key)
                elif isinstance(comp_val, dict) and comp_val.get("type") == "indicator":
                    period = comp_val.get("params", {}).get("period")
                    ind_key = f"{comp_val.get('name')}_{period}" if period else comp_val.get("name")
                    comp_val = inst.get(ind_key)
                elif isinstance(comp_val, str) and comp_val in inst:
                    comp_val = inst.get(comp_val)

                if field_val is None or comp_val is None:
                    has_insufficient_history = True
                    break

                is_match = False
                op = cond.operator

                if op == ">":
                    is_match = float(field_val) > float(comp_val)
                elif op == "<":
                    is_match = float(field_val) < float(comp_val)
                elif op == ">=":
                    is_match = float(field_val) >= float(comp_val)
                elif op == "<=":
                    is_match = float(field_val) <= float(comp_val)
                elif op == "=":
                    is_match = str(field_val).upper() == str(comp_val).upper()
                elif op == "!=":
                    is_match = str(field_val).upper() != str(comp_val).upper()

                if is_match:
                    condition_matches.append(f"{cond.field} {cond.operator} {cond.value} ✓")

            if has_insufficient_history:
                insufficient_history_excluded += 1
                continue

            # Logic resolution (AND vs OR)
            is_overall_match = False
            if not query.conditions:
                is_overall_match = True
            elif query.logic == "AND":
                is_overall_match = len(condition_matches) == len(query.conditions)
            else:  # OR
                is_overall_match = len(condition_matches) > 0

            if is_overall_match:
                entry = {
                    "symbol": inst["symbol"],
                    "nameAr": inst["nameAr"],
                    "nameEn": inst["nameEn"],
                    "market": inst["market"],
                    "assetClass": inst.get("assetClass", "EQUITY"),
                    "sector": inst.get("sector"),
                    "close": inst["close"],
                    "close_change_pct_1d": inst.get("close_change_pct_1d", 0.0),
                    "matched_conditions": condition_matches,
                }
                # Attach requested indicator values
                for k in ["RSI_14", "SMA_200", "SMA_50", "MACD_hist", "Supertrend", "pe_ratio", "volume_ratio_20d"]:
                    if k in inst:
                        entry[k] = inst[k]
                matched_results.append(entry)

        # Sorting
        if query.sort:
            sort_field = query.sort.field
            reverse = query.sort.direction.lower() == "desc"
            matched_results.sort(key=lambda x: x.get(sort_field, 0) or 0, reverse=reverse)

        # Limit
        final_results = matched_results[: query.limit]
        execution_ms = int((time.time() - start_time) * 1000)

        return {
            "results": final_results,
            "total_matches": len(matched_results),
            "execution_ms": execution_ms,
            "data_quality": {
                "stale_instruments_excluded": stale_excluded,
                "insufficient_history_excluded": insufficient_history_excluded
            }
        }

global_screener_engine = ScreenerEngine()
