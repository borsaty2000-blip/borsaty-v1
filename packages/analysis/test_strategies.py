"""
test_strategies.py — Unit tests for Borsaty ProPicks Strategies
Verifies the 5 institutional strategies, backtest curves, and FastAPI endpoints.
"""

import pytest
from strategies import STRATEGY_REGISTRY, list_all_strategies, get_strategy


def test_strategy_registry_completeness():
    assert len(STRATEGY_REGISTRY) == 5
    for key in ["value", "momentum", "reversal", "dividend", "quality_growth"]:
        strat = get_strategy(key)
        assert strat is not None
        assert strat.id == key

    # Test aliases
    assert get_strategy("value_compounder") is not None
    assert get_strategy("momentum_leader") is not None
    assert get_strategy("reversal_hunter") is not None
    assert get_strategy("dividend_aristocrat") is not None
    assert get_strategy("growth") is not None


@pytest.mark.parametrize("strat_id", ["value", "momentum", "reversal", "dividend", "quality_growth"])
def test_strategy_picks_and_backtest(strat_id):
    strat = get_strategy(strat_id)
    picks = strat.get_picks()
    assert len(picks) >= 5
    for p in picks:
        assert p.symbol
        assert p.name_ar
        assert p.strategy_score >= 50.0
        assert p.current_price > 0
        assert p.target_price > 0
        assert p.stop_loss > 0
        assert p.risk_reward > 0
        assert len(p.rationale_ar) > 10

    # Backtest verification
    bt = strat.backtest_2y()
    assert bt.total_return_pct > bt.benchmark_return_pct
    assert bt.alpha_pct > 0
    assert bt.sharpe_ratio >= 1.5
    assert bt.sortino_ratio >= 1.5
    assert bt.win_rate_pct >= 60.0
    assert bt.cagr_pct > 0
    assert len(bt.performance_curve) == 24
    assert len(bt.monthly_returns) >= 12


def test_value_compounder_returns_core_stocks():
    """Verify Value Compounder returns COMI, ABUK, SWDY among top picks."""
    strat = get_strategy("value")
    picks = strat.get_picks()
    symbols = [p.symbol for p in picks]
    assert "COMI" in symbols
    assert "ABUK" in symbols
    assert "SWDY" in symbols


def test_strategy_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Test GET /strategies
    res = client.get("/strategies")
    assert res.status_code == 200
    data = res.json()
    assert "strategies" in data
    assert len(data["strategies"]) == 5

    # Test GET /strategies/momentum
    res_detail = client.get("/strategies/momentum")
    assert res_detail.status_code == 200
    data_detail = res_detail.json()
    assert data_detail["id"] == "momentum"
    assert len(data_detail["top_picks"]) >= 5

    # Test GET /strategies/momentum/picks
    res_picks = client.get("/strategies/momentum/picks")
    assert res_picks.status_code == 200
    data_picks = res_picks.json()
    assert data_picks["id"] == "momentum"
    assert len(data_picks["top_picks"]) >= 5

    # Test GET /strategies/value/backtest
    res_bt = client.get("/strategies/value/backtest")
    assert res_bt.status_code == 200
    data_bt = res_bt.json()
    assert "performance_curve" in data_bt
    assert "cagr_pct" in data_bt
    assert "sharpe_ratio" in data_bt

    # Test 404 for invalid strategy
    res_404 = client.get("/strategies/unknown_strategy/picks")
    assert res_404.status_code == 404
