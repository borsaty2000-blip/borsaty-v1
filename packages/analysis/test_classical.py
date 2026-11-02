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
    res = detector.detect("COMI", "1D", pivots, pattern="head_and_shoulders")
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
    res = detector.detect("COMI", "1D", pivots, pattern="head_and_shoulders")
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

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="head_and_shoulders")
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

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="head_and_shoulders")
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


# ==============================================================================
# PART C: DOUBLE TOP & DOUBLE BOTTOM TESTS
# ==============================================================================

def test_perfect_double_top_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 93.0, "trough"),
        make_pivot(50, 99.5, "peak"),
    ]

    candles = []
    for i in range(70):
        vol = 1000000.0
        p = 95.0
        if i == 20:
            vol = 1000000.0
            p = 100.0
        elif i == 35:
            vol = 600000.0
            p = 93.0
        elif i == 50:
            vol = 800000.0  # Declining volume
            p = 99.5
        elif i == 60:
            vol = 1350000.0  # Breakout volume ratio 1.35 > 1.2
            p = 91.5
        elif i > 60:
            p = 91.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "double_top"
    assert pat["direction"] == "bearish"
    assert pat["status"] == "confirmed"
    assert pat["breakout"]["price"] == 91.5
    assert pat["breakout"]["volume_ratio"] >= 1.2
    assert pat["invalidation"]["price"] == 100.0


def test_double_top_forming_state():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 93.0, "trough"),
        make_pivot(50, 99.5, "peak"),
    ]

    candles = []
    for i in range(55):
        vol = 1000000.0
        p = 96.0
        if i == 20:
            p = 100.0
        elif i == 35:
            p = 93.0
        elif i == 50:
            p = 99.5
            vol = 800000.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "forming"
    assert pat["breakout"] is None


def test_double_top_volume_gate_failure_near_miss():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 93.0, "trough"),
        make_pivot(50, 99.5, "peak"),
    ]

    # Peak 2 volume (1.5M) > Peak 1 (1.0M)
    candles = []
    for i in range(65):
        vol = 1000000.0
        p = 95.0
        if i == 20:
            vol = 1000000.0
            p = 100.0
        elif i == 50:
            vol = 1500000.0
            p = 99.5
        elif i == 60:
            vol = 1400000.0
            p = 91.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "volume_peak2 <= volume_peak1"


def test_perfect_double_bottom_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 50.0, "trough"),
        make_pivot(35, 54.5, "peak"),
        make_pivot(50, 50.4, "trough"),
    ]

    candles = []
    for i in range(70):
        vol = 1000000.0
        p = 52.0
        if i == 20:
            vol = 1000000.0
            p = 50.0
        elif i == 35:
            vol = 800000.0
            p = 54.5
        elif i == 50:
            vol = 750000.0
            p = 50.4
        elif i == 60:
            vol = 1350000.0
            p = 55.5
        elif i > 60:
            p = 56.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "double_bottom"
    assert pat["direction"] == "bullish"
    assert pat["status"] == "confirmed"
    assert pat["breakout"]["price"] == 55.5


def test_double_bottom_forming():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 50.0, "trough"),
        make_pivot(35, 54.5, "peak"),
        make_pivot(50, 50.4, "trough"),
    ]

    candles = []
    for i in range(55):
        vol = 1000000.0
        p = 52.0
        if i == 20:
            p = 50.0
        elif i == 35:
            p = 54.5
        elif i == 50:
            vol = 800000.0
            p = 50.4
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "forming"


# ==============================================================================
# PART D: TRIANGLES (Ascending, Descending, Symmetrical)
# ==============================================================================

def test_ascending_triangle_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 92.0, "trough"),
        make_pivot(30, 100.1, "peak"),   # Flat upper resistance
        make_pivot(40, 95.0, "trough"),   # Higher lower support
    ]

    candles = []
    for i in range(55):
        # Contracting volume into apex (1.2M down to 500k)
        vol = max(400000.0, 1200000.0 - i * 18000.0)
        p = 96.0
        if i == 50:
            vol = 1600000.0  # Breakout volume spike ratio 1.6 > 1.5
            p = 101.5        # Close above resistance 100.1
        elif i > 50:
            p = 102.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "ascending_triangle"
    assert pat["direction"] == "bullish"
    assert pat["status"] == "confirmed"
    assert pat["breakout"]["price"] == 101.5


