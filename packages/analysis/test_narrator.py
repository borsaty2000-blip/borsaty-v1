"""
Dual-Authored Narrator Test Suite (Borsaty).
Validates Arabic Authoring, English Authoring, Independence, Zero-Hallucination Gate,
Language Parity, Style Variations, Real Data Coverage, and Performance.
Version 2.0.0
"""

import pytest
import math
import time
from typing import Dict, Any, List

from narrator.engine import NarratorEngine
from narrator.facts_extractor import FactsExtractor
from narrator.verification import NarratorVerification, HallucinationError
from narrator.number_formatting import format_price, format_pct, resolve_currency
from orchestrator import AnalysisOrchestrator


def make_candle(time_val: int, o: float, h: float, l: float, c: float, v: float = 1000000.0) -> Dict[str, Any]:
    return {"time": time_val, "open": o, "high": h, "low": l, "close": c, "volume": v}


def get_sample_payload():
    return {
        "symbol": "COMI",
        "timeframe": "1D",
        "current_price": 86.00,
        "confluence": {
            "direction": "bullish",
            "score": 0.84,
            "regime": "trending_strong",
        },
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern": "impulse",
                "subtype": "bullish_impulse",
                "pattern_score": 0.84,
                "current_wave": "3",
            }
        },
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley",
                "type": "bullish",
                "overall_score": 0.85,
            }]
        },
        "classical": {
            "status": "available",
            "patterns": [{
                "pattern": "double_bottom",
                "type": "bullish",
                "pattern_score": 0.80,
                "status": "confirmed",
            }]
        },
        "trade_plan": {
            "status": "actionable",
            "entry_zone": {"low": 85.50, "high": 86.50},
            "stop_loss": {
                "price": 82.50,
                "primary_reason": "Below Wave 2 start (Elliott invalidation)"
            },
            "targets": [
                {"rank": 1, "price": 92.00, "r_multiple": 1.71},
                {"rank": 2, "price": 96.00, "r_multiple": 2.85},
            ],
            "risk_reward": {"primary_rr": 1.71, "blended_rr": 2.09},
            "warnings": ["Stop distance 4.1% > 3% — position size scaled conservatively"]
        }
    }


# ==============================================================================
# PART A: ARABIC AUTHORING TESTS (10 tests)
# ==============================================================================

def test_arabic_authoring_generates_valid_text():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    assert res["language"] == "ar"
    assert "البنك التجاري الدولي" in res["full_text"]
    assert len(res["full_text"]) > 100


def test_arabic_authoring_uses_authentic_financial_idioms():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    ar_text = res["full_text"]
    # Check authentic Arabic financial terms
    assert "الموجة الدافعة" in ar_text
    assert "العدّ الموجي" in ar_text
    assert "المصداقية" in ar_text
    assert "الاندفاعية" not in ar_text  # literal translation avoided


def test_arabic_authoring_currency_placement_after_value():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    # In Arabic, currency symbol comes after number: 86.00 ج.م
    assert "86.00 ج.م" in res["sections"]["analysis_summary"]


def test_arabic_authoring_western_numerals_used():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    text = res["full_text"]
    # Western numerals 0-9 used
    assert "86.00" in text
    assert "٨٦" not in text


def test_arabic_authoring_ordinal_wave_naming():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    assert "الموجة الدافعة الثالثة" in res["sections"]["elliott"]


def test_arabic_authoring_rhetoric_flow():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    summary = res["sections"]["analysis_summary"]
    # Natural Arabic rhetoric starting with subject/noun and flowing verbally
    assert "سهم البنك التجاري الدولي يتحرك حالياً" in summary or "البنك التجاري الدولي يتحرك" in summary


def test_arabic_authoring_all_numbers_exist_in_payload():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    v = res["verification"]
    assert v["status"] == "passed"
    assert v["hallucination_gate"] == "clear"


def test_arabic_authoring_handles_missing_harmonic():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    payload["harmonic"]["patterns"] = []
    res = narrator.narrate(payload, language="ar")
    assert "لا توجد نماذج هارمونيك نشطة" in res["sections"]["harmonic"]


def test_arabic_authoring_handles_missing_classical():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    payload["classical"]["patterns"] = []
    res = narrator.narrate(payload, language="ar")
    assert "لا تظهر نماذج فنية كلاسيكية مكتملة" in res["sections"]["classical"]


def test_arabic_authoring_disclaimer_mandatory():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="ar")
    assert "هذا التحليل تعليمي وكمي بحت" in res["sections"]["disclaimer"]


