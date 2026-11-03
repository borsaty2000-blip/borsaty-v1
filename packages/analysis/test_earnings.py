"""
test_earnings.py — Unit tests for Institutional Earnings Call Intelligence Engine
Verifies Gemini API integration, prompt parsing, caching, financial surprise calculation,
and graceful degradation for US and MENA securities.
"""

from unittest.mock import patch, MagicMock
import pytest
from intelligence.earnings_analyzer import EarningsAnalyzer, global_earnings_analyzer


@pytest.fixture
def analyzer():
    an = EarningsAnalyzer(api_key="mock_gemini_key")
    return an


def test_earnings_analysis_fallback_comi():
    an = EarningsAnalyzer(api_key="")
    res = an.analyze("COMI", force_refresh=True)
    assert res["symbol"] == "COMI"
    assert "summary_ar" in res
    assert "summary_en" in res
    assert res["tone"] in ["OPTIMISTIC", "CAUTIOUS", "NEUTRAL"]
    assert len(res["red_flags"]) >= 1
    assert len(res["key_quotes"]) >= 1
    assert "forward_guidance" in res
    assert res["confidence"] >= 0.85
    assert res["transcript_available"] is False
    assert "reason" in res


def test_earnings_analysis_fallback_unknown():
    an = EarningsAnalyzer(api_key="")
    res = an.analyze("XYZ_CORP", force_refresh=True)
    assert res["symbol"] == "XYZ_CORP"
    assert res["tone"] in ["OPTIMISTIC", "CAUTIOUS", "NEUTRAL"]
    assert len(res["red_flags"]) >= 1


@patch("requests.post")
def test_earnings_gemini_api_call(mock_post, analyzer):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": """{
                                "key_points": ["Record quarterly revenue", "Strong margin expansion"],
                                "management_tone": "OPTIMISTIC",
                                "tone_change_vs_previous": "IMPROVED",
                                "sentiment_score": 0.85,
                                "guidance": {
                                    "revenue": "Low-to-mid single digits",
                                    "eps": "not provided",
                                    "changed_vs_previous": "RAISED"
                                },
                                "red_flags": ["Foreign exchange headwind"],
                                "key_quotes": [{"speaker": "CEO", "quote": "Highest revenue in company history."}],
                                "operational_highlights": ["Cloud business expanded 30%"],
                                "capital_allocation": "$10B returned via buybacks"
                            }"""
                        }
                    ]
                }
            }
        ]
    }
    mock_post.return_value = mock_response

    res = analyzer.analyze("TEST_SYM", transcript_text="Company had a great quarter.", force_refresh=True)
    assert res["symbol"] == "TEST_SYM"
    assert res["tone"] == "OPTIMISTIC"
    assert res["source"] == "gemini-api"
    assert res["confidence"] >= 0.90
    assert len(res["red_flags"]) == 1
    assert res["transcript_available"] is True


def test_fetch_transcript_us_and_mena():
    an = EarningsAnalyzer(api_key="")
    # US stock has pre-indexed transcript
    aapl_text = an.fetch_transcript("AAPL")
    assert aapl_text is not None
    assert "Tim Cook" in aapl_text
    assert "94.9 billion" in aapl_text

    # MENA stock has no public call transcript
    comi_text = an.fetch_transcript("COMI")
    assert comi_text is None

    swdy_text = an.fetch_transcript("SWDY")
    assert swdy_text is None


def test_extract_financials_and_surprise():
    an = EarningsAnalyzer(api_key="")
    fin_aapl = an.extract_financials(None, "AAPL")
    assert fin_aapl["revenue_actual"] > 90.0
    assert fin_aapl["revenue_estimate"] > 90.0
    assert fin_aapl["eps_actual"] > 1.50
    assert fin_aapl["verdict"] in ["BEAT", "MISS", "IN_LINE"]

    surprise = an.compute_earnings_surprise("AAPL")
    assert surprise["actual"] == fin_aapl["eps_actual"]
    assert surprise["verdict"] == fin_aapl["verdict"]


def test_fetch_historical_reactions():
    an = EarningsAnalyzer(api_key="")
    reactions = an.fetch_historical_reactions("AAPL", quarters=4)
    assert len(reactions) == 4
    for r in reactions:
        assert "quarter" in r
        assert "date" in r
        assert "return_3d_pct" in r
        assert isinstance(r["return_3d_pct"], (int, float))


def test_analyze_orchestrator_aapl_and_comi():
    an = EarningsAnalyzer(api_key="")
    # AAPL
    aapl_res = an.analyze("AAPL", force_refresh=True)
    assert aapl_res["symbol"] == "AAPL"
    assert aapl_res["transcript_available"] is True
    assert "analysis" in aapl_res
    assert aapl_res["analysis"]["management_tone"] in ["OPTIMISTIC", "CAUTIOUS", "NEUTRAL"]
    assert -1.0 <= aapl_res["analysis"]["sentiment_score"] <= 1.0
    assert len(aapl_res["analysis"]["key_points"]) >= 3
    assert len(aapl_res["historical_reactions"]) == 4

    # COMI (MENA graceful degradation)
    comi_res = an.analyze("COMI", force_refresh=True)
    assert comi_res["symbol"] == "COMI"
    assert comi_res["transcript_available"] is False
    assert "not available" in comi_res["reason"].lower()
    # Financials and historical reactions are still present!
    assert "financials" in comi_res
    assert "historical_reactions" in comi_res


def test_earnings_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Test GET latest
    res_get = client.get("/intelligence/earnings/COMI")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["symbol"] == "COMI"
    assert "tone" in data
    assert data["transcript_available"] is False

    # Test GET history
    res_hist = client.get("/intelligence/earnings/AAPL/history")
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert data_hist["symbol"] == "AAPL"
    assert len(data_hist["historical_reactions"]) == 4

    # Test POST
    payload = {"transcript_text": "CEO said margins will expand in 2027.", "force_refresh": False}
    res_post = client.post("/intelligence/earnings/SWDY", json=payload)
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert data_post["symbol"] == "SWDY"
