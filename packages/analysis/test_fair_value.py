"""
test_fair_value.py — Tests for Borsaty Fair Value Engine
Verifies DCF, Relative Multiples (P/E, P/B), Graham Number, Reverse DCF,
Margin of Safety, and Verdict determination across MENA and US tickers.
"""

import pytest
from fundamental.fair_value import FairValueEngine, FairValueResult, global_fair_value_engine


@pytest.fixture
def engine():
    return FairValueEngine()


def test_fair_value_comi(engine):
    res = engine.compute("COMI")
    assert isinstance(res, FairValueResult)
    assert res.symbol == "COMI"
    assert res.current_price > 0
    assert res.dcf_value > 0
    assert res.relative_pe_value > 0
    assert res.relative_pb_value > 0
    assert res.graham_number > 0
    assert "low" in res.fair_value_range
    assert "mid" in res.fair_value_range
    assert "high" in res.fair_value_range
    assert res.fair_value_range["low"] <= res.fair_value_range["mid"] <= res.fair_value_range["high"]
    assert res.verdict in ["UNDERVALUED", "FAIR", "OVERVALUED"]
    assert isinstance(res.margin_of_safety_pct, float)
    assert res.confidence >= 0.70


def test_fair_value_swdy(engine):
    res = engine.compute("SWDY")
    assert res.symbol == "SWDY"
    assert res.current_price == 108.60
    assert res.fair_value_range["mid"] > 50.0
    assert res.reverse_dcf_implied_growth != 0.0


def test_fair_value_2222_tasi(engine):
    res = engine.compute("2222")
    assert res.symbol == "2222"
    assert res.currency == "SAR"
    assert res.market == "TASI"
    assert 15.0 < res.fair_value_range["mid"] < 50.0


def test_fair_value_aapl_us(engine):
    res = engine.compute("AAPL")
    assert res.symbol == "AAPL"
    assert res.currency == "USD"
    assert res.market == "US"
    assert res.fair_value_range["mid"] > 100.0


def test_custom_data_payload(engine):
    custom_data = {
        "current_price": 50.0,
        "eps": 6.0,
        "bvps": 30.0,
        "fcf_per_share": 5.5,
        "sector_pe": 12.0,
        "sector_pb": 1.8,
        "wacc": 0.11,
        "growth_rate": 0.10,
        "terminal_growth": 0.03,
    }
    res = engine.compute("CUSTOM", custom_data)
    assert res.symbol == "CUSTOM"
    assert res.current_price == 50.0
    # PE = 12 * 6 = 72
    assert res.relative_pe_value == 72.0
    # PB = 1.8 * 30 = 54
    assert res.relative_pb_value == 54.0
    # Graham = sqrt(22.5 * 6 * 30) = sqrt(4050) = 63.64
    assert round(res.graham_number, 1) == 63.6
    # Mid should be well above 50 => UNDERVALUED with positive margin of safety
    assert res.verdict == "UNDERVALUED"
    assert res.margin_of_safety_pct > 10.0


def test_overvalued_verdict(engine):
    data = {
        "current_price": 200.0,
        "eps": 2.0,
        "bvps": 10.0,
        "fcf_per_share": 1.5,
        "sector_pe": 10.0,
        "sector_pb": 1.5,
    }
    res = engine.compute("OVERVAL", data)
    assert res.verdict == "OVERVALUED"
    assert res.margin_of_safety_pct < -10.0


def test_fastapi_endpoints():
    from unittest.mock import patch
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    with patch("main.global_real_data_fetcher.fetch_quote") as mock_fetch:
        mock_fetch.return_value = {"price": 123.50, "currency": "EGP", "market": "EGX"}
        # Test GET
        response = client.get("/fundamental/fair-value/COMI")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "COMI"
        assert "fair_value_range" in data
        assert "margin_of_safety_pct" in data

    # Test POST
    payload = {
        "symbol": "SWDY",
        "current_price": 108.6,
        "eps": 13.4,
        "bvps": 69.5,
    }
    response_post = client.post("/fundamental/fair-value", json=payload)
    assert response_post.status_code == 200
    data_post = response_post.json()
    assert data_post["symbol"] == "SWDY"
    assert data_post["current_price"] == 108.6
