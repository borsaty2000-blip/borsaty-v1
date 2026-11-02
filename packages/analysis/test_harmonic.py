"""
Harmonic Patterns Rule-First Engine Test Suite.
Fibonacci-gated, deterministic verification. Zero tolerance for unverified ratios.
"""

import pytest
from harmonic.detector import HarmonicDetector
from harmonic.structures import HARMONIC_PATTERNS, score_ratio, geometric_mean
from harmonic.prz import PrzCalculator


def make_pivot(index: int, price: float, p_type: str, degree: int = 1, timestamp: str = "2026-01-01T00:00:00Z") -> dict:
    return {
        "index": index,
        "price": round(price, 4),
        "type": p_type,
        "degree": degree,
        "timestamp": timestamp,
        "stability_score": 1.0,
    }


# ==============================================================================
# PART A: GARTLEY HAND-CRAFTED PATTERN TESTS
# ==============================================================================

def test_perfect_bullish_gartley_detected_with_high_score():
    detector = HarmonicDetector()
    # X=100, A=110, B=103.82, C=107.66, D=102.14
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 103.82, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 102.14, "trough"),
    ]
    res = detector.detect("COMI", "1D", pivots, min_degree=1)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1

    pat = res["patterns"][0]
    assert pat["pattern"] == "gartley"
    assert pat["direction"] == "bullish"
    assert pat["type"] == "reversal"
    assert pat["overall_score"] >= 0.98

    # Verify exact ratios
    assert abs(pat["ratios_measured"]["B_vs_XA"] - 0.618) <= 0.01
    assert abs(pat["ratios_measured"]["C_vs_AB"] - 0.618) <= 0.01
    assert abs(pat["ratios_measured"]["D_vs_XA"] - 0.786) <= 0.01

    # PRZ verification
    prz = pat["prz"]
    assert "low" in prz and "high" in prz and "center" in prz
    assert prz["low"] <= prz["center"] <= prz["high"]

    # Invalidation verification
    inv = pat["invalidation"]
    assert inv["price"] < 102.14  # Invalidation below D for bullish
    assert "D_low" in inv["reason"]

    # Targets verification
    targets = pat["targets"]
    assert len(targets) == 3
    assert targets[0]["price"] > 102.14
    assert targets[1]["price"] > targets[0]["price"]
    assert targets[2]["price"] == 110.0  # Full retrace to A


def test_perfect_bearish_gartley_detected_with_high_score():
    detector = HarmonicDetector()
    # Inverted: X=110, A=100, B=106.18, C=102.34, D=107.86
    pivots = [
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 100.0, "trough"),
        make_pivot(30, 106.18, "peak"),
        make_pivot(40, 102.34, "trough"),
        make_pivot(50, 107.86, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots, min_degree=1)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1

    pat = res["patterns"][0]
    assert pat["pattern"] == "gartley"
    assert pat["direction"] == "bearish"
    assert pat["overall_score"] >= 0.98

    # Invalidation above D for bearish
    inv = pat["invalidation"]
    assert inv["price"] > 107.86
    assert "D_high" in inv["reason"]

    # Targets downwards towards A (100)
    targets = pat["targets"]
    assert targets[0]["price"] < 107.86
    assert targets[1]["price"] < targets[0]["price"]
    assert targets[2]["price"] == 100.0


def test_gartley_handcrafted_different_price_scales():
    detector = HarmonicDetector()
    # Base 500.0
    scale = 5.0
    pivots = [
        make_pivot(10, 100.0 * scale, "trough"),
        make_pivot(20, 110.0 * scale, "peak"),
        make_pivot(30, 103.82 * scale, "trough"),
        make_pivot(40, 107.66 * scale, "peak"),
        make_pivot(50, 102.14 * scale, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=1)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    assert res["patterns"][0]["pattern"] == "gartley"
    assert res["patterns"][0]["overall_score"] >= 0.98


# ==============================================================================
# PART B: TOLERANCE EDGE TESTS (GARTLEY)
# ==============================================================================

def test_gartley_d_at_ideal_gives_score_1_0():
    detector = HarmonicDetector()
    # D is exactly 0.786 of XA
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 103.82, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 102.14, "trough"),  # 110 - 7.86 = 102.14
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["patterns"][0]["ratios_scores"]["D_vs_XA"] == 1.0


def test_gartley_d_at_edge_of_tolerance_gives_score_0_5():
    detector = HarmonicDetector()
    # Ideal 0.786, tolerance 0.03. Edge is 0.786 + 0.03 = 0.816.
    # D price = 110 - (0.816 * 10) = 101.84
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 103.82, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 101.84, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert len(res["patterns"]) == 1
    assert res["patterns"][0]["ratios_scores"]["D_vs_XA"] == 0.5


