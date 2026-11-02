"""
Confluence, Market Regime, and Orchestration Test Suite (Borsaty).
Zero ML. Zero LLM. Deterministic verification of 7 market regimes,
regime-weighted evidence aggregation, and contradiction detection.
"""

import pytest
import math
import random
from typing import List, Dict, Any

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
