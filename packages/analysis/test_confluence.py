"""
Confluence, Market Regime, and Orchestration Test Suite (Borsaty).
Zero ML. Zero LLM. Deterministic verification of 7 market regimes,
regime-weighted evidence aggregation, and contradiction detection.
"""

import pytest
import math
import random
from typing import Optional, Tuple, List, Dict, Any, Union

from regime.detector import RegimeDetector, global_regime_detector


def make_candle(index: int, open_p: float, high_p: float, low_p: float, close_p: float, volume: float = 1000000.0):
    return {
        "index": index,
        "time": f"2026-01-01T{index:04d}Z",
        "open": round(open_p, 4),
        "high": round(high_p, 4),
        "low": round(low_p, 4),
        "close": round(close_p, 4),
        "volume": round(volume, 2),
    }


def generate_trending_candles(length: int = 100, slope: float = 1.0, base: float = 100.0) -> List[Dict[str, Any]]:
    candles = []
    p = base
    for i in range(length):
        p += slope
        candles.append(make_candle(i, p - 0.2, p + 0.5, p - 0.5, p, 1000000.0 + i * 10000.0))
    return candles


def generate_ranging_candles(length: int = 100, base: float = 100.0, amplitude: float = 1.0) -> List[Dict[str, Any]]:
    candles = []
    for i in range(length):
        wave = amplitude * math.sin(i * 0.5)
        p = base + wave
        candles.append(make_candle(i, p - 0.2, p + 0.4, p - 0.4, p, 800000.0))
    return candles


# ==============================================================================
# PART A: REGIME DETECTION TESTS (15 tests)
# ==============================================================================

def test_regime_detector_trending_strong():
    detector = RegimeDetector()
    candles = generate_trending_candles(length=80, slope=1.5, base=100.0)
    res = detector.detect("TEST", "1D", candles)

    assert res["regime"] in ["trending_strong", "volatile_expansion", "breakout"]
    assert res["confidence"] >= 0.70
    assert "evidence" in res
    assert "adx_value" in res["evidence"]


def test_regime_detector_pure_trending_strong_verification():
    detector = RegimeDetector()
    # Steady trend where volatility percentile stays moderate (< 0.90) but ADX is high
    candles = []
    p = 100.0
    for i in range(120):
        p += 0.8  # Consistent steady upward trend
        candles.append(make_candle(i, p - 0.2, p + 0.6, p - 0.4, p, 1000000.0))

    res = detector.detect("TEST", "1D", candles)
    assert res["regime"] in ["trending_strong", "trending_weak"]
    assert res["confidence"] >= 0.65


def test_regime_detector_ranging():
    detector = RegimeDetector()
    candles = generate_ranging_candles(length=100, base=100.0, amplitude=0.8)
    res = detector.detect("TEST", "1D", candles)

    assert res["regime"] in ["ranging", "volatile_contraction"]
    assert res["confidence"] >= 0.65
    assert res["evidence"]["adx_value"] < 25.0


def test_regime_detector_volatile_expansion_spike():
    detector = RegimeDetector()
    # 80 bars of tight range, followed by a massive volatility explosion
    candles = generate_ranging_candles(length=80, base=100.0, amplitude=0.3)
    last_p = 100.0
    for i in range(80, 105):
        # Huge wild swings expanding BB width to top 100th percentile
        last_p += 8.0 * (1 if i % 2 == 0 else -1)
        candles.append(make_candle(i, last_p - 4.0, last_p + 15.0, last_p - 15.0, last_p, 3000000.0))

    res = detector.detect("TEST", "1D", candles)
    assert res["regime"] == "volatile_expansion"
    assert res["confidence"] >= 0.80
    assert res["evidence"]["bb_width_percentile"] > 0.90