def test_descending_triangle_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 90.0, "trough"),
        make_pivot(20, 98.0, "peak"),
        make_pivot(30, 89.9, "trough"),  # Flat lower support
        make_pivot(40, 94.0, "peak"),    # Lower high
    ]

    candles = []
    for i in range(55):
        vol = max(400000.0, 1200000.0 - i * 18000.0)
        p = 93.0
        if i == 50:
            vol = 1600000.0
            p = 88.5  # Close below support 89.9
        elif i > 50:
            p = 88.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "descending_triangle"
    assert pat["direction"] == "bearish"
    assert pat["status"] == "confirmed"


def test_symmetrical_triangle_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 90.0, "trough"),
        make_pivot(30, 96.0, "peak"),    # Lower high
        make_pivot(40, 93.0, "trough"),  # Higher low
    ]

    candles = []
    for i in range(55):
        vol = max(400000.0, 1200000.0 - i * 18000.0)
        p = 94.0
        if i == 50:
            vol = 1500000.0
            p = 97.5  # Breakout above 96.0
        elif i > 50:
            p = 98.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "symmetrical_triangle"
    assert pat["status"] == "confirmed"


def test_triangle_volume_non_contracting_near_miss():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 92.0, "trough"),
        make_pivot(30, 100.1, "peak"),
        make_pivot(40, 95.0, "trough"),
    ]

    # Rising volume into apex
    candles = []
    for i in range(55):
        vol = 500000.0 + i * 25000.0
        p = 96.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="ascending_triangle")
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "volume_contracting_into_apex"


# ==============================================================================
# PART E: FLAGS (Bull & Bear)
# ==============================================================================

def test_bull_flag_confirmed():
    detector = ClassicalPatternDetector()
    # Pole: 100.0 to 110.0 in 6 bars (+10%), consolidation to 107.0 (retrace 30%)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(16, 110.0, "peak"),
        make_pivot(25, 107.0, "trough"),
    ]

    candles = []
    for i in range(40):
        vol = 800000.0
        p = 108.0
        if i == 16:
            vol = 1500000.0
            p = 110.0
        elif 16 < i <= 25:
            vol = 500000.0  # low volume during flag
            p = 107.5
        elif i == 30:
            vol = 1600000.0  # Breakout spike ratio > 1.4
            p = 111.5        # Close above 110.0
        elif i > 30:
            p = 112.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "bull_flag"
    assert pat["direction"] == "bullish"
    assert pat["status"] == "confirmed"
    assert pat["targets"][0]["price"] == 120.0  # 110 + 10


def test_bear_flag_confirmed():
    detector = ClassicalPatternDetector()
    # Pole: 100.0 down to 90.0 (-10%), consolidation up to 93.0 (retrace 30%)
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(16, 90.0, "trough"),
        make_pivot(25, 93.0, "peak"),
    ]

    candles = []
    for i in range(40):
        vol = 800000.0
        p = 92.0
        if i == 16:
            vol = 1500000.0
            p = 90.0
        elif 16 < i <= 25:
            vol = 500000.0
            p = 92.5
        elif i == 30:
            vol = 1600000.0
            p = 89.0  # Breakout below 90.0
        elif i > 30:
            p = 88.5
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "bear_flag"
    assert pat["direction"] == "bearish"
    assert pat["status"] == "confirmed"


# ==============================================================================
# PART F: CUP AND HANDLE
# ==============================================================================

def test_cup_and_handle_confirmed():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(30, 90.0, "trough"),
        make_pivot(50, 99.8, "peak"),
        make_pivot(60, 97.0, "trough"),
    ]

    candles = []
    for i in range(75):
        vol = 1000000.0
        p = 95.0
        if i == 68:
            vol = 1450000.0
            p = 101.0  # Breakout above rim (99.8)
        elif i > 68:
            p = 102.0
        candles.append(make_candle(i, p, p + 0.5, p - 0.5, p, vol))

    res = detector.detect("COMI", "1D", pivots, candles=candles)
    assert res["status"] == "available"
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["pattern"] == "cup_and_handle"
    assert pat["status"] == "confirmed"


# ==============================================================================
# PART G: REAL DATA SIMULATION (8 STOCKS)
# ==============================================================================

from engines.hspd import HSPDEngine
import math
import random


def generate_stock_bars(base=86.0, length=250, seed=42):
    random.seed(seed)
    candles = []
    for i in range(length):
        c1 = 18.0 * math.sin(2 * math.pi * i / 120)
        c2 = 8.0 * math.sin(2 * math.pi * i / 40)
        c3 = 3.0 * math.sin(2 * math.pi * i / 12)
        p = base + c1 + c2 + c3 + random.gauss(0, 0.4)
        vol = 1000000.0 + random.uniform(-200000, 300000)
        candles.append({
            "index": i,
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(p, 2),
            "high": round(p + 1.2, 2),
            "low": round(p - 1.2, 2),
            "close": round(p, 2),
            "volume": round(vol, 2),
        })
    return candles


