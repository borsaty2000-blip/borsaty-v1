"""Analyst consensus, estimates, and rating actions from Yahoo Finance."""

from __future__ import annotations

import logging
import math
import threading
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Callable, Dict, List, Optional

import yfinance as yf

logger = logging.getLogger("borsaty.analyst_consensus")

_UNAVAILABLE_MESSAGES = {
    "reason": "No analyst coverage",
    "message_ar": "لا توجد تغطية من المحللين لهذا السهم",
    "message_en": "No analyst coverage available for this stock",
}


@dataclass
class AnalystConsensusResult:
    symbol: str
    available: bool
    reason: Optional[str] = None
    message_ar: Optional[str] = None
    message_en: Optional[str] = None
    consensus: Optional[Dict[str, Any]] = None
    price_targets: Optional[Dict[str, Any]] = None
    estimates: Optional[Dict[str, Any]] = None
    recent_actions: Optional[List[Dict[str, Any]]] = None
    data_quality: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"symbol": self.symbol, "available": self.available}
        if not self.available:
            result.update({
                "reason": self.reason,
                "message_ar": self.message_ar,
                "message_en": self.message_en,
            })
            return result
        result.update({
            "consensus": self.consensus,
            "price_targets": self.price_targets,
            "estimates": self.estimates,
            "recent_actions": self.recent_actions or [],
            "data_quality": self.data_quality,
        })
        return result