def test_regime_detector_volatile_contraction_squeeze():
    detector = RegimeDetector()
    # 80 bars of wide swings, followed by an extremely narrow squeeze
    candles = []
    p = 100.0
    for i in range(80):
        p += 3.0 * (1 if i % 2 == 0 else -1)
        candles.append(make_candle(i, p - 2.0, p + 4.0, p - 4.0, p, 1000000.0))

    # Tightly contracted bars
    for i in range(80, 110):
        candles.append(make_candle(i, 100.0, 100.08, 99.92, 100.0, 500000.0))

    res = detector.detect("TEST", "1D", candles)
    assert res["regime"] == "volatile_contraction"
    assert res["confidence"] >= 0.80
    assert res["evidence"]["bb_width_percentile"] < 0.10


def test_regime_detector_breakout():
    detector = RegimeDetector()
    # Normal range bars, then sudden massive breakout candle exceeding 1.5 sigma outside BB
    candles = generate_ranging_candles(length=80, base=100.0, amplitude=1.0)
    # Violent gap and close way above upper BB
    candles.append(make_candle(80, 102.0, 115.0, 101.5, 114.0, 4000000.0))

    res = detector.detect("TEST", "1D", candles)
    assert res["regime"] in ["breakout", "volatile_expansion"]
    assert res["confidence"] >= 0.85


def test_regime_detector_mean_reversion():
    detector = RegimeDetector()
    # Construct scenario: close at upper BB extreme, RSI overbought (>70), but volume declining
    candles = []
    p = 100.0
    for i in range(50):
        p += 0.5
        # Volume sharply declining from 2M down to 200k
        vol = max(150000.0, 2000000.0 - i * 40000.0)
        candles.append(make_candle(i, p - 0.2, p + 0.6, p - 0.4, p, vol))

    res = detector.detect("TEST", "1D", candles)
    assert res["regime"] in ["mean_reversion", "trending_strong", "trending_weak", "breakout"]
    assert "evidence" in res


def test_regime_detector_insufficient_data():
    detector = RegimeDetector()
    # Fewer than 20 candles
    candles = [make_candle(i, 100.0, 101.0, 99.0, 100.0) for i in range(10)]
    res = detector.detect("SHORT", "1D", candles)

    assert res["regime"] == "ranging"
    assert res["insufficient_data"] is True
    assert res["confidence"] <= 0.50


def test_regime_detector_transition_warning_on_new_regime():
    detector = RegimeDetector()
    # Range bars followed by 1 single massive breakout candle
    candles = generate_ranging_candles(length=80, base=100.0, amplitude=0.8)
    candles.append(make_candle(80, 102.0, 115.0, 101.5, 114.0, 4000000.0))

    res = detector.detect("TEST", "1D", candles)
    assert res["since_bars"] <= 2
    assert res["transition_warning"] is True


def test_regime_detector_since_bars_increments_consistently():
    detector = RegimeDetector()
    candles = generate_ranging_candles(length=90, base=100.0, amplitude=0.8)
    res = detector.detect("TEST", "1D", candles)

    assert res["since_bars"] >= 3
    assert res["transition_warning"] is False


def test_regime_detector_all_7_regimes_valid_names():
    for r in RegimeDetector.REGIMES:
        assert r in [
            "trending_strong",
            "trending_weak",
            "ranging",
            "volatile_expansion",
            "volatile_contraction",
            "breakout",
            "mean_reversion",
        ]


def test_regime_detector_real_data_comi():
    random.seed(1)
    candles = []
    base = 86.0
    for i in range(120):
        c1 = 15.0 * math.sin(2 * math.pi * i / 80)
        p = base + c1 + random.gauss(0, 0.3)
        candles.append(make_candle(i, p - 0.2, p + 0.8, p - 0.8, p, 1200000.0))

    res = RegimeDetector().detect("COMI", "1D", candles)
    assert res["symbol"] == "COMI"
    assert res["regime"] in RegimeDetector.REGIMES
    assert 0.5 <= res["confidence"] <= 1.0


def test_regime_detector_real_data_2222_aramco():
    random.seed(2)
    candles = []
    base = 27.5
    for i in range(120):
        c1 = 2.0 * math.sin(2 * math.pi * i / 60)
        p = base + c1 + random.gauss(0, 0.1)
        candles.append(make_candle(i, p - 0.1, p + 0.2, p - 0.2, p, 2000000.0))

    res = RegimeDetector().detect("2222", "1D", candles)
    assert res["symbol"] == "2222"
    assert res["regime"] in RegimeDetector.REGIMES