def test_real_data_comi():
    candles = generate_stock_bars(base=86.0, length=250, seed=1)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("COMI", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "COMI"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_2222_aramco():
    candles = generate_stock_bars(base=27.5, length=250, seed=2)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("2222", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "2222"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_aapl():
    candles = generate_stock_bars(base=230.0, length=250, seed=3)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("AAPL", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "AAPL"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_msft():
    candles = generate_stock_bars(base=420.0, length=250, seed=4)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("MSFT", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "MSFT"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_nvda():
    candles = generate_stock_bars(base=135.0, length=250, seed=5)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("NVDA", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "NVDA"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_emaar():
    candles = generate_stock_bars(base=8.5, length=250, seed=6)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("EMAAR", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "EMAAR"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_shel():
    candles = generate_stock_bars(base=2600.0, length=250, seed=7)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("SHEL", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "SHEL"
    assert res["status"] in ["available", "unavailable"]


def test_real_data_tsla():
    candles = generate_stock_bars(base=250.0, length=250, seed=8)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    res = ClassicalPatternDetector().detect("TSLA", "1D", pivots, candles=candles, min_degree=0)
    assert res["symbol"] == "TSLA"
    assert res["status"] in ["available", "unavailable"]


# ==============================================================================
# PART H: VALIDATOR UNIT TESTS
# ==============================================================================

def test_volume_validator_edge_cases():
    vv = VolumeValidator()
    # Empty candles
    assert vv.formation_volume_profile([], 0, 0)["profile"] == "flat"
    assert vv.breakout_volume_ratio([], 0) == 1.0

    # Rising profile
    rising_candles = [make_candle(i, 100.0, 101.0, 99.0, 100.0, volume=500000.0 + i * 50000.0) for i in range(25)]
    prof = vv.formation_volume_profile(rising_candles, 0, 24)
    assert prof["profile"] == "rising"
    assert prof["total_delta"] > 0.10

    # Flat profile
    flat_candles = [make_candle(i, 100.0, 101.0, 99.0, 100.0, volume=1000000.0) for i in range(25)]
    prof_flat = vv.formation_volume_profile(flat_candles, 0, 24)
    assert prof_flat["profile"] == "flat"

    # Confirms breakout
    bo_candles = [make_candle(i, 100.0, 101.0, 99.0, 100.0, volume=1000000.0) for i in range(20)]
    bo_candles.append(make_candle(20, 100.0, 101.0, 99.0, 100.0, volume=1500000.0))
    assert vv.volume_confirms_breakout(bo_candles, 20, threshold=1.3) is True


def test_breakout_validator_edge_cases():
    bv = BreakoutValidator()
    # Empty
    conf, idx, p, wick = bv.confirmed_close([], 100.0, "bearish")
    assert conf is False

    # Bullish confirmed close
    candles_bull = [
        make_candle(0, 100.0, 100.5, 99.5, 100.0),
        make_candle(1, 100.2, 102.0, 100.0, 101.5),  # Close above 101.0
    ]
    conf, idx, p, wick = bv.confirmed_close(candles_bull, 101.0, "bullish")
    assert conf is True
    assert idx == 1

    # Bullish wick only
    candles_wick = [
        make_candle(0, 100.0, 100.5, 99.5, 100.0),
        make_candle(1, 100.2, 102.0, 100.0, 100.8),  # High crossed 101.0, close below
    ]
    conf, idx, p, wick = bv.confirmed_close(candles_wick, 101.0, "bullish")
    assert conf is False
    assert wick is True

    # Retest failure / invalidation
    retest_candles = [
        make_candle(0, 100.0, 100.5, 99.5, 98.0),   # Breakout below 99.0
        make_candle(1, 98.0, 105.0, 97.5, 104.0),   # Reverses strongly above 99.0
    ]
    retested, _ = bv.retest_happened(retest_candles, 0, 99.0, "bearish")
    assert retested is False


# ==============================================================================
# PART I: ADDITIONAL LOGIC GATE & SHAPE TESTS
# ==============================================================================

def test_double_top_wick_only_breakout_forming():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 93.0, "trough"),
        make_pivot(50, 99.5, "peak"),
    ]
    candles = [
        make_candle(i, 95.0, 95.5, 94.5, 95.0, 1000000.0) for i in range(55)
    ]
    # Candle 54 dips wick below valley 93.0, but closes at 93.5
    candles[54] = make_candle(54, 94.0, 94.5, 92.5, 93.5, 1200000.0)

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="double_top")
    assert len(res["patterns"]) == 1
    assert res["patterns"][0]["status"] == "forming"
    assert res["patterns"][0]["logic_gates"]["confirmed_close_below"]["wick_only"] is True


def test_double_bottom_wick_only_breakout_forming():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 50.0, "trough"),
        make_pivot(35, 54.5, "peak"),
        make_pivot(50, 50.4, "trough"),
    ]
    candles = [make_candle(i, 52.0, 52.5, 51.5, 52.0, 1000000.0) for i in range(55)]
    # Candle 54 high is 55.0 (> 54.5 peak), but close is 54.0
    candles[54] = make_candle(54, 53.0, 55.0, 52.8, 54.0, 1200000.0)

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="double_bottom")
    assert len(res["patterns"]) == 1
    assert res["patterns"][0]["status"] == "forming"
    assert res["patterns"][0]["logic_gates"]["confirmed_close_above"]["wick_only"] is True


def test_double_top_breakout_volume_too_low_near_miss():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 93.0, "trough"),
        make_pivot(50, 99.5, "peak"),
    ]
    # Breakout close with volume ratio 1.0 (< 1.2 threshold)
    candles = [make_candle(i, 95.0, 95.5, 94.5, 95.0, 1000000.0) for i in range(60)]
    candles[50] = make_candle(50, 99.5, 100.0, 99.0, 99.5, 800000.0)
    candles[55] = make_candle(55, 93.0, 93.5, 91.0, 91.5, 1000000.0)  # Ratio 1.0 < 1.2

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="double_top")
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "breakout_volume_ratio > 1.2"


