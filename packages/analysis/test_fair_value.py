"""
test_fair_value.py — Tests for Borsaty 9-Model Institutional Fair Value Engine
Verifies 9 valuation models, sensitivity matrix, peer comparison, historical 90d tracking,
market maturity weighting, and edge cases.
"""

from unittest.mock import patch
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

    # 9-model engine specific assertions for COMI:
    # 1. Models used should be >= 7
    active_models = [k for k, m in res.models.items() if m.get("value") is not None and m.get("weight", 0) > 0]
    assert len(active_models) >= 7, f"Expected >= 7 active models for COMI, got {len(active_models)}"
    assert res.data_quality["models_used"] >= 7
    assert res.confidence_level == "HIGH"
    assert res.verdict == "UNDERVALUED"

    # 2. Check sensitivity matrix 3x3 (9 numbers)
    matrix = res.sensitivity["dcf_matrix"]
    assert len(matrix) == 3
    assert all(len(row) == 3 for row in matrix)
    assert len(res.sensitivity["row_labels"]) == 3
    assert len(res.sensitivity["col_labels"]) == 3

    # 3. Check peer comparison has >= 3 peers
    assert len(res.peer_comparison["peers"]) >= 3
    assert res.peer_comparison["sector_median_pe"] > 0

    # 4. Check historical tracking has 90 points
    assert len(res.historical_90d) == 90
    assert "date" in res.historical_90d[0]
    assert "fair_value" in res.historical_90d[0]
    assert "price" in res.historical_90d[0]


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

    # 2222 pays dividend yield > 2%, so DDM must be active with weight > 0
    ddm_model = res.models["ddm"]
    assert ddm_model["value"] is not None
    assert ddm_model["weight"] > 0
    assert "dividend yield" in ddm_model["reason"]


def test_fair_value_aapl_us(engine):
    res = engine.compute("AAPL")
    assert res.symbol == "AAPL"
    assert res.currency == "USD"
    assert res.market == "US"
    assert res.fair_value_range["mid"] > 100.0

    # For US market, DCF weight receives 1.5x boost and must be > 30% of normalized weight
    dcf_model = res.models["dcf"]
    assert dcf_model["weight"] > 0.30, f"Expected AAPL DCF weight > 0.30, got {dcf_model['weight']}"

    # AAPL dividend yield is < 2%, so DDM weight must be 0
    ddm_model = res.models["ddm"]
    assert ddm_model["weight"] == 0
    assert ddm_model["value"] is None


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
        "sector": "Financials",
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
        "wacc": 0.18,
        "growth_rate": 0.05,
    }
    res = engine.compute("OVERVAL", data)
    assert res.verdict == "OVERVALUED"
    assert res.margin_of_safety_pct < -10.0


def test_edge_cases(engine):
    # Edge case 1: Negative EPS and non-dividend
    neg_eps_data = {
        "current_price": 40.0,
        "eps": -2.5,
        "bvps": 15.0,
        "fcf_per_share": -1.0,
        "dividend_yield": 0.0,
        "sector": "Technology",
    }
    res_neg = engine.compute("NEG_EPS", neg_eps_data)
    assert res_neg.models["pe_relative"]["value"] is None
    assert res_neg.models["graham"]["value"] is None
    assert res_neg.models["peg"]["value"] is None
    assert res_neg.models["ddm"]["value"] is None

    # Edge case 2: Non-financial sector has pb_relative = None
    tech_data = {
        "current_price": 100.0,
        "eps": 5.0,
        "bvps": 20.0,
        "sector": "Technology",
    }
    res_tech = engine.compute("TECH_CO", tech_data)
    assert res_tech.models["pb_relative"]["value"] is None
    assert res_tech.models["pb_relative"]["weight"] == 0

    # Edge case 3: Less than 5 peers disables pe_relative
    with patch.dict("fundamental.fair_value.SECTOR_PEERS", {"RareSector": [{"symbol": "X", "pe": 10, "pb": 1}]}):
        res_rare = engine.compute("RARE", {"sector": "RareSector", "eps": 4.0})
        assert res_rare.models["pe_relative"]["value"] is None
        assert res_rare.models["pe_relative"]["weight"] == 0


def test_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    with patch("main.global_real_data_fetcher.fetch_quote") as mock_fetch:
        mock_fetch.return_value = {"price": 123.48, "currency": "EGP", "market": "EGX"}
        # Test GET fair-value
        response = client.get("/fundamental/fair-value/COMI")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "COMI"
        assert "fair_value_range" in data
        assert "margin_of_safety_pct" in data
        assert "models" in data
        assert "sensitivity" in data
        assert "peer_comparison" in data
        assert "historical_90d" in data

        # Test GET history
        response_hist = client.get("/fundamental/fair-value/COMI/history?days=90")
        assert response_hist.status_code == 200
        hist_data = response_hist.json()
        assert hist_data["symbol"] == "COMI"
        assert len(hist_data["history"]) == 90

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