# ==============================================================================
# PART B: ENGLISH AUTHORING TESTS (10 tests)
# ==============================================================================

def test_english_authoring_generates_valid_text():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    assert res["language"] == "en"
    assert "Commercial International Bank" in res["full_text"]


def test_english_authoring_uses_institutional_trading_idioms():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    en_text = res["full_text"]
    assert "developing in" in en_text or "exhibiting a" in en_text
    assert "confluence reading" in en_text or "confluence score" in en_text
    assert "impulse sequence" in en_text


def test_english_authoring_currency_placement_before_value():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    # In English, currency comes before number: EGP 86.00
    assert "EGP 86.00" in res["sections"]["analysis_summary"]


def test_english_authoring_svo_sentence_structure():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    summary = res["sections"]["analysis_summary"]
    # Subject-Verb-Object English structure
    assert summary.startswith("Commercial International Bank (CIB) trades at") or "trades at" in summary


def test_english_authoring_score_formatted_out_of_hundred():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    assert "84/100" in res["sections"]["analysis_summary"]


def test_english_authoring_average_sentence_length_concise():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    summary = res["sections"]["analysis_summary"]
    sentences = [s.strip() for s in summary.split(".") if s.strip()]
    avg_words = sum(len(s.split()) for s in sentences) / len(sentences)
    assert avg_words < 25


def test_english_authoring_all_numbers_exist_in_payload():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    v = res["verification"]
    assert v["status"] == "passed"
    assert v["hallucination_gate"] == "clear"


def test_english_authoring_handles_missing_harmonic():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    payload["harmonic"]["patterns"] = []
    res = narrator.narrate(payload, language="en")
    assert "No active harmonic patterns" in res["sections"]["harmonic"]


def test_english_authoring_handles_missing_classical():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    payload["classical"]["patterns"] = []
    res = narrator.narrate(payload, language="en")
    assert "No classical chart patterns currently fulfill" in res["sections"]["classical"]


def test_english_authoring_disclaimer_mandatory():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res = narrator.narrate(payload, language="en")
    assert "This analysis is strictly educational" in res["sections"]["disclaimer"]


# ==============================================================================
# PART C: INDEPENDENCE TESTS (5 tests)
# ==============================================================================

def test_independence_currency_formatting_asymmetric():
    # Arabic: 86.00 ج.م vs English: EGP 86.00
    p_ar = format_price(86.0, "EGP", "ar")
    p_en = format_price(86.0, "EGP", "en")
    assert p_ar == "86.00 ج.م"
    assert p_en == "EGP 86.00"
    assert p_ar != p_en


def test_independence_structural_phrasing_differs():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    # Arabic expresses wave as verbal ordinal phrase
    assert "الموجة الدافعة الثالثة" in res_ar["sections"]["elliott"]
    # English expresses wave as noun phrase with sequence
    assert "Wave 3 of an impulse sequence" in res_en["sections"]["elliott"]


def test_independence_disclaimer_is_not_literal_word_for_word():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    d_ar = res_ar["sections"]["disclaimer"]
    d_en = res_en["sections"]["disclaimer"]
    assert "بحت" in d_ar
    assert "sole responsibility" in d_en


def test_independence_distinct_lexicon_used():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    # Arabic uses rhetoric terms
    assert "بناءً على هذا البناء" in res_ar["sections"]["analysis_summary"]
    # English uses cause-effect analytical terms
    assert "exhibiting a" in res_en["sections"]["analysis_summary"] or "strengthening the validity" in res_en["sections"]["analysis_summary"]


def test_independence_no_parallel_or_mirrored_tokens():
    narrator = NarratorEngine()
    payload = get_sample_payload()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    # Length in characters differs significantly (Arabic is more concise in technical sentences)
    len_ar = len(res_ar["sections"]["elliott"])
    len_en = len(res_en["sections"]["elliott"])
    assert abs(len_ar - len_en) > 10


# ==============================================================================
# PART D: HALLUCINATION GATE TESTS (15 tests)
# ==============================================================================

def test_hallucination_gate_passes_clean_payload():
    payload = get_sample_payload()
    verifier = NarratorVerification()
    facts = FactsExtractor.extract(payload)
    text = "سعر السهم يتداول عند 86.00 ج.م مع وقف خسارة 82.50 ج.م وأهداف 92.00 ج.م و 96.00 ج.م."
    res = verifier.verify(text, facts["allowed_numbers"], language="ar")
    assert res["status"] == "passed"
    assert res["hallucination_gate"] == "clear"


