"""
Unit & Integration Tests for Borsaty Financials & 20 Ratios Engine
"""

import pytest
from fastapi.testclient import TestClient
from fundamental.financials import FinancialsEngine, global_financials_engine
from main import app


@pytest.fixture
def engine():
    return FinancialsEngine()


@pytest.fixture
def client():
    return TestClient(app)


def test_symbol_mapping(engine):
    """Test standard Borsaty ticker mapping to provider ticker formats."""
    assert engine.map_symbol("AAPL", "US") == "AAPL"
    assert engine.map_symbol("COMI", "EGX") == "COMI.CA"
    assert engine.map_symbol("SWDY", "EGX") == "SWDY.CA"
    assert engine.map_symbol("2222", "TASI") == "2222.SR"
    assert engine.map_symbol("COMI.CA", "EGX") == "COMI.CA"
    assert engine.map_symbol("1120.SR", "TASI") == "1120.SR"


def test_financials_structure_keys(engine):
    """Test that engine returns the standardized contract dictionary."""
    data = engine.get_financials("AAPL", period="annual", years=3)
    assert "symbol" in data
    assert "period" in data
    assert "income_statement" in data
    assert "balance_sheet" in data
    assert "cash_flow" in data
    assert "ratios" in data
    assert "data_quality" in data
    assert "is_available" in data["data_quality"]


def test_financials_aapl_real_data(engine):
    """Test that AAPL provides real 3-year annual financial statements."""
    data = engine.get_financials("AAPL", period="annual", years=3)
    assert data["data_quality"]["is_available"] is True
    assert len(data["income_statement"]) >= 2
    assert len(data["balance_sheet"]) >= 2
    assert len(data["cash_flow"]) >= 2

    latest_inc = data["income_statement"][0]
    assert latest_inc["revenue"] is not None and latest_inc["revenue"] > 1e11
    assert latest_inc["net_income"] is not None and latest_inc["net_income"] > 1e10
    assert "year" in latest_inc


def test_financials_20_ratios_presence(engine):
    """Test calculation and presence of key profitability, liquidity, leverage, and valuation ratios."""
    data = engine.get_financials("AAPL", period="annual", years=3)
    ratios = data["ratios"]

    expected_ratios = [
        "gross_margin", "operating_margin", "net_margin", "roe", "roa",
        "current_ratio", "quick_ratio",
        "debt_to_equity", "debt_to_ebitda", "interest_coverage",
        "asset_turnover", "inventory_turnover", "receivables_turnover",
        "pe", "pb", "ps", "ev_ebitda", "peg", "dividend_yield", "fcf_yield"
    ]
    for r in expected_ratios:
        assert r in ratios, f"Missing ratio key: {r}"

    # Verify AAPL has valid non-null figures for core ratios
    assert ratios["gross_margin"] is not None
    assert ratios["operating_margin"] is not None
    assert ratios["roe"] is not None
    assert ratios["pe"] is not None


def test_financials_quarterly_period(engine):
    """Test quarterly financials retrieval mode."""
    data = engine.get_financials("AAPL", period="quarterly", years=4)
    assert data["period"] == "quarterly"
    assert data["data_quality"]["is_available"] is True
    assert len(data["income_statement"]) >= 2


def test_financials_nonexistent_graceful_fallback(engine):
    """Test that invalid or missing tickers fail gracefully without uncaught exceptions."""
    data = engine.get_financials("ZZZZ_NONEXISTENT_TICKER_9999", period="annual", years=3)
    assert data["symbol"] == "ZZZZ_NONEXISTENT_TICKER_9999"
    assert data["data_quality"]["is_available"] is False
    assert len(data["income_statement"]) == 0
    assert len(data["balance_sheet"]) == 0
    assert len(data["cash_flow"]) == 0
    assert data["ratios"] == {}
    assert "not available" in data["data_quality"]["message"].lower()


def test_financials_comi_graceful_handling(engine):
    """Test COMI returns structured response without mock data."""
    data = engine.get_financials("COMI", period="annual", years=3, market="EGX")
    assert data["symbol"] == "COMI"
    assert "data_quality" in data
    assert isinstance(data["income_statement"], list)
    assert isinstance(data["balance_sheet"], list)
    assert isinstance(data["cash_flow"], list)


def test_fastapi_financials_endpoint(client):
    """Test the FastAPI HTTP GET /fundamental/financials/{symbol} endpoint."""
    res = client.get("/fundamental/financials/AAPL?period=annual&years=3")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["symbol"] == "AAPL"
    assert json_data["data_quality"]["is_available"] is True
    assert len(json_data["income_statement"]) >= 2
    assert "ratios" in json_data