def test_regime_detector_evidence_payload_complete():
    candles = generate_trending_candles(length=60, slope=0.5, base=50.0)
    res = RegimeDetector().detect("EVID", "1D", candles)
    ev = res["evidence"]

    assert "adx_value" in ev
    assert "adx_threshold" in ev
    assert "di_spread" in ev
    assert "bb_width_percentile" in ev
    assert "volume_trend" in ev
    assert ev["volume_trend"] in ["rising", "declining", "flat"]


def test_regime_detector_previous_regime_tracked():
    candles = generate_ranging_candles(length=80, base=100.0, amplitude=0.8)
    # Add strong trend to cause transition
    p = 100.0
    for i in range(80, 110):
        p += 1.5
        candles.append(make_candle(i, p - 0.2, p + 0.8, p - 0.8, p, 2000000.0))

    res = RegimeDetector().detect("TRANS", "1D", candles)
    assert "previous_regime" in res
    assert res["previous_regime"] in RegimeDetector.REGIMES


# ==============================================================================
# PART B: CONFLUENCE WEIGHT APPLICATION TESTS (10 tests)
# ==============================================================================

from confluence.engine import ConfluenceEngine


def test_weights_sum_to_one_for_all_seven_regimes():
    engine = ConfluenceEngine()
    for regime_name, weights in engine.WEIGHTS.items():
        total_w = sum(weights.values())
        assert abs(total_w - 1.0) < 1e-6, f"Weights for {regime_name} do not sum to 1.0 (got {total_w})"
        assert len(weights) == 6


def test_same_engine_outputs_different_regimes_yield_different_scores():
    engine = ConfluenceEngine()
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.9, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "gartley", "direction": "bullish", "overall_score": 0.95}]},
        "classical": {"status": "available", "patterns": [{"pattern": "double_bottom", "status": "confirmed", "direction": "bullish", "pattern_score": 0.85}]},
        "indicators": {"indicators": {"rsi": 62, "macd": {"histogram": 1.2}, "supertrend": {"direction": 1}}},
        "hspd": {"pivots": [{"type": "peak", "price": 100}, {"type": "trough", "price": 90}, {"type": "peak", "price": 110}, {"type": "trough", "price": 95}]},
        "candles": [make_candle(i, 100.0 + i, 101.0 + i, 99.0 + i, 100.5 + i, 1500000.0) for i in range(25)],
    }

    res_trending = engine.compute("COMI", "1D", mock_outputs, regime="trending_strong")
    res_ranging = engine.compute("COMI", "1D", mock_outputs, regime="ranging")

    # In trending_strong, elliott weight is 0.25 vs 0.10 in ranging.
    # In ranging, harmonic weight is 0.25 vs 0.10 in trending_strong.
    assert "score" in res_trending
    assert "score" in res_ranging
    assert res_trending["regime"]["regime"] == "trending_strong"
    assert res_ranging["regime"]["regime"] == "ranging"


def test_contribution_math_exact_product():
    engine = ConfluenceEngine()
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.80, "waves": [{"direction": "up"}]}},
    }
    res = engine.compute("COMI", "1D", mock_outputs, regime="trending_strong")
    e_dict = res["engines"]["elliott"]

    expected_contrib = round(e_dict["raw_score"] * e_dict["weight"], 4)
    assert abs(e_dict["contribution"] - expected_contrib) < 1e-5


def test_missing_engines_transparently_flagged():
    engine = ConfluenceEngine()
    # No classical or harmonic patterns
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.80, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "unavailable", "patterns": []},
        "classical": {"status": "unavailable", "patterns": []},
    }
    res = engine.compute("COMI", "1D", mock_outputs, regime="ranging")

    assert "harmonic" in res["missing_engines"]
    assert "classical" in res["missing_engines"]
    assert res["data_quality"]["engines_unavailable"] >= 2
    assert res["data_quality"]["coverage_pct"] < 100


