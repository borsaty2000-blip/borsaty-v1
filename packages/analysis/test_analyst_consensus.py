"""Tests for analyst consensus parsing, availability, caching, and API responses."""

from datetime import datetime

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from fundamental.analyst_consensus import AnalystConsensusEngine
from main import app


class FakeTicker:
    def __init__(self, _symbol):
        self.recommendations = pd.DataFrame(
            [{"strongBuy": 10, "buy": 8, "hold": 7, "sell": 2, "strongSell": 1}],
            index=["0m"],
        )
        self.analyst_price_targets = {
            "low": 320.0,
            "mean": 385.5,
            "high": 450.0,
            "current": 331.9,
        }
        self.info = {}
        self.earnings_estimate = pd.DataFrame(
            [{"avg": 7.1}, {"avg": 8.15}], index=["0y", "+1y"]
        )
        self.revenue_estimate = pd.DataFrame(
            [{"avg": 416.16e9}, {"avg": 445.20e9}], index=["0y", "+1y"]
        )
        self.upgrades_downgrades = pd.DataFrame(
            [
                {
                    "Firm": "Morgan Stanley",
                    "ToGrade": "Buy",
                    "FromGrade": "Hold",
                    "Action": "up",
                    "priceTarget": 400.0,
                }
            ],
            index=[pd.Timestamp("2026-11-01")],
        )


@pytest.fixture
def engine():
    return AnalystConsensusEngine(ticker_factory=FakeTicker)


def test_mena_market_returns_bilingual_no_coverage_without_provider_call():
    def unexpected_call(_symbol):
        raise AssertionError("MENA coverage must not be queried from Yahoo Finance")

    result = AnalystConsensusEngine(unexpected_call).analyze("COMI", "EGX").to_dict()
    assert result["available"] is False
    assert result["reason"] == "No analyst coverage"
    assert result["message_ar"] == "لا توجد تغطية من المحللين لهذا السهم"
    assert result["message_en"] == "No analyst coverage available for this stock"


def test_fetch_consensus_calculates_distribution_targets_and_upside(engine):
    result = engine.fetch_consensus("AAPL", "US")
    assert result["consensus"]["total_analysts"] == 28
    assert result["consensus"]["recommendation"] == "BUY"
    assert result["consensus"]["strength"] == "STRONG"
    assert result["consensus"]["distribution"] == {
        "strong_buy": 10, "buy": 8, "hold": 7, "sell": 2, "strong_sell": 1,
    }
    assert result["price_targets"]["average"] == 385.5
    assert result["price_targets"]["upside_pct"] == pytest.approx(16.1494, rel=1e-4)


def test_fetch_estimates_calculates_growth_rates(engine):
    estimates = engine.fetch_estimates("AAPL")
    assert estimates["eps_current_year"] == 7.1
    assert estimates["eps_next_year"] == 8.15
    assert estimates["revenue_current"] == 416.16e9
    assert estimates["revenue_next"] == 445.20e9
    assert estimates["growth_rate_pct"] == pytest.approx(6.979, rel=1e-3)
    assert estimates["eps_growth_pct"] == pytest.approx(14.7887, rel=1e-3)


def test_fetch_recent_actions_normalizes_action_and_rating_change(engine):
    actions = engine.fetch_recent_actions("AAPL")
    assert actions == [{
        "date": "2026-11-01",
        "firm": "Morgan Stanley",
        "action": "upgrade",
        "from": "Hold",
        "to": "Buy",
        "target": 400.0,
    }]


def test_analyze_returns_complete_standardized_response(engine):
    result = engine.analyze("AAPL", "US").to_dict()
    assert result["symbol"] == "AAPL"
    assert result["available"] is True
    assert result["consensus"]["total_analysts"] == 28
    assert result["price_targets"]["current_price"] == 331.9
    assert result["estimates"]["eps_current_year"] == 7.1
    assert result["recent_actions"][0]["firm"] == "Morgan Stanley"
    assert result["data_quality"]["source"] == "yfinance"
    assert datetime.fromisoformat(result["data_quality"]["last_updated"])


def test_analyze_caches_provider_result_for_six_hours():
    call_count = 0

    def factory(symbol):
        nonlocal call_count
        call_count += 1
        return FakeTicker(symbol)

    engine = AnalystConsensusEngine(ticker_factory=factory)
    first = engine.analyze("AAPL", "US").to_dict()
    calls_after_first = call_count
    second = engine.analyze("AAPL", "US").to_dict()
    assert calls_after_first == 3
    assert call_count == calls_after_first
    assert second == first


def test_provider_failure_is_not_misreported_as_missing_coverage():
    class EmptyProvider:
        def __init__(self, _symbol):
            self.recommendations = None
            self.analyst_price_targets = {}
            self.info = {}

    class ValidStockWithoutCoverage(EmptyProvider):
        def __init__(self, symbol):
            super().__init__(symbol)
            self.info = {"symbol": symbol, "quoteType": "EQUITY"}

    failed_engine = AnalystConsensusEngine(EmptyProvider)
    failed = failed_engine.analyze("AAPL", "US").to_dict()
    uncovered = AnalystConsensusEngine(ValidStockWithoutCoverage).analyze("SMALL", "US").to_dict()
    assert failed_engine.fetch_consensus("AAPL", "US")["reason"] == "Analyst data temporarily unavailable"
    assert failed["available"] is False
    assert failed["reason"] == "Analyst data temporarily unavailable"
    assert uncovered["available"] is False
    assert uncovered["reason"] == "No analyst coverage"


def test_fastapi_endpoint_returns_mena_unavailable_response():
    client = TestClient(app)
    response = client.get("/fundamental/analyst-consensus/COMI?market=EGX")
    assert response.status_code == 200
    assert response.json()["available"] is False
    assert response.json()["reason"] == "No analyst coverage"
    assert response.json()["symbol"] == "COMI"
