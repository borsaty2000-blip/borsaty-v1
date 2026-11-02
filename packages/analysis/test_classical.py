"""
Classical Patterns Test Suite (Borsaty).
Phased validation: Head and Shoulders end-to-end (8 hand-crafted + 5 edge cases).
"""

import pytest
from classical.detector import ClassicalPatternDetector
from classical.validators import VolumeValidator, BreakoutValidator


def make_pivot(index: int, price: float, p_type: str, degree: int = 1, timestamp: str = "2026-01-01T00:00:00Z"):
    return {
        "index": index,
        "price": round(price, 4),
        "type": p_type,
        "degree": degree,
        "timestamp": timestamp,
        "stability_score": 1.0,
    }


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


# ==============================================================================
# PART A: HEAD & SHOULDERS HAND-CRAFTED TESTS (1-8)
# ==============================================================================

def test_perfect_head_and_shoulders_confirmed():
    detector = ClassicalPatternDetector()

    # Pivots: LS(100, 92.5), V1(115, 88.0), Head(130, 96.0), V2(145, 88.2), RS(160, 92.4)
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    # Candles from 0 to 180
    candles = []
    for i in range(180):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0  # LS vol
            p = 92.5
        elif i == 115:
            vol = 800000.0
            p = 88.0
        elif i == 130:
            vol = 1500000.0  # Head vol (elevated)
            p = 96.0
        elif i == 145:
            vol = 700000.0
            p = 88.2
        elif i == 160:
            vol = 900000.0   # RS vol (declining vs Head)
            p = 92.4
        elif i == 170:
            # Breakout bar below neckline (~88.3)
            vol = 1450000.0  # > 1.3x SMA
            p = 87.5
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1

    pat = res["patterns"][0]
    assert pat["pattern"] == "head_and_shoulders"
    assert pat["direction"] == "bearish"
    assert pat["status"] == "confirmed"
    assert pat["pattern_score"] >= 0.85

    # Check logic gates
    lg = pat["logic_gates"]
    assert lg["volume_head > volume_LS"]["pass"] is True
    assert lg["volume_RS < volume_head"]["pass"] is True
    assert lg["breakout_volume_ratio > 1.3"]["pass"] is True
    assert lg["confirmed_close_below"]["pass"] is True

    # Check Breakout
    assert pat["breakout"] is not None
    assert pat["breakout"]["price"] == 87.5
    assert pat["breakout"]["volume_ratio"] >= 1.3


def test_head_and_shoulders_forming_state():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    # Candles end at RS peak (no breakout yet)
    candles = []
    for i in range(165):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
            p = 92.4
        elif i > 160:
            p = 91.0  # Above neckline (88.2)
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "forming"
    assert pat["breakout"] is None


def test_head_and_shoulders_failed_state():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    candles = []
    for i in range(185):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        elif i == 170:
            # Breakout bar
            vol = 1400000.0
            p = 87.5
        elif i == 180:
            # Reversal above invalidation level (RS peak = 92.4)
            p = 94.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "failed"
    assert "invalidation_reason" in pat


def test_perfect_inverse_head_and_shoulders_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 88.0, "trough"),
        make_pivot(115, 92.5, "peak"),
        make_pivot(130, 84.0, "trough"),
        make_pivot(145, 92.4, "peak"),
        make_pivot(160, 88.1, "trough"),
    ]

    candles = []
    for i in range(180):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0  # Head trough high volume
        elif i == 160:
            vol = 900000.0   # RS trough low volume
        elif i == 170:
            # Breakout candle above neckline (~92.4)
            vol = 1450000.0
            p = 93.5
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "inverse_head_and_shoulders"
    assert pat["direction"] == "bullish"
    assert pat["status"] == "confirmed"
    assert pat["breakout"]["price"] == 93.5


def test_inverse_head_and_shoulders_forming():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 88.0, "trough"),
        make_pivot(115, 92.5, "peak"),
        make_pivot(130, 84.0, "trough"),
        make_pivot(145, 92.4, "peak"),
        make_pivot(160, 88.1, "trough"),
    ]

    candles = []
    for i in range(165):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "forming"


