"""Dividend history, yield, growth, and stock-split data from Yahoo Finance."""

from __future__ import annotations

import logging
import math
import statistics
import threading
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

import yfinance as yf

logger = logging.getLogger("borsaty.dividends")

_UNAVAILABLE_MESSAGES = {
    "reason": "No dividend history",
    "message_ar": "لا توجد توزيعات أرباح لهذا السهم",
    "message_en": "No dividend history is available for this stock",
}

_CURRENCIES = {"US": "USD", "EGX": "EGP", "TASI": "SAR"}


@dataclass
class DividendsResult:
    symbol: str
    market: str
    available: bool
    reason: Optional[str] = None
    message_ar: Optional[str] = None
    message_en: Optional[str] = None
    current_yield: Optional[Dict[str, Any]] = None
    payout_ratio: Optional[Dict[str, Any]] = None
    growth: Optional[Dict[str, Any]] = None
    upcoming: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None
    splits: Optional[List[Dict[str, Any]]] = None
    data_quality: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "symbol": self.symbol,
            "market": self.market,
            "available": self.available,
        }
        if not self.available:
            result.update({
                "reason": self.reason,
                "message_ar": self.message_ar,
                "message_en": self.message_en,
                "history": self.history or [],
                "splits": self.splits or [],
                "data_quality": self.data_quality,
            })
            return result
        result.update({
            "current_yield": self.current_yield,
            "payout_ratio": self.payout_ratio,
            "growth": self.growth,
            "upcoming": self.upcoming,
            "history": self.history or [],
            "splits": self.splits or [],
            "data_quality": self.data_quality,
        })
        return result