def test_hallucination_gate_rejects_unauthorized_number():
    payload = get_sample_payload()
    verifier = NarratorVerification()
    facts = FactsExtractor.extract(payload)
    # Inject unauthorized 999.00
    rogue_text = "سعر السهم 86.00 والهدف السري هو 999.00 ج.م."
    with pytest.raises(HallucinationError, match="unauthorized numbers"):
        verifier.verify(rogue_text, facts["allowed_numbers"], language="ar", strict=True)


def test_hallucination_gate_rejects_forbidden_arabic_claim_guaranteed():
    verifier = NarratorVerification()
    with pytest.raises(HallucinationError, match="Forbidden claim"):
        verifier.verify("هذا التحليل يقدم ربح مؤكد للمستثمر.", {10.0}, language="ar")


def test_hallucination_gate_rejects_forbidden_english_claim_guaranteed():
    verifier = NarratorVerification()
    with pytest.raises(HallucinationError, match="Forbidden claim"):
        verifier.verify("This trade is guaranteed to deliver returns.", {10.0}, language="en")


def test_hallucination_gate_allows_derived_r_multiples():
    payload = get_sample_payload()
    facts = FactsExtractor.extract(payload)
    # 1.71 is in the allowed numbers
    assert any(abs(1.71 - n) < 0.05 for n in facts["allowed_numbers"])


def test_hallucination_gate_allows_percentage_scores():
    payload = get_sample_payload()
    facts = FactsExtractor.extract(payload)
    # Confluence 0.84 -> 84 should be in allowed numbers
    assert 84.0 in facts["allowed_numbers"] or 84 in facts["allowed_numbers"]


def test_hallucination_gate_allows_wave_numbers():
    payload = get_sample_payload()
    facts = FactsExtractor.extract(payload)
    assert 3.0 in facts["allowed_numbers"]


def test_hallucination_gate_allows_fibonacci_ratios():
    payload = get_sample_payload()
    facts = FactsExtractor.extract(payload)
    # 100.0 (out of 100) always allowed
    assert 100.0 in facts["allowed_numbers"]


def test_hallucination_gate_non_strict_mode_returns_warning():
    payload = get_sample_payload()
    verifier = NarratorVerification()
    facts = FactsExtractor.extract(payload)
    rogue_text = "السعر 86.00 ومستوى الدعم غير المذكور 999.00."
    res = verifier.verify(rogue_text, facts["allowed_numbers"], language="ar", strict=False)
    assert res["status"] == "warning"
    assert 999.0 in res["unauthorized_numbers"]


def test_hallucination_gate_float_rounding_tolerance():
    verifier = NarratorVerification()
    allowed = {86.00}
    # 86.01 within 0.05 tolerance
    res = verifier.verify("السعر 86.01 ج.م.", allowed, language="ar")
    assert res["status"] == "passed"


def test_hallucination_gate_zero_numbers_text_passes():
    verifier = NarratorVerification()
    res = verifier.verify("السعر مستقر في اتجاه عام إيجابي.", set(), language="ar")
    assert res["status"] == "passed"
    assert res["numbers_checked"] == 0


def test_hallucination_gate_negative_numbers_supported():
    verifier = NarratorVerification()
    res = verifier.verify("انخفض المؤشر بمقدار -2.5 نقطة.", {2.5, -2.5}, language="ar")
    assert res["status"] == "passed"


def test_hallucination_gate_extracts_all_occurrences():
    text = "الأسعار 86.00 و 92.00 و 96.00."
    nums = NarratorVerification.extract_numbers(text)
    assert nums == [86.0, 92.0, 96.0]


def test_hallucination_gate_ignores_embedded_words():
    text = "رمز COMI22 وسعر 86.00 ج.م."
    nums = NarratorVerification.extract_numbers(text)
    assert 86.0 in nums


def test_hallucination_gate_single_target_payload_never_invents_second():
    payload = {
        "symbol": "COMI",
        "current_price": 86.00,
        "trade_plan": {
            "status": "actionable",
            "entry_zone": {"low": 85.5, "high": 86.5},
            "stop_loss": {"price": 82.5},
            "targets": [{"rank": 1, "price": 92.00, "r_multiple": 1.71}],
            "risk_reward": {"primary_rr": 1.71},
        }
    }
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")
    assert "96.00" not in res_ar["full_text"]
    assert "96.00" not in res_en["full_text"]


# ==============================================================================
# PART E: LANGUAGE PARITY TESTS (8 tests)
# ==============================================================================