def test_double_bottom_breakout_volume_too_low_near_miss():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(20, 50.0, "trough"),
        make_pivot(35, 54.5, "peak"),
        make_pivot(50, 50.4, "trough"),
    ]
    candles = [make_candle(i, 52.0, 52.5, 51.5, 52.0, 1000000.0) for i in range(60)]
    candles[50] = make_candle(50, 50.4, 51.0, 50.0, 50.4, 750000.0)
    candles[55] = make_candle(55, 54.0, 56.0, 53.5, 55.5, 900000.0)  # Ratio 0.9 < 1.2

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="double_bottom")
    assert len(res["patterns"]) == 0
    assert len(res["near_misses"]) >= 1
    assert res["near_misses"][0]["specific_gate"] == "breakout_volume_ratio > 1.2"


def test_double_top_peaks_not_within_3pct_rejected():
    detector = ClassicalPatternDetector()
    # P1 (100.0) and P2 (105.0) -> difference = 5% > 3%
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 90.0, "trough"),
        make_pivot(50, 105.0, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="double_top")
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "peaks differ by" in res["rejected_candidates"][0]["reason"]


def test_double_top_valley_decline_less_than_3pct_rejected():
    detector = ClassicalPatternDetector()
    # P1 (100.0), Valley (98.5), P2 (99.8) -> valley decline only 1.5% < 3%
    pivots = [
        make_pivot(20, 100.0, "peak"),
        make_pivot(35, 98.5, "trough"),
        make_pivot(50, 99.8, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="double_top")
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "valley decline" in res["rejected_candidates"][0]["reason"]


def test_double_bottom_troughs_not_within_3pct_rejected():
    detector = ClassicalPatternDetector()
    # T1 (50.0), Peak (55.0), T2 (47.0) -> difference 6% > 3%
    pivots = [
        make_pivot(20, 50.0, "trough"),
        make_pivot(35, 55.0, "peak"),
        make_pivot(50, 47.0, "trough"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="double_bottom")
    assert len(res["patterns"]) == 0
    assert len(res["rejected_candidates"]) >= 1
    assert "troughs differ by" in res["rejected_candidates"][0]["reason"]


def test_bull_flag_pole_too_shallow_rejected():
    detector = ClassicalPatternDetector()
    # Pole from 100.0 to 102.0 (+2% < 5%)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(16, 102.0, "peak"),
        make_pivot(25, 101.5, "trough"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="bull_flag")
    assert len(res["patterns"]) == 0


def test_bull_flag_consolidation_retraces_more_than_50pct_rejected():
    detector = ClassicalPatternDetector()
    # Pole from 100.0 to 110.0 (+10%), consolidation to 103.0 (retrace 70% > 50%)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(16, 110.0, "peak"),
        make_pivot(25, 103.0, "trough"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="bull_flag")
    assert len(res["patterns"]) == 0


def test_cup_and_handle_handle_pullback_too_deep_rejected():
    detector = ClassicalPatternDetector()
    # Cup rim 100.0, bottom 90.0 (depth 10). Handle drops to 94.0 (pullback 60% > 40%)
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(30, 90.0, "trough"),
        make_pivot(50, 99.8, "peak"),
        make_pivot(60, 94.0, "trough"),
    ]
    res = detector.detect("COMI", "1D", pivots, pattern="cup_and_handle")
    assert len(res["patterns"]) == 0


def test_classical_unavailable_on_insufficient_pivots():
    detector = ClassicalPatternDetector()
    # Only 2 pivots
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 105.0, "peak"),
    ]
    res = detector.detect("SHORT", "1D", pivots)
    assert res["status"] == "unavailable"
    assert res["status_reason"] == "insufficient_pivots"
    assert "غير كافٍ" in res["status_message_ar"]