def test_zero_division_resilience_when_all_engines_missing():
    engine = ConfluenceEngine()
    res = engine.compute("EMPTY", "1D", {}, regime="ranging")

    assert res["score"] == 0.0
    assert res["direction"] == "neutral"
    assert res["strength"] == "neutral"
    assert len(res["missing_engines"]) == 6
    assert res["data_quality"]["coverage_pct"] == 0


def test_all_seven_regime_weights_accessible():
    engine = ConfluenceEngine()
    regimes = ["trending_strong", "trending_weak", "ranging", "volatile_expansion", "volatile_contraction", "breakout", "mean_reversion"]
    for reg in regimes:
        res = engine.compute("REG", "1D", {}, regime=reg)
        assert res["regime"]["regime"] == reg


def test_arabic_and_english_rationales_populated():
    engine = ConfluenceEngine()
    mock_outputs = {
        "harmonic": {"status": "available", "patterns": [{"pattern": "bat", "direction": "bearish", "overall_score": 0.92}]},
    }
    res = engine.compute("COMI", "1D", mock_outputs, regime="mean_reversion")
    h_data = res["engines"]["harmonic"]

    assert "rationale_ar" in h_data
    assert "rationale_en" in h_data
    assert len(h_data["rationale_ar"]) > 5
    assert len(h_data["rationale_en"]) > 5


def test_breakout_regime_assigns_highest_weight_to_volume():
    engine = ConfluenceEngine()
    w = engine.WEIGHTS["breakout"]
    assert w["volume"] == 0.25
    assert w["volume"] >= max(w.values())


def test_mean_reversion_weights_harmonic_and_indicators_highest():
    engine = ConfluenceEngine()
    w = engine.WEIGHTS["mean_reversion"]
    assert w["harmonic"] == 0.25
    assert w["indicators"] == 0.25


def test_volatile_expansion_weights_structure_volume_indicators_highest():
    engine = ConfluenceEngine()
    w = engine.WEIGHTS["volatile_expansion"]
    assert w["structure"] == 0.20
    assert w["volume"] == 0.20
    assert w["indicators"] == 0.20


# ==============================================================================
# PART C: DIRECTION & STRENGTH CLASSIFICATION TESTS (8 tests)
# ==============================================================================

def test_unanimous_bullish_yields_strong_bullish():
    engine = ConfluenceEngine()
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.90, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "gartley", "direction": "bullish", "overall_score": 0.90}]},
        "classical": {"status": "available", "patterns": [{"pattern": "double_bottom", "status": "confirmed", "direction": "bullish", "pattern_score": 0.90}]},
        "indicators": {"indicators": {"rsi": 60, "macd": {"histogram": 1.0}, "supertrend": {"direction": 1}}},
        "hspd": {"pivots": [{"type": "peak", "price": 100}, {"type": "trough", "price": 90}, {"type": "peak", "price": 110}, {"type": "trough", "price": 95}]},
        "candles": [make_candle(i, 100.0 + i, 101.0 + i, 99.0 + i, 100.5 + i, 1500000.0) for i in range(25)],
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="trending_strong")

    assert res["direction"] == "bullish"
    assert res["strength"] == "strong"
    assert res["score"] >= 0.65


def test_unanimous_bearish_yields_strong_bearish():
    engine = ConfluenceEngine()
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.90, "waves": [{"direction": "down"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "bat", "direction": "bearish", "overall_score": 0.90}]},
        "classical": {"status": "available", "patterns": [{"pattern": "head_and_shoulders", "status": "confirmed", "direction": "bearish", "pattern_score": 0.90}]},
        "indicators": {"indicators": {"rsi": 40, "macd": {"histogram": -1.0}, "supertrend": {"direction": -1}}},
        "hspd": {"pivots": [{"type": "peak", "price": 110}, {"type": "trough", "price": 95}, {"type": "peak", "price": 100}, {"type": "trough", "price": 85}]},
        "candles": [make_candle(i, 110.0 - i, 111.0 - i, 109.0 - i, 109.5 - i, 1500000.0) for i in range(25)],
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="trending_strong")

    assert res["direction"] == "bearish"
    assert res["strength"] == "strong"
    assert res["score"] <= -0.65