class AnalystConsensusEngine:
    CACHE_TTL_SECONDS = 6 * 60 * 60
    DISTRIBUTION_KEYS = ("strong_buy", "buy", "hold", "sell", "strong_sell")

    def __init__(self, ticker_factory: Optional[Callable[[str], Any]] = None):
        self._ticker_factory = ticker_factory or yf.Ticker
        self._cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
        self._cache_lock = threading.Lock()

    @staticmethod
    def map_symbol(symbol: str, market: Optional[str] = None) -> str:
        sym = symbol.strip().upper()
        market_code = (market or "").strip().upper()
        if sym.endswith((".CA", ".SR")):
            return sym
        if market_code == "EGX" or sym in {"COMI", "SWDY", "ABUK", "FWRY", "EAST", "TMGH", "ETEL"}:
            return f"{sym}.CA"
        if market_code == "TASI" or sym.isdigit():
            return f"{sym}.SR"
        return sym

    @staticmethod
    def _number(value: Any) -> Optional[float]:
        try:
            if value is None:
                return None
            number = float(value)
            return number if math.isfinite(number) else None
        except (TypeError, ValueError, OverflowError):
            return None

    @classmethod
    def _mapping(cls, value: Any) -> Dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "to_dict"):
            try:
                converted = value.to_dict()
                return converted if isinstance(converted, dict) else {}
            except Exception:
                logger.debug("Could not convert provider value to mapping", exc_info=True)
        return {}

    @classmethod
    def _latest_row(cls, value: Any) -> Dict[str, Any]:
        if hasattr(value, "empty") and value.empty:
            return {}
        if hasattr(value, "iloc"):
            try:
                return cls._mapping(value.iloc[0])
            except (IndexError, KeyError, TypeError):
                return {}
        return cls._mapping(value)

    @classmethod
    def _field(cls, mapping: Dict[str, Any], *names: str) -> Optional[float]:
        normalized = {str(key).lower().replace("_", ""): value for key, value in mapping.items()}
        for name in names:
            value = cls._number(normalized.get(name.lower().replace("_", "")))
            if value is not None:
                return value
        return None

    @staticmethod
    def _date_string(value: Any) -> Optional[str]:
        if hasattr(value, "to_pydatetime"):
            value = value.to_pydatetime()
        if isinstance(value, (datetime, date)):
            return value.strftime("%Y-%m-%d")
        if value is None:
            return None
        text = str(value)
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).strftime("%Y-%m-%d")
        except ValueError:
            return text[:10] if len(text) >= 10 else None

    @staticmethod
    def _missing_coverage(symbol: str) -> Dict[str, Any]:
        return {"symbol": symbol, "available": False, **_UNAVAILABLE_MESSAGES}

    @staticmethod
    def _unavailable(symbol: str, reason: str) -> Dict[str, Any]:
        return {
            "symbol": symbol,
            "available": False,
            "reason": reason,
            "message_ar": "بيانات المحللين غير متاحة مؤقتًا",
            "message_en": "Analyst data is temporarily unavailable",
        }

    def fetch_consensus(self, symbol: str, market: Optional[str] = None) -> Dict[str, Any]:
        raw_symbol = symbol.strip().upper()
        try:
            return self._fetch_consensus(raw_symbol, market)
        except Exception as exc:
            logger.warning("Failed to fetch analyst consensus for %s: %s", raw_symbol, exc)
            return self._unavailable(raw_symbol, "Analyst data temporarily unavailable")

    def _fetch_consensus(self, symbol: str, market: Optional[str] = None) -> Dict[str, Any]:
        if (market or "US").strip().upper() != "US":
            return self._missing_coverage(symbol.strip().upper())
        ticker_symbol = self.map_symbol(symbol, market)
        ticker = self._ticker_factory(ticker_symbol)
        recommendations = getattr(ticker, "recommendations", None)
        row = self._latest_row(recommendations)
        distribution = {
            key: int(self._field(row, key) or 0)
            for key in self.DISTRIBUTION_KEYS
        }
        total = sum(distribution.values())

        targets = self._mapping(getattr(ticker, "analyst_price_targets", None))
        target_low = self._field(targets, "low")
        target_average = self._field(targets, "mean", "average")
        target_high = self._field(targets, "high")
        current_price = self._field(targets, "current", "current_price")
        info: Dict[str, Any] = {}
        if total == 0 or (current_price is None and target_average is not None):
            info = self._mapping(getattr(ticker, "info", None))
        if current_price is None and (target_average is not None or total > 0):
            current_price = self._field(info, "currentPrice", "regularMarketPrice")

        if total == 0:
            has_valid_quote = any(
                info.get(key)
                for key in ("symbol", "shortName", "longName", "quoteType", "exchange", "currentPrice")
            )
            has_targets = any(value is not None for value in (target_low, target_average, target_high))
            if not has_valid_quote and not has_targets:
                raise RuntimeError("Yahoo Finance did not return analyst or quote data")
            return self._missing_coverage(symbol.strip().upper())

        positive = distribution["strong_buy"] + distribution["buy"]
        negative = distribution["sell"] + distribution["strong_sell"]
        score = (
            5 * distribution["strong_buy"]
            + 4 * distribution["buy"]
            + 3 * distribution["hold"]
            + 2 * distribution["sell"]
            + distribution["strong_sell"]
        ) / total
        recommendation = "BUY" if score > 3.25 else "SELL" if score < 2.75 else "HOLD"
        supporting_count = (
            positive if recommendation == "BUY"
            else negative if recommendation == "SELL"
            else distribution["hold"]
        )
        supporting_share = supporting_count / total
        strength = "STRONG" if supporting_share >= 0.6 else "MODERATE" if supporting_share >= 0.4 else "WEAK"
        upside = None
        if target_average is not None and current_price is not None and current_price > 0:
            upside = (target_average - current_price) / current_price * 100

        return {
            "available": True,
            "consensus": {
                "recommendation": recommendation,
                "strength": strength,
                "total_analysts": total,
                "distribution": distribution,
            },
            "price_targets": {
                "low": target_low,
                "average": target_average,
                "high": target_high,
                "current_price": current_price,
                "upside_pct": upside,
            },
        }

    def fetch_estimates(self, symbol: str) -> Dict[str, Any]:
        ticker = self._ticker_factory(self.map_symbol(symbol, "US"))
        eps = getattr(ticker, "earnings_estimate", None)
        revenue = getattr(ticker, "revenue_estimate", None)

        def period_value(table: Any, period: str) -> Optional[float]:
            if table is None:
                return None
            try:
                row = table.loc[period]
                return self._field(self._mapping(row), "avg", "average")
            except (AttributeError, KeyError, TypeError, IndexError):
                return None

        eps_current = period_value(eps, "0y")
        eps_next = period_value(eps, "+1y")
        revenue_current = period_value(revenue, "0y")
        revenue_next = period_value(revenue, "+1y")
        revenue_growth = None
        if revenue_current and revenue_next is not None and revenue_current != 0:
            revenue_growth = (revenue_next - revenue_current) / abs(revenue_current) * 100
        eps_growth = None
        if eps_current and eps_next is not None and eps_current != 0:
            eps_growth = (eps_next - eps_current) / abs(eps_current) * 100
        return {
            "eps_current_year": eps_current,
            "eps_next_year": eps_next,
            "revenue_current": revenue_current,
            "revenue_next": revenue_next,
            "growth_rate_pct": revenue_growth,
            "eps_growth_pct": eps_growth,
        }

    def fetch_recent_actions(self, symbol: str) -> List[Dict[str, Any]]:
        ticker = self._ticker_factory(self.map_symbol(symbol, "US"))
        actions = getattr(ticker, "upgrades_downgrades", None)
        if actions is None or (hasattr(actions, "empty") and actions.empty):
            return []

        records: List[Dict[str, Any]] = []
        if hasattr(actions, "iterrows"):
            items = actions.iterrows()
        elif isinstance(actions, list):
            items = enumerate(actions)
        else:
            return []
        for index, value in items:
            item = self._mapping(value)
            normalized = {str(key).lower().replace("_", ""): val for key, val in item.items()}
            action_text = str(normalized.get("action") or "").lower()
            from_rating = normalized.get("fromgrade") or normalized.get("fromrating")
            to_rating = normalized.get("tograde") or normalized.get("torating")
            if "initiat" in action_text or action_text in {"init", "initiated"}:
                action = "initiate"
            elif "downgrad" in action_text or action_text in {"down", "downgrade"}:
                action = "downgrade"
            elif "upgrad" in action_text or action_text in {"up", "upgrade"}:
                action = "upgrade"
            elif from_rating is None:
                action = "initiate"
            else:
                rating_order = {
                    "strong sell": 1, "sell": 2, "underperform": 2, "underweight": 2,
                    "hold": 3, "neutral": 3, "equal-weight": 3, "market perform": 3,
                    "buy": 4, "overweight": 4, "outperform": 4, "strong buy": 5,
                }
                from_score = rating_order.get(str(from_rating).lower(), 3)
                to_score = rating_order.get(str(to_rating).lower(), 3)
                if to_score == from_score:
                    continue
                action = "upgrade" if to_score > from_score else "downgrade"
            firm = normalized.get("firm") or normalized.get("broker")
            target = self._field(item, "targetPrice", "priceTarget", "target")
            action_date = normalized.get("gradedate") or normalized.get("date") or index
            date_value = self._date_string(action_date)
            if not date_value or not firm:
                continue
            records.append({
                "date": date_value,
                "firm": str(firm),
                "action": action,
                "from": str(from_rating) if from_rating is not None else None,
                "to": str(to_rating) if to_rating is not None else None,
                "target": target,
            })
        return sorted(records, key=lambda record: record["date"], reverse=True)[:5]

    def analyze(self, symbol: str, market: str = "US") -> AnalystConsensusResult:
        raw_symbol = symbol.strip().upper()
        market_code = market.strip().upper()
        if market_code != "US":
            result = self._missing_coverage(raw_symbol)
            return AnalystConsensusResult(
                symbol=raw_symbol,
                available=False,
                reason=result["reason"],
                message_ar=result["message_ar"],
                message_en=result["message_en"],
            )

        cache_key = f"{market_code}:{raw_symbol}"
        now = time.time()
        with self._cache_lock:
            cached = self._cache.get(cache_key)
            if cached and now - cached[0] < self.CACHE_TTL_SECONDS:
                return self._from_dict(cached[1])

        try:
            consensus_data = self.fetch_consensus(raw_symbol, market_code)
            if not consensus_data.get("available"):
                if consensus_data.get("reason") == "No analyst coverage":
                    with self._cache_lock:
                        self._cache[cache_key] = (now, consensus_data)
                return self._from_dict(consensus_data)
            try:
                estimates = self.fetch_estimates(raw_symbol)
            except Exception as exc:
                logger.warning("Failed to fetch analyst estimates for %s: %s", raw_symbol, exc)
                estimates = {
                    "eps_current_year": None,
                    "eps_next_year": None,
                    "revenue_current": None,
                    "revenue_next": None,
                    "growth_rate_pct": None,
                    "eps_growth_pct": None,
                }
            try:
                actions = self.fetch_recent_actions(raw_symbol)
            except Exception as exc:
                logger.warning("Failed to fetch rating actions for %s: %s", raw_symbol, exc)
                actions = []
            data = {
                "symbol": raw_symbol,
                "available": True,
                "consensus": consensus_data["consensus"],
                "price_targets": consensus_data["price_targets"],
                "estimates": estimates,
                "recent_actions": actions,
                "data_quality": {
                    "source": "yfinance",
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
            }
            with self._cache_lock:
                self._cache[cache_key] = (now, data)
            return self._from_dict(data)
        except Exception as exc:
            logger.warning("Failed to fetch analyst data for %s: %s", raw_symbol, exc)
            return self._from_dict(self._unavailable(raw_symbol, "Analyst data temporarily unavailable"))

    @staticmethod
    def _from_dict(data: Dict[str, Any]) -> AnalystConsensusResult:
        return AnalystConsensusResult(
            symbol=data["symbol"],
            available=data["available"],
            reason=data.get("reason"),
            message_ar=data.get("message_ar"),
            message_en=data.get("message_en"),
            consensus=data.get("consensus"),
            price_targets=data.get("price_targets"),
            estimates=data.get("estimates"),
            recent_actions=data.get("recent_actions"),
            data_quality=data.get("data_quality"),
        )


global_analyst_consensus_engine = AnalystConsensusEngine()