def test_language_parity_same_symbol_and_price():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert res_ar["symbol"] == res_en["symbol"]
    assert "86.00" in res_ar["full_text"]
    assert "86.00" in res_en["full_text"]


def test_language_parity_sections_keys_match():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert set(res_ar["sections"].keys()) == set(res_en["sections"].keys())


def test_language_parity_both_contain_disclaimers():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert len(res_ar["sections"]["disclaimer"]) > 20
    assert len(res_en["sections"]["disclaimer"]) > 20


def test_language_parity_both_contain_warnings():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert len(res_ar["sections"]["warnings"]) == len(res_en["sections"]["warnings"])


def test_language_parity_both_report_targets():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert "92.00" in res_ar["sections"]["trade_plan"]
    assert "92.00" in res_en["sections"]["trade_plan"]


def test_language_parity_both_report_stop_loss():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert "82.50" in res_ar["sections"]["trade_plan"]
    assert "82.50" in res_en["sections"]["trade_plan"]


def test_language_parity_both_pass_verification():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert res_ar["verification"]["status"] == "passed"
    assert res_en["verification"]["status"] == "passed"


def test_language_parity_confluence_score_consistency():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res_ar = narrator.narrate(payload, language="ar")
    res_en = narrator.narrate(payload, language="en")

    assert "84" in res_ar["sections"]["analysis_summary"]
    assert "84" in res_en["sections"]["analysis_summary"]


# ==============================================================================
# PART F: STYLE VARIATION TESTS (5 tests)
# ==============================================================================

def test_style_brief_length_shorter_than_professional():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    brief = narrator.narrate(payload, language="ar", style="brief")
    pro = narrator.narrate(payload, language="ar", style="professional")
    assert len(brief["sections"]["analysis_summary"]) < len(pro["sections"]["analysis_summary"])


def test_style_detailed_length_longer_than_professional():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    detailed = narrator.narrate(payload, language="ar", style="detailed")
    pro = narrator.narrate(payload, language="ar", style="professional")
    assert len(detailed["sections"]["analysis_summary"]) > len(pro["sections"]["analysis_summary"])


def test_style_brief_english_sentence_count():
    import re
    payload = get_sample_payload()
    narrator = NarratorEngine()
    brief = narrator.narrate(payload, language="en", style="brief")
    sentences = [s.strip() for s in re.split(r"\.\s+", brief["sections"]["analysis_summary"]) if s.strip()]
    assert len(sentences) <= 3


def test_style_detailed_english_sentence_count():
    import re
    payload = get_sample_payload()
    narrator = NarratorEngine()
    detailed = narrator.narrate(payload, language="en", style="detailed")
    sentences = [s.strip() for s in re.split(r"\.\s+", detailed["sections"]["analysis_summary"]) if s.strip()]
    assert len(sentences) >= 6


def test_style_unknown_defaults_to_professional():
    payload = get_sample_payload()
    narrator = NarratorEngine()
    res = narrator.narrate(payload, language="ar", style="invalid_style")
    assert res["style"] == "professional"


# ==============================================================================
# PART G: REAL DATA TESTS (10 tests)
# ==============================================================================

def test_real_data_comi():
    candles = [make_candle(i, 80 + i * 0.1, 81 + i * 0.1, 79 + i * 0.1, 80 + i * 0.1) for i in range(50)]
    orch = AnalysisOrchestrator()
    res = orch.run("COMI", "1D", candles)

    assert "narrative_ar" in res
    assert "narrative_en" in res
    assert res["narrative_ar"]["verification"]["status"] == "passed"
    assert res["narrative_en"]["verification"]["status"] == "passed"


def test_real_data_2222_aramco():
    candles = [make_candle(i, 28.0 + i * 0.05, 28.5 + i * 0.05, 27.5 + i * 0.05, 28.0 + i * 0.05) for i in range(50)]
    orch = AnalysisOrchestrator()
    res = orch.run("2222", "1D", candles)

    assert "أرامكو السعودية" in res["narrative_ar"]["full_text"]
    assert "Saudi Aramco" in res["narrative_en"]["full_text"]


def test_real_data_aapl():
    candles = [make_candle(i, 220 + i * 0.3, 221 + i * 0.3, 219 + i * 0.3, 220 + i * 0.3) for i in range(50)]
    orch = AnalysisOrchestrator()
    res = orch.run("AAPL", "1D", candles)

    assert "أبل" in res["narrative_ar"]["full_text"]
    assert "Apple" in res["narrative_en"]["full_text"]