def test_hs_retest_boosts_confidence():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    candles = []
    for i in range(180):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        elif i == 170:
            vol = 1400000.0
            p = 87.0  # Breakout below neckline
        elif i == 173:
            # Retest: high touches 88.1, close drops back to 87.2
            c = make_candle(i, 87.5, 88.1, 87.0, 87.2, 900000.0)
            candles.append(c)
            continue
        elif i > 170:
            p = 87.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    pat = res["patterns"][0]
    assert pat["status"] == "confirmed"
    assert pat["logic_gates"]["retest_after_breakout"]["pass"] is True


def test_hs_target_calculations_measured_and_fibonacci():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.0, "trough"),
        make_pivot(160, 92.5, "peak"),
    ]

    candles = []
    for i in range(175):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        elif i == 170:
            vol = 1400000.0
            p = 87.0  # Breakout
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    pat = res["patterns"][0]

    # Neckline is 88.0, Head is 96.0 -> depth = 8.0
    # Target 1 = 88.0 - 8.0 = 80.0
    # Target 2 = 88.0 - 8.0 * 1.618 = 75.06
    targets = pat["targets"]
    assert len(targets) == 2
    assert abs(targets[0]["price"] - 80.0) <= 0.2
    assert abs(targets[1]["price"] - 75.06) <= 0.2


def test_hs_slanted_neckline_support():
    detector = ClassicalPatternDetector()
    # Neckline slanting upwards: V1(115, 88.0) to V2(145, 90.0) -> slope = 2.0 / 30 = 0.0667
    pivots = [
        make_pivot(100, 94.0, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 98.0, "peak"),
        make_pivot(145, 90.0, "trough"),
        make_pivot(160, 94.2, "peak"),
    ]

    candles = []
    for i in range(175):
        vol = 1000000.0
        p = 92.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        elif i == 170:
            vol = 1400000.0
            p = 89.0  # Below slanted neckline at bar 170 (neckline is 90 + 25 * 0.0667 = 91.67)
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    pat = res["patterns"][0]
    assert pat["status"] == "confirmed"
    assert pat["points"]["neckline"]["slope"] > 0


# ==============================================================================
# PART B: EDGE CASES & GATE REJECTIONS (9-13)
# ==============================================================================

def test_hs_rejected_head_not_highest():
    detector = ClassicalPatternDetector()
    # Head (92.0) <= LS (92.5)
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 92.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots)
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "head not higher" in res["rejected_candidates"][0]["reason"]


def test_hs_rejected_unequal_shoulders():
    detector = ClassicalPatternDetector()
    # LS (90.0) vs RS (105.0) -> difference > 10%
    pivots = [
        make_pivot(100, 90.0, "peak"),
        make_pivot(115, 85.0, "trough"),
        make_pivot(130, 110.0, "peak"),
        make_pivot(145, 85.0, "trough"),
        make_pivot(160, 105.0, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots)
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "shoulders unequal" in res["rejected_candidates"][0]["reason"]


def test_hs_near_miss_low_head_volume():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    # Head volume (800k) < LS volume (1.2M)
    candles = []
    for i in range(175):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1200000.0
        elif i == 130:
            vol = 800000.0
        elif i == 160:
            vol = 700000.0
        elif i == 170:
            vol = 1400000.0
            p = 87.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "volume_head > volume_LS"


def test_hs_near_miss_rising_rs_volume():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    # RS volume (1.6M) >= Head volume (1.5M)
    candles = []
    for i in range(175):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 1600000.0  # Expanding RS volume!
        elif i == 170:
            vol = 1400000.0
            p = 87.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "volume_RS < volume_head"


def test_hs_wick_only_breakout_not_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.0, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]

    candles = []
    for i in range(175):
        vol = 1000000.0
        p = 90.0
        if i == 100:
            vol = 1000000.0
        elif i == 130:
            vol = 1500000.0
        elif i == 160:
            vol = 900000.0
        elif i == 170:
            # Wick crossed to 87.0 (below 88.0 neckline), but close stayed at 88.5!
            vol = 1500000.0
            candles.append(make_candle(i, 89.0, 89.2, 87.0, 88.5, vol))
            continue
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    # Wick only breach -> NOT confirmed! Status is forming
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "forming"
    assert pat["breakout"] is None
    assert pat["logic_gates"]["confirmed_close_below"]["wick_only"] is True