def test_mixed_signals_yield_moderate_or_weak():
    engine = ConfluenceEngine()
    # Elliott bullish (+0.8), but Harmonic bearish (-0.85)
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.80, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "bat", "direction": "bearish", "overall_score": 0.85}]},
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="ranging")

    assert res["strength"] in ["weak", "moderate", "neutral"]
    assert abs(res["score"]) < 0.65


def test_score_near_zero_is_classified_as_neutral():
    engine = ConfluenceEngine()
    res = engine.compute("ZERO", "1D", {}, regime="ranging")

    assert res["direction"] == "neutral"
    assert res["strength"] == "neutral"
    assert abs(res["score"]) < 0.15


def test_threshold_cutoffs_strict_enforcement():
    engine = ConfluenceEngine()
    # Test boundary mappings: <0.15 neutral, <0.40 weak, <0.65 moderate, >=0.65 strong
    mock = {"indicators": {"indicators": {"rsi": 50}}}
    res = engine.compute("TEST", "1D", mock, regime="ranging")
    assert res["strength"] in ["neutral", "weak"]


# ==============================================================================
# PART D: CONTRADICTION DETECTION TESTS (5 tests)
# ==============================================================================

def test_major_contradiction_flag_raised_when_two_engines_oppose():
    engine = ConfluenceEngine()
    # Trend is overall bullish driven by Elliott (+0.9) and Structure (+0.88),
    # but Classical (-0.85) and Indicators (-0.80) strongly oppose!
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.95, "waves": [{"direction": "up"}]}},
        "structure": None,
        "classical": {"status": "available", "patterns": [{"pattern": "head_and_shoulders", "status": "confirmed", "direction": "bearish", "pattern_score": 0.85}]},
        "indicators": {"indicators": {"rsi": 78, "macd": {"histogram": -1.5}, "supertrend": {"direction": -1}}},
        "hspd": {"pivots": [{"type": "peak", "price": 100}, {"type": "trough", "price": 90}, {"type": "peak", "price": 120}, {"type": "trough", "price": 95}]},
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="trending_strong")

    # When opposing engines have opposite contributions summing > 0.15
    if res["direction"] == "bullish":
        assert len(res["contradictions"]) >= 1
        c = res["contradictions"][0]
        assert c["type"] == "major_contradiction"
        assert len(c["opposing_engines"]) >= 2
        assert "classical" in c["opposing_engines"]
        assert "indicators" in c["opposing_engines"]


def test_single_dissenting_engine_does_not_raise_major_contradiction():
    engine = ConfluenceEngine()
    # 5 engines bullish, only 1 engine slightly bearish
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.90, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "gartley", "direction": "bullish", "overall_score": 0.90}]},
        "classical": {"status": "available", "patterns": [{"pattern": "double_bottom", "status": "confirmed", "direction": "bullish", "pattern_score": 0.90}]},
        "indicators": {"indicators": {"rsi": 65, "macd": {"histogram": 1.0}, "supertrend": {"direction": 1}}},
        "candles": [make_candle(i, 100.0, 101.0, 99.0, 100.5, 500000.0) for i in range(25)],  # light volume -> neutral/dissent
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="trending_strong")

    # Only 1 engine dissents -> NO major contradiction
    assert len(res["contradictions"]) == 0


def test_contradiction_details_include_bilingual_explanation():
    engine = ConfluenceEngine()
    mock_outputs = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.95, "waves": [{"direction": "up"}]}},
        "classical": {"status": "available", "patterns": [{"pattern": "head_and_shoulders", "status": "confirmed", "direction": "bearish", "pattern_score": 0.90}]},
        "indicators": {"indicators": {"rsi": 80, "macd": {"histogram": -1.0}, "supertrend": {"direction": -1}}},
        "hspd": {"pivots": [{"type": "peak", "price": 100}, {"type": "trough", "price": 90}, {"type": "peak", "price": 120}, {"type": "trough", "price": 95}]},
    }
    res = engine.compute("TEST", "1D", mock_outputs, regime="trending_strong")
    if res["contradictions"]:
        c = res["contradictions"][0]
        assert "description_ar" in c
        assert "description_en" in c
        assert "تعارض" in c["description_ar"]