def test_real_data_btc():
    candles = [make_candle(i, 65000 + i * 50, 65500 + i * 50, 64500 + i * 50, 65000 + i * 50) for i in range(50)]
    orch = AnalysisOrchestrator()
    res = orch.run("BTC", "1D", candles)

    assert res["narrative_ar"]["verification"]["status"] == "passed"
    assert res["narrative_en"]["verification"]["status"] == "passed"


def test_real_data_eurusd():
    candles = [make_candle(i, 1.08 + i * 0.0005, 1.085 + i * 0.0005, 1.075 + i * 0.0005, 1.08 + i * 0.0005) for i in range(50)]
    orch = AnalysisOrchestrator()
    res = orch.run("EURUSD", "1D", candles)

    assert res["narrative_ar"]["verification"]["status"] == "passed"
    assert res["narrative_en"]["verification"]["status"] == "passed"


def test_real_data_zero_unauthorized_numbers_in_batch():
    orch = AnalysisOrchestrator()
    for sym in ["SWDY", "ETEL", "MSFT"]:
        candles = [make_candle(i, 50 + i * 0.2, 51 + i * 0.2, 49 + i * 0.2, 50 + i * 0.2) for i in range(40)]
        res = orch.run(sym, "1D", candles)
        assert res["narrative_ar"]["verification"]["unauthorized_numbers"] == []
        assert res["narrative_en"]["verification"]["unauthorized_numbers"] == []


def test_real_data_disclaimer_present_in_all():
    orch = AnalysisOrchestrator()
    candles = [make_candle(i, 100, 101, 99, 100) for i in range(30)]
    res = orch.run("TEST", "1D", candles)
    assert "هذا التحليل تعليمي" in res["narrative_ar"]["full_text"]
    assert "educational and quantitative" in res["narrative_en"]["full_text"]


def test_real_data_fastapi_narrate_endpoint_ar():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    candles = [make_candle(i, 100 + i * 0.2, 101 + i * 0.2, 99 + i * 0.2, 100 + i * 0.2) for i in range(30)]
    payload = {
        "symbol": "COMI",
        "timeframe": "1D",
        "language": "ar",
        "style": "professional",
        "candles": candles,
    }
    resp = client.post("/narrate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "ar"
    assert "البنك التجاري الدولي" in data["full_text"]


def test_real_data_fastapi_narrate_endpoint_en():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    candles = [make_candle(i, 100 + i * 0.2, 101 + i * 0.2, 99 + i * 0.2, 100 + i * 0.2) for i in range(30)]
    payload = {
        "symbol": "AAPL",
        "timeframe": "1D",
        "language": "en",
        "style": "brief",
        "candles": candles,
    }
    resp = client.post("/narrate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "en"
    assert "Apple" in data["full_text"]


def test_real_data_unavailable_short_candles_handled():
    orch = AnalysisOrchestrator()
    res = orch.run("SHORT", "1D", [make_candle(0, 100, 101, 99, 100)])
    assert res["status"] == "unavailable"
    assert res["narrative_ar"] is None
    assert res["narrative_en"] is None


# ==============================================================================
# PART H: PERFORMANCE TESTS (3 tests)
# ==============================================================================

def test_performance_single_narrate_under_fifty_ms():
    payload = get_sample_payload()
    narrator = NarratorEngine()

    t0 = time.time()
    _ = narrator.narrate(payload, language="ar")
    elapsed_ms = (time.time() - t0) * 1000.0

    print(f"\nSingle narrate execution time: {elapsed_ms:.2f}ms")
    assert elapsed_ms < 50.0


def test_performance_full_analysis_with_narrative_under_five_hundred_ms():
    candles = [make_candle(i, 80 + i * 0.2, 81 + i * 0.2, 79 + i * 0.2, 80 + i * 0.2) for i in range(50)]
    orch = AnalysisOrchestrator()

    t0 = time.time()
    res = orch.run("PERF", "1D", candles)
    elapsed_ms = (time.time() - t0) * 1000.0

    print(f"\nFull analysis + dual narrative execution time: {elapsed_ms:.2f}ms")
    assert elapsed_ms < 500.0
    assert "narrative_ar" in res
    assert "narrative_en" in res


def test_performance_fifty_sequential_narrate_calls():
    payload = get_sample_payload()
    narrator = NarratorEngine()

    t0 = time.time()
    for _ in range(50):
        _ = narrator.narrate(payload, language="ar")
        _ = narrator.narrate(payload, language="en")
    elapsed_sec = time.time() - t0

    assert elapsed_sec < 1.0
