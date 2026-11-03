"""
test_insider.py — Comprehensive unit tests for Insider & Institutional Tracking Engine
Verifies SEC Form 4 parsing, 13F institutional holdings, cluster detection (3+ insiders / 30d),
insider track records, 12-month historical flow, and graceful degradation for MENA equities.
"""

import pytest
from intelligence.insider_tracker import InsiderTracker, global_insider_tracker


@pytest.fixture
def tracker():
    return InsiderTracker()


def test_insider_tracking_aapl_us(tracker):
    res = tracker.get_insider_activity("AAPL", force_refresh=True)
    assert res["symbol"] == "AAPL"
    assert "institutional_ownership" in res
    assert res["institutional_ownership"]["total_pct"] > 50.0
    assert len(res["transactions"]) >= 3
    # AAPL has 3 distinct buyers within October 2026 => cluster buy must be True
    assert res["has_cluster_buy"] is True
    assert res["cluster_info"]["insider_count"] >= 3
    assert "summary_ar" in res


def test_insider_tracking_comi_egx(tracker):
    res = tracker.get_insider_activity("COMI", force_refresh=True)
    assert res["symbol"] == "COMI"
    assert len(res["transactions"]) >= 3
    assert res["has_cluster_buy"] is True
    # In new schema, available is False for MENA
    assert res["available"] is False
    assert "reason" in res


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


def test_classify_transaction(tracker):
    # Purchase
    tx_buy = {"date": "2026-10-15", "insider": "Tim Cook", "role": "CEO", "type": "P", "shares": 1000, "price": 200.0}
    c_buy = tracker.classify_transaction(tx_buy)
    assert c_buy["type"] == "BUY"
    assert c_buy["value"] == 200000.0
    assert c_buy["is_open_market"] is True

    # Sale
    tx_sell = {"date": "2026-10-16", "insider": "Luca Maestri", "role": "CFO", "type": "S", "shares": 500, "price": 200.0}
    c_sell = tracker.classify_transaction(tx_sell)
    assert c_sell["type"] == "SELL"
    assert c_sell["value"] == 100000.0
    assert c_sell["is_open_market"] is True

    # Option Grant
    tx_grant = {"date": "2026-10-17", "insider": "Director X", "role": "Director", "type": "GRANT", "shares": 2000, "price": 0.0}
    c_grant = tracker.classify_transaction(tx_grant)
    assert c_grant["type"] == "OTHER"
    assert c_grant["is_open_market"] is False


def test_fetch_form4_filings_aapl_and_mena(tracker):
    aapl_txs = tracker.fetch_form4_filings("AAPL", days=90)
    assert len(aapl_txs) >= 3
    for t in aapl_txs:
        assert "date" in t
        assert "insider" in t
        assert "shares" in t
        assert "price" in t

    comi_txs = tracker.fetch_form4_filings("COMI", days=90)
    assert len(comi_txs) == 0


def test_detect_clusters_multi(tracker):
    txs = [
        {"date": "2026-10-01", "insider": "Executive A", "type": "BUY", "shares": 1000, "price": 50.0},
        {"date": "2026-10-12", "insider": "Executive B", "type": "BUY", "shares": 2000, "price": 51.0},
        {"date": "2026-10-24", "insider": "Executive C", "type": "BUY", "shares": 1500, "price": 52.0},
    ]
    clusters = tracker.detect_clusters(txs, window_days=30)
    assert len(clusters) == 1
    assert clusters[0]["type"] == "CLUSTER_BUY"
    assert clusters[0]["count"] == 3
    assert clusters[0]["total_value"] == 1000 * 50 + 2000 * 51 + 1500 * 52


def test_compute_insider_track_record(tracker):
    rec = tracker.compute_insider_track_record("Levinson Arthur D", "AAPL")
    assert 0.0 <= rec["hit_rate"] <= 1.0
    assert isinstance(rec["avg_return"], float)
    assert rec["trades"] > 0


def test_fetch_13f_holdings_top10(tracker):
    holdings = tracker.fetch_13f_holdings("AAPL")
    assert len(holdings) == 10
    top1 = holdings[0]
    assert "institution" in top1
    assert "shares" in top1
    assert "value" in top1
    assert "percent_of_company" in top1
    assert "change_pct" in top1


def test_analyze_orchestrator_schema_aapl(tracker):
    res = tracker.analyze("AAPL", force_refresh=True)
    assert res["symbol"] == "AAPL"
    assert "as_of" in res
    assert res["data_quality"]["available"] is True
    assert len(res["insider_transactions"]) >= 3
    assert len(res["clusters"]) >= 1
    assert res["insider_summary"]["total_buys_90d"] >= 3
    assert res["insider_summary"]["cluster_buy_detected"] is True
    assert len(res["institutional_holdings"]) == 10
    assert res["institutional_summary"]["top_10_concentration_pct"] > 30.0


def test_analyze_graceful_degradation_comi(tracker):
    res = tracker.analyze("COMI", force_refresh=True)
    assert res["symbol"] == "COMI"
    assert res["available"] is False
    assert "US-listed" in res["reason"]
    assert "message_ar" in res
    assert "message_en" in res


def test_insider_history_12m(tracker):
    history = tracker.get_history("AAPL", days=365)
    assert len(history) == 12
    for h in history:
        assert "month" in h
        assert "buy_value_m" in h
        assert "sell_value_m" in h


def test_insider_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Test GET main
    res = client.get("/intelligence/insider/AAPL")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "AAPL"
    assert "transactions" in data
    assert "has_cluster_buy" in data

    # Test GET history
    res_h = client.get("/intelligence/insider/AAPL/history?days=365")
    assert res_h.status_code == 200
    data_h = res_h.json()
    assert data_h["symbol"] == "AAPL"
    assert len(data_h["history"]) == 12
