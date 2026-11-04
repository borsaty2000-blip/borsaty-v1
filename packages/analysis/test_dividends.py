"""Tests for dividend history, calculations, unavailable data, and API responses."""

from datetime import date

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from fundamental.dividends import DividendsEngine
from main import app, global_dividends_engine


class FakeTicker:
    def __init__(self, symbol):
        self.dividends = pd.Series(dtype=float)
        self.info = {"symbol": symbol, "quoteType": "EQUITY", "currency": "USD"}
        self.calendar = {}
        self.splits = pd.Series(dtype=float)
        self.fast_info = {}


def engine_for(ticker):
    return DividendsEngine(ticker_factory=lambda _symbol: ticker)


def test_market_symbol_mapping():
    assert DividendsEngine.map_symbol("AAPL", "US") == "AAPL"
    assert DividendsEngine.map_symbol("COMI", "EGX") == "COMI.CA"
    assert DividendsEngine.map_symbol("2222", "TASI") == "2222.SR"
    assert DividendsEngine.map_symbol("1120.SR", "TASI") == "1120.SR"


def test_history_normalizes_currency_filters_years_and_marks_unusually_large_payment():
    ticker = FakeTicker("AAPL")
    today = date.today()
    dates = pd.date_range(end=pd.Timestamp(today), periods=5, freq="QE")
    ticker.dividends = pd.Series([0.20, 0.21, 0.22, 0.23, 0.80], index=dates)
    ticker.info = {"currency": "USD"}

    history = engine_for(ticker).fetch_dividend_history("AAPL", "US", years=2)

    assert len(history) == 5
    assert all(item["currency"] == "USD" for item in history)
    assert history[-1]["type"] == "special"
    assert history[0]["date"] == dates[0].date().isoformat()


def test_current_yield_and_payout_ratio_use_quarterly_dividend_and_eps():
    ticker = FakeTicker("MSFT")
    dates = pd.date_range(end=pd.Timestamp(date.today()), periods=4, freq="QE")
    ticker.dividends = pd.Series([0.75, 0.75, 0.75, 0.75], index=dates)
    ticker.info = {"currentPrice": 300.0, "trailingEps": 10.0}

    engine = engine_for(ticker)
    current_yield = engine.fetch_current_yield("MSFT")
    payout = engine.compute_payout_ratio("MSFT")

    assert current_yield == {
        "annual_dividend": 3.0,
        "current_yield_pct": pytest.approx(1.0),
        "frequency": "quarterly",
    }
    assert payout == {"payout_ratio_pct": 30.0, "is_sustainable": True}


def test_payout_ratio_is_unavailable_for_nonpositive_eps():
    ticker = FakeTicker("LOSS")
    ticker.dividends = pd.Series([1.0], index=[pd.Timestamp(date.today())])
    ticker.info = {"trailingEps": 0.0}

    assert engine_for(ticker).compute_payout_ratio("LOSS") is None


def test_growth_computes_five_year_cagr_and_aristocrat_status():
    ticker = FakeTicker("GROW")
    today = date.today()
    dates = [pd.Timestamp(date(today.year - offset, today.month, 1)) for offset in range(5, -1, -1)]
    ticker.dividends = pd.Series([5.0, 6.0, 7.0, 8.0, 9.0, 10.0], index=dates)

    growth = engine_for(ticker).compute_five_year_growth("GROW")

    assert growth["cagr_5y_pct"] == pytest.approx((2 ** 0.2 - 1) * 100)
    assert growth["consecutive_increase_years"] == 5
    assert growth["is_aristocrat"] is True


def test_upcoming_dividend_requires_future_ex_date_and_returns_estimated_payment():
    ticker = FakeTicker("FUTURE")
    dates = pd.date_range(end=pd.Timestamp(date.today()), periods=4, freq="QE")
    ticker.dividends = pd.Series([0.5, 0.5, 0.5, 0.5], index=dates)
    ticker.info = {
        "currentPrice": 100.0,
        "dividendRate": 2.0,
        "exDividendDate": int(pd.Timestamp(date.today()).timestamp()) + 30 * 86400,
    }

    upcoming = engine_for(ticker).fetch_upcoming_dividend("FUTURE")

    assert upcoming is not None
    assert upcoming["amount"] == 0.5
    assert upcoming["yield_pct"] == pytest.approx(0.5)
    assert upcoming["days_until"] > 0

    ticker.info["exDividendDate"] = int(pd.Timestamp(date.today()).timestamp()) - 86400
    assert engine_for(ticker).fetch_upcoming_dividend("FUTURE") is None


def test_splits_are_normalized_and_limited_to_requested_period():
    ticker = FakeTicker("SPLIT")
    ticker.splits = pd.Series(
        [2.0, 0.2],
        index=[pd.Timestamp(date.today() - pd.Timedelta(days=200)), pd.Timestamp(date.today() - pd.Timedelta(days=3000))],
    )

    assert engine_for(ticker).fetch_stock_splits("SPLIT", years=2) == [{
        "date": (date.today() - pd.Timedelta(days=200)).isoformat(),
        "ratio": "2:1",
        "factor": 2.0,
    }]


def test_no_dividend_history_returns_bilingual_fallback_and_api_response(monkeypatch):
    ticker = FakeTicker("TSLA")
    result = engine_for(ticker).analyze("TSLA", "US").to_dict()

    assert result["available"] is False
    assert result["reason"] == "No dividend history"
    assert result["message_ar"] == "لا توجد توزيعات أرباح لهذا السهم"

    monkeypatch.setattr(global_dividends_engine, "analyze", lambda symbol, market: engine_for(ticker).analyze(symbol, market))
    response = TestClient(app).get("/fundamental/dividends/TSLA?market=US")
    assert response.status_code == 200
    assert response.json()["available"] is False
    assert response.json()["symbol"] == "TSLA"

    ticker = FakeTicker("AAPL")
    ticker.info = {}
    ticker.fast_info = {}
    provider_error = engine_for(ticker).analyze("AAPL", "US").to_dict()
    assert provider_error["available"] is False
    assert provider_error["reason"] == "Dividend data temporarily unavailable"
