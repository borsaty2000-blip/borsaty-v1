"""
test_earnings.py — Unit tests for Earnings Call Intelligence Engine
Verifies Gemini API integration, prompt parsing, caching, and fallback execution.
"""

from unittest.mock import patch, MagicMock
import pytest
from intelligence.earnings_analyzer import EarningsAnalyzer, global_earnings_analyzer


@pytest.fixture
def analyzer(tmp_path):
    an = EarningsAnalyzer(api_key="mock_gemini_key")
    return an


def test_earnings_analysis_fallback_comi():
    an = EarningsAnalyzer(api_key="")
    res = an.analyze("COMI")
    assert res["symbol"] == "COMI"
    assert "summary_ar" in res
    assert "summary_en" in res
    assert res["tone"] in ["OPTIMISTIC", "CAUTIOUS", "NEUTRAL"]
    assert len(res["red_flags"]) >= 1
    assert len(res["key_quotes"]) >= 1
    assert "forward_guidance" in res
    assert res["confidence"] >= 0.85


def test_earnings_analysis_fallback_unknown():
    an = EarningsAnalyzer(api_key="")
    res = an.analyze("XYZ_CORP")
    assert res["symbol"] == "XYZ_CORP"
    assert res["tone"] == "OPTIMISTIC"
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
                                "summary_ar": "نمو قوي في الأرباح التشغيلية بنسبة 25%.",
                                "summary_en": "Strong 25% expansion in operating profit.",
                                "tone": "OPTIMISTIC",
                                "tone_ar": "متفائل",
                                "red_flags": ["ارتفاع تكلفة التمويل"],
                                "key_quotes": ["سجلنا أعلى إيرادات في تاريخ الشركة."],
                                "forward_guidance": "استمرار نمو المبيعات بنسبة 15%.",
                                "confidence": 0.96
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
    assert res["confidence"] == 0.96
    assert len(res["red_flags"]) == 1


def test_earnings_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Test GET
    res_get = client.get("/intelligence/earnings/COMI")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["symbol"] == "COMI"
    assert "tone" in data

    # Test POST
    payload = {"transcript_text": "CEO said margins will expand in 2027.", "force_refresh": False}
    res_post = client.post("/intelligence/earnings/SWDY", json=payload)
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert data_post["symbol"] == "SWDY"