def test_gartley_d_outside_tolerance_rejected():
    detector = HarmonicDetector()
    # D at 0.817 (0.031 away from 0.786) exceeds 0.03 tolerance
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 103.82, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 101.83, "trough"),  # 110 - 8.17 = 101.83 (0.817)
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "unavailable"
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "D_vs_XA" in res["rejected_candidates"][0]["reason"]
    assert "exceeds tolerance" in res["rejected_candidates"][0]["reason"]


def test_gartley_b_outside_tolerance_rejected():
    detector = HarmonicDetector()
    # B ideal 0.618, tol 0.05. Test B=0.50 (diff 0.118 > 0.05)
    # Price = 110 - 5.0 = 105.0
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.0, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 102.14, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "unavailable"
    assert len(res["patterns"]) == 0
    assert any("B_vs_XA" in r["reason"] for r in res["rejected_candidates"])


# ==============================================================================
# PART C: NEGATIVE AND UNAVAILABLE TESTS
# ==============================================================================

def test_insufficient_pivots_returns_unavailable():
    detector = HarmonicDetector()
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "unavailable"
    assert res["status_reason"] == "insufficient_pivots"
    assert "غير كافٍ" in res["status_message_ar"]
    assert len(res["patterns"]) == 0


def test_random_pivots_no_false_positive():
    detector = HarmonicDetector()
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 102.0, "peak"),
        make_pivot(30, 101.0, "trough"),
        make_pivot(40, 103.0, "peak"),
        make_pivot(50, 99.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "unavailable"
    assert len(res["patterns"]) == 0


# ==============================================================================
# PART D: PRZ TESTS
# ==============================================================================

def test_prz_cluster_within_two_atr():
    calc = PrzCalculator()
    points = {
        "X": {"price": 100.0},
        "A": {"price": 110.0},
        "B": {"price": 103.82},
        "C": {"price": 107.66},
        "D": {"price": 102.14},
    }
    prz, reason = calc.compute_prz(points, "gartley", is_bullish=True, atr=1.5)
    assert prz is not None
    assert reason == ""
    assert prz["low"] < prz["high"]
    width = prz["high"] - prz["low"]
    assert width <= 2.0 * 1.5


def test_prz_cluster_rejected_when_too_wide():
    calc = PrzCalculator()
    points = {
        "X": {"price": 100.0},
        "A": {"price": 110.0},
        "B": {"price": 103.82},
        "C": {"price": 107.66},
        "D": {"price": 102.14},
    }
    # Artificially tiny ATR of 0.05 makes projections wider than 2 * ATR
    prz, reason = calc.compute_prz(points, "gartley", is_bullish=True, atr=0.05)
    assert prz is None
    assert "exceeds 2 ATR" in reason


# ==============================================================================
# PART E: BAT PATTERN TESTS
# ==============================================================================

def test_perfect_bullish_bat_detected_with_high_score():
    detector = HarmonicDetector()
    # X=100, A=110, B=105.60 (0.44 XA), C=108.32 (0.618 AB), D=101.14 (0.886 XA)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.60, "trough"),
        make_pivot(40, 108.32, "peak"),
        make_pivot(50, 101.14, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "bat"
    assert pat["direction"] == "bullish"
    assert pat["overall_score"] >= 0.95
    assert abs(pat["ratios_measured"]["B_vs_XA"] - 0.44) <= 0.01
    assert abs(pat["ratios_measured"]["D_vs_XA"] - 0.886) <= 0.01


def test_perfect_bearish_bat_detected_with_high_score():
    detector = HarmonicDetector()
    # Inverted: X=110, A=100, B=104.40, C=101.68, D=108.86
    pivots = [
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 100.0, "trough"),
        make_pivot(30, 104.40, "peak"),
        make_pivot(40, 101.68, "trough"),
        make_pivot(50, 108.86, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "bat"
    assert pat["direction"] == "bearish"
    assert pat["overall_score"] >= 0.95


def test_bat_d_0_832_exceeds_tolerance_rejected_with_reason():
    # User Verification item 3: D=0.832 in Bat (tol 0.03) -> rejected with reason
    detector = HarmonicDetector()
    # X=100, A=110, B=105.60, C=108.32. D at 0.832 of XA = 110 - 8.32 = 101.68
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.60, "trough"),
        make_pivot(40, 108.32, "peak"),
        make_pivot(50, 101.68, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    bat_rejections = [r for r in res["rejected_candidates"] if r.get("closest_pattern") == "bat"]
    assert len(bat_rejections) >= 1
    rej = bat_rejections[0]
    assert "D_vs_XA" in rej["reason"]
    assert "0.832" in rej["reason"]
    assert "0.886" in rej["reason"]
    assert "exceeds tolerance" in rej["reason"]


def test_b_0_50_detected_as_bat_not_gartley():
    detector = HarmonicDetector()
    # B at 0.50 XA (105.0) falls within Bat's B range (0.382-0.50) but outside Gartley (0.618 +- 0.05)
    # D at 0.886 = 101.14
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.0, "trough"),
        make_pivot(40, 108.0, "peak"),
        make_pivot(50, 101.14, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert any(p["pattern"] == "bat" for p in res["patterns"])
    assert not any(p["pattern"] == "gartley" for p in res["patterns"])


# ==============================================================================
# PART F: BUTTERFLY PATTERN TESTS
# ==============================================================================

def test_perfect_bullish_butterfly_detected_with_high_score():
    detector = HarmonicDetector()
    # X=100, A=110, B=102.14 (0.786 XA), C=107.0, D=97.30 (1.27 XA extension beyond X)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 102.14, "trough"),
        make_pivot(40, 107.0, "peak"),
        make_pivot(50, 97.30, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "butterfly"
    assert pat["direction"] == "bullish"
    assert pat["points"]["D"]["price"] < pat["points"]["X"]["price"]  # D extends beyond X
    assert pat["overall_score"] >= 0.95


def test_perfect_bearish_butterfly_detected_with_high_score():
    detector = HarmonicDetector()
    # Inverted: X=110, A=100, B=107.86, C=103.0, D=112.70 (1.27 XA extension beyond X)
    pivots = [
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 100.0, "trough"),
        make_pivot(30, 107.86, "peak"),
        make_pivot(40, 103.0, "trough"),
        make_pivot(50, 112.70, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "butterfly"
    assert pat["direction"] == "bearish"
    assert pat["points"]["D"]["price"] > pat["points"]["X"]["price"]  # D extends beyond X
    assert pat["overall_score"] >= 0.95


def test_butterfly_rejected_if_d_does_not_extend_beyond_x():
    detector = HarmonicDetector()
    # D is 101.0 (inside X=100), not extending beyond X
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 102.14, "trough"),
        make_pivot(40, 107.0, "peak"),
        make_pivot(50, 101.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert not any(p["pattern"] == "butterfly" for p in res["patterns"])
    butterfly_rejs = [r for r in res["rejected_candidates"] if r.get("closest_pattern") == "butterfly"]
    assert len(butterfly_rejs) >= 1
    assert "extend beyond point X" in butterfly_rejs[0]["reason"]


# ==============================================================================
# PART G: CRAB AND DEEP CRAB PATTERN TESTS
# ==============================================================================

def test_perfect_bullish_crab_detected_with_high_score():
    detector = HarmonicDetector()
    # X=100, A=110, B=105.0 (0.50 XA), C=109.27, D=93.82 (1.618 XA extreme extension)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 105.0, "trough"),
        make_pivot(40, 109.27, "peak"),
        make_pivot(50, 93.82, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert any(p["pattern"] == "crab" for p in res["patterns"])
    crab_pat = next(p for p in res["patterns"] if p["pattern"] == "crab")
    assert crab_pat["direction"] == "bullish"
    assert crab_pat["overall_score"] >= 0.95
    assert abs(crab_pat["ratios_measured"]["D_vs_XA"] - 1.618) <= 0.01


def test_perfect_bearish_crab_detected_with_high_score():
    detector = HarmonicDetector()
    # Inverted: X=110, A=100, B=105.0, C=100.73, D=116.18 (1.618 XA extreme extension)
    pivots = [
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 100.0, "trough"),
        make_pivot(30, 105.0, "peak"),
        make_pivot(40, 100.73, "trough"),
        make_pivot(50, 116.18, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert any(p["pattern"] == "crab" for p in res["patterns"])
    crab_pat = next(p for p in res["patterns"] if p["pattern"] == "crab")
    assert crab_pat["direction"] == "bearish"
    assert crab_pat["overall_score"] >= 0.95


def test_perfect_deep_crab_detected():
    detector = HarmonicDetector()
    # X=100, A=110, B=101.14 (0.886 XA), C=106.6, D=83.82 (2.618 XA)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 101.14, "trough"),
        make_pivot(40, 106.6, "peak"),
        make_pivot(50, 83.82, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots)
    assert res["status"] == "available"
    assert any(p["pattern"] == "deep_crab" for p in res["patterns"])
    d_crab = next(p for p in res["patterns"] if p["pattern"] == "deep_crab")
    assert d_crab["overall_score"] >= 0.95