class DividendsEngine:
    CACHE_TTL_SECONDS = 12 * 60 * 60

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
            number = float(value)
            return number if math.isfinite(number) else None
        except (TypeError, ValueError, OverflowError):
            return None

    @staticmethod
    def _date(value: Any) -> Optional[date]:
        if hasattr(value, "to_pydatetime"):
            value = value.to_pydatetime()
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, (int, float)):
            try:
                return datetime.fromtimestamp(value, tz=timezone.utc).date()
            except (OverflowError, OSError, ValueError):
                return None
        if value is not None:
            try:
                return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
            except ValueError:
                return None
        return None

    @staticmethod
    def _mapping(value: Any) -> Dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "to_dict"):
            try:
                converted = value.to_dict()
                return converted if isinstance(converted, dict) else {}
            except Exception:
                logger.debug("Could not convert Yahoo Finance value to mapping", exc_info=True)
        return {}

    @staticmethod
    def _get_optional(ticker: Any, attribute: str, symbol: str) -> Any:
        try:
            return getattr(ticker, attribute, None)
        except Exception as exc:
            logger.warning("Could not fetch %s for %s: %s", attribute, symbol, exc)
            return None

    def _ticker(self, symbol: str, market: Optional[str] = None) -> Any:
        return self._ticker_factory(self.map_symbol(symbol, market))

    def _dividends(self, ticker: Any, symbol: str) -> Any:
        try:
            return ticker.dividends
        except Exception as exc:
            logger.warning("Could not fetch dividend history for %s: %s", symbol, exc)
            raise RuntimeError(f"Dividend provider failed for {symbol}") from exc

    @classmethod
    def _records(cls, series: Any, years: int, currency: str) -> List[Dict[str, Any]]:
        cutoff = date.today() - timedelta(days=365 * years)
        if hasattr(series, "items"):
            items = series.items()
        elif isinstance(series, dict):
            items = series.items()
        else:
            return []

        records: List[Dict[str, Any]] = []
        for raw_date, raw_amount in items:
            event_date = cls._date(raw_date)
            amount = cls._number(raw_amount)
            if event_date is None or amount is None or amount <= 0 or event_date < cutoff:
                continue
            records.append({
                "date": event_date.isoformat(),
                "amount_per_share": amount,
                "currency": currency,
                "type": "regular",
            })
        records.sort(key=lambda item: item["date"])

        prior_amounts: List[float] = []
        for record in records:
            amount = record["amount_per_share"]
            if len(prior_amounts) >= 3 and amount > statistics.median(prior_amounts[-8:]) * 2.5:
                record["type"] = "special"
            else:
                prior_amounts.append(amount)
        return records

    @staticmethod
    def _frequency(records: List[Dict[str, Any]]) -> str:
        dates = [
            datetime.fromisoformat(record["date"]).date()
            for record in records
            if record["type"] == "regular"
        ]
        if len(dates) < 2:
            return "annual"
        gaps = [(right - left).days for left, right in zip(dates[:-1], dates[1:])][-4:]
        median_gap = statistics.median(gaps)
        if 55 <= median_gap <= 125:
            return "quarterly"
        if 125 < median_gap <= 245:
            return "semi-annual"
        return "annual"

    @staticmethod
    def _payments_per_year(frequency: str) -> int:
        return {"quarterly": 4, "semi-annual": 2, "annual": 1}.get(frequency, 1)

    @classmethod
    def _annual_dividend(cls, records: List[Dict[str, Any]], frequency: str) -> Optional[float]:
        regular = [record["amount_per_share"] for record in records if record["type"] == "regular"]
        if not regular:
            return None
        return sum(regular[-cls._payments_per_year(frequency):])

    @staticmethod
    def _price(info: Dict[str, Any], ticker: Any, symbol: str) -> Optional[float]:
        for key in ("currentPrice", "regularMarketPrice", "previousClose"):
            price = DividendsEngine._number(info.get(key))
            if price and price > 0:
                return price
        fast_info = DividendsEngine._get_optional(ticker, "fast_info", symbol)
        if fast_info is not None:
            fast_values = DividendsEngine._mapping(fast_info)
            for key in ("last_price", "lastPrice"):
                price = DividendsEngine._number(fast_values.get(key))
                if price and price > 0:
                    return price
            try:
                price = DividendsEngine._number(fast_info.get("last_price"))
                if price and price > 0:
                    return price
            except (AttributeError, TypeError):
                pass
        return None

    @classmethod
    def _has_valid_quote(cls, info: Dict[str, Any], fast_info: Any) -> bool:
        if any(info.get(key) for key in (
            "symbol", "shortName", "longName", "quoteType", "exchange", "currentPrice", "regularMarketPrice"
        )):
            return True
        fast_values = cls._mapping(fast_info)
        if any(fast_values.get(key) for key in ("last_price", "lastPrice", "exchange")):
            return True
        if fast_info is not None:
            try:
                return any(
                    getattr(fast_info, key, None)
                    for key in ("last_price", "exchange")
                )
            except Exception:
                logger.debug("Could not inspect Yahoo Finance quote metadata", exc_info=True)
        return False

    @classmethod
    def _yield(cls, records: List[Dict[str, Any]], info: Dict[str, Any], ticker: Any, symbol: str) -> Dict[str, Any]:
        frequency = cls._frequency(records)
        annual_dividend = cls._annual_dividend(records, frequency)
        price = cls._price(info, ticker, symbol)
        yield_pct = annual_dividend / price * 100 if annual_dividend is not None and price else None
        return {
            "annual_dividend": annual_dividend,
            "current_yield_pct": yield_pct,
            "frequency": frequency,
        }

    @classmethod
    def _payout_ratio(cls, annual_dividend: Optional[float], info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        eps = cls._number(info.get("trailingEps"))
        if annual_dividend is None or eps is None or eps <= 0:
            return None
        ratio = annual_dividend / eps * 100
        return {"payout_ratio_pct": ratio, "is_sustainable": ratio < 80}

    @classmethod
    def _growth(cls, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        annual: Dict[int, float] = {}
        for record in records:
            if record["type"] == "regular":
                year = int(record["date"][:4])
                annual[year] = annual.get(year, 0.0) + record["amount_per_share"]
        current_year = date.today().year
        year_values = [(year, annual[year]) for year in range(current_year - 5, current_year + 1) if annual.get(year, 0) > 0]
        cagr: Optional[float] = None
        if len(year_values) >= 2:
            first_year, first_value = year_values[0]
            last_year, last_value = year_values[-1]
            elapsed_years = last_year - first_year
            if elapsed_years >= 5 and first_value > 0 and last_value > 0:
                cagr = ((last_value / first_value) ** (1 / elapsed_years) - 1) * 100

        consecutive = 0
        for year in range(current_year, current_year - 6, -1):
            current = annual.get(year, 0.0)
            previous = annual.get(year - 1, 0.0)
            if current > previous > 0:
                consecutive += 1
            else:
                break
        return {
            "cagr_5y_pct": cagr,
            "consecutive_increase_years": consecutive,
            "is_aristocrat": consecutive >= 5,
        }

    @classmethod
    def _splits(cls, series: Any, years: int) -> List[Dict[str, Any]]:
        cutoff = date.today() - timedelta(days=365 * years)
        if hasattr(series, "items"):
            items = series.items()
        elif isinstance(series, dict):
            items = series.items()
        else:
            return []
        result: List[Dict[str, Any]] = []
        for raw_date, raw_factor in items:
            event_date = cls._date(raw_date)
            factor = cls._number(raw_factor)
            if event_date is None or factor is None or factor <= 0 or event_date < cutoff:
                continue
            ratio = f"{factor:g}:1" if factor >= 1 else f"1:{1 / factor:g}"
            result.append({"date": event_date.isoformat(), "ratio": ratio, "factor": factor})
        return sorted(result, key=lambda item: item["date"], reverse=True)

    @classmethod
    def _upcoming(
        cls,
        calendar: Any,
        info: Dict[str, Any],
        yield_data: Dict[str, Any],
        price: Optional[float],
    ) -> Optional[Dict[str, Any]]:
        ex_date_value = None
        if hasattr(calendar, "iterrows"):
            try:
                for index, row in calendar.iterrows():
                    if "ex-dividend" in str(index).lower().replace(" ", ""):
                        ex_date_value = row.iloc[0] if hasattr(row, "iloc") else row
                        break
            except (AttributeError, IndexError, TypeError):
                logger.debug("Could not read ex-dividend date from Yahoo calendar", exc_info=True)
        values = cls._mapping(calendar)
        for key, value in values.items():
            normalized_key = str(key).lower().replace("_", "").replace("-", "").replace(" ", "")
            if normalized_key == "exdividenddate":
                ex_date_value = value
                break
            if isinstance(value, dict):
                for nested_key, nested_value in value.items():
                    nested_normalized = str(nested_key).lower().replace("_", "").replace("-", "").replace(" ", "")
                    if nested_normalized == "exdividenddate":
                        ex_date_value = nested_value
                        break
        if isinstance(ex_date_value, (list, tuple)) and ex_date_value:
            ex_date_value = ex_date_value[0]
        ex_date = cls._date(ex_date_value)
        if ex_date is None:
            ex_date = cls._date(info.get("exDividendDate"))
        if ex_date is None or ex_date <= date.today():
            return None

        frequency = yield_data["frequency"]
        annual_dividend = yield_data["annual_dividend"]
        amount = cls._number(info.get("dividendRate"))
        if amount is not None:
            amount /= cls._payments_per_year(frequency)
        elif annual_dividend is not None:
            amount = annual_dividend / cls._payments_per_year(frequency)
        return {
            "ex_date": ex_date.isoformat(),
            "amount": amount,
            "yield_pct": amount / price * 100 if amount is not None and price else None,
            "days_until": (ex_date - date.today()).days,
        }

    def fetch_dividend_history(self, symbol: str, market: str, years: int = 5) -> List[Dict[str, Any]]:
        ticker = self._ticker(symbol, market)
        series = self._dividends(ticker, symbol)
        info = self._mapping(self._get_optional(ticker, "info", symbol))
        currency = str(info.get("currency") or _CURRENCIES.get(market.upper(), "USD"))
        return self._records(series, max(1, years), currency)

    def fetch_current_yield(self, symbol: str) -> Dict[str, Any]:
        ticker = self._ticker(symbol)
        series = self._dividends(ticker, symbol)
        info = self._mapping(self._get_optional(ticker, "info", symbol))
        records = self._records(series, 5, str(info.get("currency") or "USD"))
        return self._yield(records, info, ticker, symbol)

    def compute_payout_ratio(self, symbol: str) -> Optional[Dict[str, Any]]:
        ticker = self._ticker(symbol)
        series = self._dividends(ticker, symbol)
        info = self._mapping(self._get_optional(ticker, "info", symbol))
        records = self._records(series, 5, str(info.get("currency") or "USD"))
        yield_data = self._yield(records, info, ticker, symbol)
        return self._payout_ratio(yield_data["annual_dividend"], info)

    def compute_five_year_growth(self, symbol: str) -> Dict[str, Any]:
        ticker = self._ticker(symbol)
        series = self._dividends(ticker, symbol)
        info = self._mapping(self._get_optional(ticker, "info", symbol))
        records = self._records(series, 6, str(info.get("currency") or "USD"))
        return self._growth(records)

    def fetch_upcoming_dividend(self, symbol: str) -> Optional[Dict[str, Any]]:
        ticker = self._ticker(symbol)
        series = self._dividends(ticker, symbol)
        info = self._mapping(self._get_optional(ticker, "info", symbol))
        records = self._records(series, 5, str(info.get("currency") or "USD"))
        yield_data = self._yield(records, info, ticker, symbol)
        calendar = self._get_optional(ticker, "calendar", symbol)
        return self._upcoming(calendar, info, yield_data, self._price(info, ticker, symbol))

    def fetch_stock_splits(self, symbol: str, years: int = 5) -> List[Dict[str, Any]]:
        ticker = self._ticker(symbol)
        series = self._get_optional(ticker, "splits", symbol)
        return self._splits(series, max(1, years))

    def analyze(self, symbol: str, market: str = "US") -> DividendsResult:
        raw_symbol = symbol.strip().upper()
        market_code = market.strip().upper()
        if market_code not in _CURRENCIES:
            return DividendsResult(
                symbol=raw_symbol,
                market=market_code,
                available=False,
                reason="Unsupported market",
                message_ar="السوق غير مدعوم",
                message_en="Unsupported market",
            )

        cache_key = f"{market_code}:{raw_symbol}"
        now = time.time()
        with self._cache_lock:
            cached = self._cache.get(cache_key)
            if cached and now - cached[0] < self.CACHE_TTL_SECONDS:
                return self._from_dict(cached[1])

        try:
            ticker = self._ticker(raw_symbol, market_code)
            series = self._dividends(ticker, raw_symbol)
            info = self._mapping(self._get_optional(ticker, "info", raw_symbol))
            currency = str(info.get("currency") or _CURRENCIES[market_code])
            all_records = self._records(series, 6, currency)
            history = self._records(series, 5, currency)
            if not history:
                fast_info = self._get_optional(ticker, "fast_info", raw_symbol)
                if not self._has_valid_quote(info, fast_info):
                    return self._from_dict({
                        "symbol": raw_symbol,
                        "market": market_code,
                        "available": False,
                        "reason": "Dividend data temporarily unavailable",
                        "message_ar": "بيانات التوزيعات غير متاحة مؤقتًا",
                        "message_en": "Dividend data is temporarily unavailable",
                        "history": [],
                        "splits": [],
                    })
                missing = {
                    "symbol": raw_symbol,
                    "market": market_code,
                    "available": False,
                    **_UNAVAILABLE_MESSAGES,
                    "history": [],
                    "splits": [],
                    "data_quality": {
                        "source": "yfinance",
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                    },
                }
                with self._cache_lock:
                    self._cache[cache_key] = (now, missing)
                return self._from_dict(missing)

            yield_data = self._yield(history, info, ticker, raw_symbol)
            payout_ratio = self._payout_ratio(yield_data["annual_dividend"], info)
            upcoming = self._upcoming(
                self._get_optional(ticker, "calendar", raw_symbol),
                info,
                yield_data,
                self._price(info, ticker, raw_symbol),
            )
            splits = self._splits(self._get_optional(ticker, "splits", raw_symbol), 5)
            data = {
                "symbol": raw_symbol,
                "market": market_code,
                "available": True,
                "current_yield": yield_data,
                "payout_ratio": payout_ratio,
                "growth": self._growth(all_records),
                "upcoming": upcoming,
                "history": history,
                "splits": splits,
                "data_quality": {
                    "source": "yfinance",
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
            }
            with self._cache_lock:
                self._cache[cache_key] = (now, data)
            return self._from_dict(data)
        except Exception as exc:
            logger.warning("Failed to fetch dividend data for %s: %s", raw_symbol, exc)
            return self._from_dict({
                "symbol": raw_symbol,
                "market": market_code,
                "available": False,
                "reason": "Dividend data temporarily unavailable",
                "message_ar": "بيانات التوزيعات غير متاحة مؤقتًا",
                "message_en": "Dividend data is temporarily unavailable",
                "history": [],
                "splits": [],
            })

    @staticmethod
    def _from_dict(data: Dict[str, Any]) -> DividendsResult:
        return DividendsResult(
            symbol=data["symbol"],
            market=data["market"],
            available=data["available"],
            reason=data.get("reason"),
            message_ar=data.get("message_ar"),
            message_en=data.get("message_en"),
            current_yield=data.get("current_yield"),
            payout_ratio=data.get("payout_ratio"),
            growth=data.get("growth"),
            upcoming=data.get("upcoming"),
            history=data.get("history"),
            splits=data.get("splits"),
            data_quality=data.get("data_quality"),
        )


global_dividends_engine = DividendsEngine()
