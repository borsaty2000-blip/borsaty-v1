"""
test_strategies.py — Unit tests for Borsaty ProPicks Strategies
Verifies the 4 algorithmic selection models, backtest curves, and FastAPI endpoints.
"""

import pytest
from strategies import STRATEGY_REGISTRY, list_all_strategies, get_strategy


def test_strategy_registry_completeness():
    assert len(STRATEGY_REGISTRY) == 4
    for key in ["value", "momentum", "reversal", "dividend"]:
        strat = get_strategy(key)
        assert strat is not None
        assert strat.id == key


@pytest.mark.parametrize("strat_id", ["value", "momentum", "reversal", "dividend"])
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
    assert bt.win_rate_pct >= 60.0
    assert len(bt.performance_curve) == 24


def test_strategy_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Test GET /strategies
    res = client.get("/strategies")
    assert res.status_code == 200
    data = res.json()
    assert "strategies" in data
    assert len(data["strategies"]) == 4

    # Test GET /strategies/momentum/picks
    res_picks = client.get("/strategies/momentum/picks")
    assert res_picks.status_code == 200
    data_picks = res_picks.json()
    assert data_picks["id"] == "momentum"
    assert len(data_picks["top_picks"]) >= 5
    assert "backtest" in data_picks

    # Test 404 for invalid strategy
    res_404 = client.get("/strategies/unknown_strategy/picks")
    assert res_404.status_code == 404