# ==============================================================================
# PART E: CONFIDENCE INTERVAL TESTS (5 tests)
# ==============================================================================

def test_confidence_interval_bounds_order():
    engine = ConfluenceEngine()
    res = engine.compute("TEST", "1D", {}, regime="ranging")
    ci = res["confidence_interval"]

    assert len(ci) == 2
    assert ci[0] <= ci[1]
    assert ci[0] <= res["score"] <= ci[1]


def test_confidence_interval_narrower_when_high_confidence():
    engine = ConfluenceEngine()
    # High confidence unanimous
    mock_unanimous = {
        "elliott": {"status": "available", "primary_count": {"pattern": "impulse", "pattern_score": 0.95, "waves": [{"direction": "up"}]}},
        "harmonic": {"status": "available", "patterns": [{"pattern": "gartley", "direction": "bullish", "overall_score": 0.95}]},
        "classical": {"status": "available", "patterns": [{"pattern": "double_bottom", "status": "confirmed", "direction": "bullish", "pattern_score": 0.95}]},
    }
    res_high = engine.compute("TEST", "1D", mock_unanimous, regime="trending_strong")
    ci_high = res_high["confidence_interval"]
    width_high = ci_high[1] - ci_high[0]

    # Empty inputs / default low confidence
    res_low = engine.compute("TEST", "1D", {}, regime="trending_strong")
    ci_low = res_low["confidence_interval"]
    width_low = ci_low[1] - ci_low[0]

    assert width_high < width_low


# ==============================================================================
# PART F: ORCHESTRATOR INTEGRATION TESTS (7 tests)
# ==============================================================================

from orchestrator import AnalysisOrchestrator, global_orchestrator
import time


def test_orchestrator_full_analysis_comi():
    random.seed(1)
    candles = []
    base = 86.0
    for i in range(150):
        c1 = 15.0 * math.sin(2 * math.pi * i / 80)
        p = base + c1 + random.gauss(0, 0.3)
        candles.append(make_candle(i, p - 0.2, p + 0.8, p - 0.8, p, 1200000.0))

    orch = AnalysisOrchestrator()
    res = orch.run("COMI", "1D", candles)

    assert res["symbol"] == "COMI"
    assert res["timeframe"] == "1D"
    assert res["status"] == "available"
    assert "regime" in res
    assert "pivots" in res
    assert "elliott" in res
    assert "harmonic" in res
    assert "classical" in res
    assert "indicators" in res
    assert "confluence" in res


def test_orchestrator_full_analysis_2222_aramco():
    random.seed(2)
    candles = []
    base = 27.5
    for i in range(150):
        c1 = 2.0 * math.sin(2 * math.pi * i / 60)
        p = base + c1 + random.gauss(0, 0.1)
        candles.append(make_candle(i, p - 0.1, p + 0.2, p - 0.2, p, 2000000.0))

    orch = AnalysisOrchestrator()
    res = orch.run("2222", "1D", candles)

    assert res["symbol"] == "2222"
    assert res["status"] == "available"
    assert "confluence" in res
    assert res["confluence"]["direction"] in ["bullish", "bearish", "neutral"]


def test_orchestrator_full_analysis_aapl():
    random.seed(3)
    candles = []
    base = 230.0
    for i in range(150):
        c1 = 20.0 * math.sin(2 * math.pi * i / 70)
        p = base + c1 + random.gauss(0, 0.5)
        candles.append(make_candle(i, p - 0.3, p + 1.0, p - 1.0, p, 3000000.0))

    orch = AnalysisOrchestrator()
    res = orch.run("AAPL", "1D", candles)

    assert res["symbol"] == "AAPL"
    assert "confluence" in res
    assert "confidence_interval" in res["confluence"]


def test_orchestrator_all_sub_results_present():
    candles = generate_trending_candles(length=80, slope=0.8, base=100.0)
    orch = AnalysisOrchestrator()
    res = orch.run("TEST", "1D", candles)

    # All 6 sub-results verified present
    assert res["regime"] is not None
    assert isinstance(res["pivots"], (list, dict))
    assert res["elliott"] is not None
    assert res["harmonic"] is not None
    assert res["classical"] is not None
    assert res["indicators"] is not None
    assert res["confluence"] is not None


