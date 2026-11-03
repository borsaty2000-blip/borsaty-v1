"""
test_insider.py — Unit tests for Insider & Institutional Tracking Engine
Verifies SEC Form 4 and 13F parsing, cluster buy detection algorithm, and FastAPI endpoint.
"""

import pytest
from intelligence.insider_tracker import InsiderTracker, global_insider_tracker


@pytest.fixture
def tracker():
    return InsiderTracker()


def test_insider_tracking_aapl_us(tracker):
    res = tracker.get_insider_activity("AAPL")
    assert res["symbol"] == "AAPL"
    assert "institutional_ownership" in res
    assert res["institutional_ownership"]["total_pct"] > 50.0
    assert len(res["transactions"]) >= 3
    # AAPL has 3 distinct buyers within October 2026 => cluster buy must be True
    assert res["has_cluster_buy"] is True
    assert res["cluster_info"]["insider_count"] >= 3
    assert "summary_ar" in res


def test_insider_tracking_comi_egx(tracker):
    res = tracker.get_insider_activity("COMI")
    assert res["symbol"] == "COMI"
    assert len(res["transactions"]) >= 3
    assert res["has_cluster_buy"] is True


def test_cluster_buy_detection_synthetic():
    # Negative case: only 2 buyers
    txs_neg = [
        {"date": "2026-10-01", "insider_name": "Alice", "transaction_type": "BUY", "shares": 100, "price": 10, "total_value": 1000},
        {"date": "2026-10-10", "insider_name": "Bob", "transaction_type": "BUY", "shares": 200, "price": 10, "total_value": 2000},
        {"date": "2026-10-15", "insider_name": "Charlie", "transaction_type": "SELL", "shares": 500, "price": 10, "total_value": 5000},
    ]
    has_cluster, _ = InsiderTracker.detect_cluster_buys(txs_neg)
    assert has_cluster is False

    # Positive case: 3 distinct buyers within 30 days
    txs_pos = txs_neg + [
        {"date": "2026-10-20", "insider_name": "David", "transaction_type": "BUY", "shares": 300, "price": 10, "total_value": 3000},
    ]
    has_cluster_pos, info = InsiderTracker.detect_cluster_buys(txs_pos)
    assert has_cluster_pos is True
    assert info["insider_count"] == 3


def test_insider_fastapi_endpoint():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    res = client.get("/intelligence/insider/AAPL")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "AAPL"
    assert "transactions" in data
    assert "has_cluster_buy" in data