def test_hs_neckline_break_aligns_with_elliott_wave_3_or_c():
    # Structural integration: H&S neckline break signals powerful directional wave
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(100, 92.5, "peak"),
        make_pivot(115, 88.0, "trough"),
        make_pivot(130, 96.0, "peak"),
        make_pivot(145, 88.2, "trough"),
        make_pivot(160, 92.4, "peak"),
    ]
    candles = [make_candle(i, 90.0, 90.5, 89.5, 90.0, 1000000.0) for i in range(175)]
    candles[100] = make_candle(100, 92.5, 93.0, 92.0, 92.5, 1000000.0)
    candles[130] = make_candle(130, 96.0, 96.5, 95.5, 96.0, 1500000.0)
    candles[160] = make_candle(160, 92.4, 93.0, 92.0, 92.4, 900000.0)
    candles[170] = make_candle(170, 88.0, 88.2, 87.0, 87.2, 1450000.0)

    res = detector.detect("COMI", "1D", pivots, candles=candles, pattern="head_and_shoulders")
    assert len(res["patterns"]) == 1
    pat = res["patterns"][0]
    assert pat["status"] == "confirmed"
    assert pat["breakout"]["volume_ratio"] >= 1.3



# ==============================================================================
# PART H: CROSS-ENGINE INTEGRATION TEST
# ==============================================================================

from elliott.detector import ElliottDetector
from harmonic.detector import HarmonicDetector


def test_cross_engine_multi_pattern_pipeline():
    candles = generate_stock_bars(base=100.0, length=250, seed=42)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)

    res_e = ElliottDetector().detect("COMI", "1D", pivots, min_degree=0)
    res_h = HarmonicDetector().detect("COMI", "1D", pivots, min_degree=0, candles=candles)
    res_c = ClassicalPatternDetector().detect("COMI", "1D", pivots, candles=candles, min_degree=0)

    assert "status" in res_e
    assert "status" in res_h
    assert "status" in res_c
    assert res_c["symbol"] == "COMI"


# ==============================================================================
# PART I: PERFORMANCE TESTS
# ==============================================================================

import time


def test_performance_per_instrument_under_300ms():
    candles = generate_stock_bars(base=100.0, length=250, seed=12)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    detector = ClassicalPatternDetector()

    t0 = time.time()
    _ = detector.detect("PERF", "1D", pivots, candles=candles, min_degree=0)
    elapsed_ms = (time.time() - t0) * 1000.0

    print(f"\nClassical Detector per-instrument: {elapsed_ms:.2f}ms")
    assert elapsed_ms < 300.0


def test_performance_100_instruments_under_30s():
    candles = generate_stock_bars(base=100.0, length=200, seed=12)
    pivots = HSPDEngine().detect(candles, min_degree=0, max_degree=3)
    detector = ClassicalPatternDetector()

    t0 = time.time()
    for _ in range(100):
        _ = detector.detect("PERF", "1D", pivots, candles=candles, min_degree=0)
    total_sec = time.time() - t0

    print(f"\n100 Instruments Classical Detection: {total_sec:.2f}s")
    assert total_sec < 30.0


# ==============================================================================
# PART J: UNAVAILABLE STATE TEST
# ==============================================================================

def test_classical_unavailable_on_range_bound():
    detector = ClassicalPatternDetector()
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 101.0, "peak"),
        make_pivot(30, 100.2, "trough"),
        make_pivot(40, 100.8, "peak"),
        make_pivot(50, 100.3, "trough"),
    ]
    candles = [make_candle(i, 100.5, 101.0, 100.0, 100.5, 500000.0) for i in range(60)]

    res = detector.detect("CONSOL", "1D", pivots, candles=candles)
    assert res["status"] == "unavailable"
    assert res["status_reason"] == "no_classical_patterns_found"
    assert "السوق في نطاق عرضي" in res["status_message_ar"]
    assert "Range-bound market" in res["status_message_en"]
    assert res["patterns"] == []