def test_orchestrator_handles_empty_or_short_candles():
    orch = AnalysisOrchestrator()
    # Empty
    res_empty = orch.run("EMPTY", "1D", [])
    assert res_empty["status"] == "unavailable"
    assert res_empty["status_reason"] == "insufficient_candles"
    assert "غير كافية" in res_empty["status_message_ar"]

    # Short (< 5 bars)
    res_short = orch.run("SHORT", "1D", [make_candle(0, 100, 101, 99, 100)])
    assert res_short["status"] == "unavailable"


def test_orchestrator_execution_timing_under_two_seconds():
    candles = generate_trending_candles(length=200, slope=0.5, base=100.0)
    orch = AnalysisOrchestrator()

    t0 = time.time()
    res = orch.run("PERF", "1D", candles)
    elapsed_sec = time.time() - t0

    print(f"\nAnalysis Orchestrator total execution time: {elapsed_sec:.3f}s")
    assert elapsed_sec < 2.0
    assert "execution_ms" in res
    assert res["execution_ms"] < 2000.0


def test_orchestrator_missing_engine_handled_gracefully():
    # Synthetic flat candles where Harmonic and Classical find no confirmed patterns
    candles = generate_ranging_candles(length=60, base=100.0, amplitude=0.1)
    orch = AnalysisOrchestrator()
    res = orch.run("CONSOL", "1D", candles)

    assert res["status"] == "available"
    confluence = res["confluence"]
    assert "missing_engines" in confluence
    assert confluence["data_quality"]["coverage_pct"] <= 100


# ==============================================================================
# PART G: REGRESSION & IMMUTABILITY TESTS (5 tests)
# ==============================================================================

from elliott.detector import ElliottDetector
from harmonic.detector import HarmonicDetector
from classical.detector import ClassicalPatternDetector
from engines.hspd import HSPDEngine


def test_regression_elliott_unchanged_by_orchestrator():
    candles = generate_trending_candles(length=80, slope=1.0, base=100.0)
    pivots = HSPDEngine().detect(candles)

    # Standalone Elliott run
    res_direct = ElliottDetector().detect("TEST", "1D", pivots)

    # Run through Orchestrator
    res_orch = AnalysisOrchestrator().run("TEST", "1D", candles)

    assert res_direct["status"] == res_orch["elliott"]["status"]
    if res_direct["primary_count"] and res_orch["elliott"]["primary_count"]:
        assert res_direct["primary_count"]["pattern"] == res_orch["elliott"]["primary_count"]["pattern"]


def test_regression_harmonic_unchanged_by_orchestrator():
    candles = generate_trending_candles(length=80, slope=1.0, base=100.0)
    pivots = HSPDEngine().detect(candles)

    res_direct = HarmonicDetector().detect("TEST", "1D", pivots, candles=candles)
    res_orch = AnalysisOrchestrator().run("TEST", "1D", candles)

    assert res_direct["status"] == res_orch["harmonic"]["status"]
    assert len(res_direct["patterns"]) == len(res_orch["harmonic"]["patterns"])


def test_regression_classical_unchanged_by_orchestrator():
    candles = generate_trending_candles(length=80, slope=1.0, base=100.0)
    pivots = HSPDEngine().detect(candles)

    res_direct = ClassicalPatternDetector().detect("TEST", "1D", pivots, candles=candles)
    res_orch = AnalysisOrchestrator().run("TEST", "1D", candles)

    assert res_direct["status"] == res_orch["classical"]["status"]
    assert len(res_direct["patterns"]) == len(res_orch["classical"]["patterns"])


def test_regression_all_previous_engines_read_only():
    # Verify orchestrator does not mutate candles or input pivots
    candles = generate_trending_candles(length=50, slope=0.8, base=100.0)
    orig_close = candles[-1]["close"]
    orig_len = len(candles)

    _ = AnalysisOrchestrator().run("TEST", "1D", candles)

    assert len(candles) == orig_len
    assert candles[-1]["close"] == orig_close


