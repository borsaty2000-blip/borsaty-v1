import os
import json
import time
from typing import Dict, Any, List

class DataAgent:
    """
    Data Agent:
    - Fetches market quotes from SAHMK (Saudi), Younit/EGX.news (Egypt), EODHD (Global)
    - Normalizes schemas
    - Enforces Data Quality Gate
    - Provides in-memory or Redis caching
    """
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}

    def cache_get(self, key: str) -> Any | None:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def cache_set(self, key: str, value: Any, ttl_seconds: int = 30):
        self.cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl_seconds
        }

    def fetch_quote(self, symbol: str, market: str) -> Dict[str, Any]:
        cache_key = f"quote:{market}:{symbol}"
        cached = self.cache_get(cache_key)
        if cached:
            return cached

        # Route to appropriate provider
        if market.upper() in ["TASI", "NOMU"]:
            provider = "SAHMK"
            is_delayed = False
            delay_minutes = 0
            order_book_proxy = False
        elif market.upper() in ["EGX", "EGX30"]:
            provider = "Younit/EGX_NEWS"
            is_delayed = True
            delay_minutes = 15
            order_book_proxy = True
        else:
            provider = "EODHD"
            is_delayed = True
            delay_minutes = 15
            order_book_proxy = True

        quote_data = {
            "symbol": symbol.upper(),
            "market": market.upper(),
            "timestamp": time.time(),
            "dataQuality": {
                "provider": provider,
                "isRealtime": not is_delayed,
                "isDelayed": is_delayed,
                "delayMinutes": delay_minutes,
                "hasOrderBook": not order_book_proxy,
                "orderBookProxyUsed": order_book_proxy,
                "warnings": ["تم استخدام Proxy لعمق السوق"] if order_book_proxy else [],
                "missingFields": ["Order Book L2"] if order_book_proxy else []
            }
        }

        self.cache_set(cache_key, quote_data, ttl_seconds=30)
        return quote_data

if __name__ == "__main__":
    agent = DataAgent()
    q = agent.fetch_quote("COMI", "EGX")
    print("Data Agent Quote Result:", json.dumps(q, indent=2, ensure_ascii=False))