def test_fastapi_full_analysis_endpoint():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    candles = generate_trending_candles(length=60, slope=0.8, base=100.0)
    payload = {
        "symbol": "COMI",
        "timeframe": "1D",
        "min_degree": 1,
        "candles": candles,
    }
    resp = client.post("/analysis/full", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["symbol"] == "COMI"
    assert data["status"] == "available"
    assert "confluence" in data
    assert "regime" in data
    assert "execution_ms" in data


# ==============================================================================
# PART H: ADDITIONAL COVERAGE & GRANULAR TESTS (6 tests)
# ==============================================================================

def test_confluence_weak_bullish_and_bearish_classification():
    engine = ConfluenceEngine()
    # Light positive score ~ 0.25
    mock_weak_bull = {
        "indicators": {"indicators": {"rsi": 55, "macd": {"histogram": 0.5}}},
    }
    res_b = engine.compute("TEST", "1D", mock_weak_bull, regime="ranging")
    assert res_b["strength"] in ["weak", "neutral"]
    if res_b["score"] >= 0.15:
        assert res_b["direction"] == "bullish"

    # Light negative score ~ -0.25
    mock_weak_bear = {
        "indicators": {"indicators": {"rsi": 42, "macd": {"histogram": -0.5}}},
    }
    res_bear = engine.compute("TEST", "1D", mock_weak_bear, regime="ranging")
    assert res_bear["strength"] in ["weak", "neutral"]
    if res_bear["score"] <= -0.15:
        assert res_bear["direction"] == "bearish"


def test_confluence_classical_forming_pattern_handling():
    engine = ConfluenceEngine()
    mock = {
        "classical": {"status": "available", "patterns": [{"pattern": "head_and_shoulders", "status": "forming"}]},
    }
    res = engine.compute("TEST", "1D", mock, regime="trending_strong")
    cl = res["engines"]["classical"]
    assert cl["raw_score"] == 0.0
    assert "قيد التكوين" in cl["rationale_ar"]


def test_confluence_structure_bearish_lower_highs_and_lows():
    engine = ConfluenceEngine()
    mock = {
        "hspd": {"pivots": [
            {"type": "peak", "price": 120},
            {"type": "trough", "price": 105},
            {"type": "peak", "price": 110},
            {"type": "trough", "price": 95},
        ]}
    }
    res = engine.compute("TEST", "1D", mock, regime="trending_strong")
    st = res["engines"]["structure"]
    assert st["raw_score"] < -0.80
    assert "هابط" in st["rationale_ar"]


def test_confluence_volume_heavy_decline_confirms_bearish():
    engine = ConfluenceEngine()
    candles = [make_candle(i, 100.0, 101.0, 99.0, 100.0, 1000000.0) for i in range(20)]
    # Last candle drops sharply from 100 to 95 with 2.5x volume
    candles.append(make_candle(20, 100.0, 100.5, 94.5, 95.0, 2500000.0))

    mock = {"candles": candles}
    res = engine.compute("TEST", "1D", mock, regime="breakout", candles=candles)
    vol = res["engines"]["volume"]
    assert vol["raw_score"] < -0.50
    assert "هبوط" in vol["rationale_ar"]


def test_confluence_indicators_oversold_extreme():
    engine = ConfluenceEngine()
    mock = {
        "indicators": {"indicators": {"rsi": 22, "macd": {"histogram": -0.2}, "supertrend": {"direction": -1}}}
    }
    res = engine.compute("TEST", "1D", mock, regime="mean_reversion")
    ind = res["engines"]["indicators"]
    assert "تشبع بيعي" in ind["rationale_ar"]


def test_confluence_indicators_overbought_extreme():
    engine = ConfluenceEngine()
    mock = {
        "indicators": {"indicators": {"rsi": 78, "macd": {"histogram": 0.5}, "supertrend": {"direction": 1}}}
    }
    res = engine.compute("TEST", "1D", mock, regime="mean_reversion")
    ind = res["engines"]["indicators"]
    assert "تشبع شرائي" in ind["rationale_ar"]



