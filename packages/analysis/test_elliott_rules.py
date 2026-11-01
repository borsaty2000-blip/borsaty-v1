import pytest
from elliott.detector import ElliottDetector, global_elliott_detector

def make_pivot(index: int, price: float, pivot_type: str, degree: int = 2, stability: float = 1.0):
    return {
        "index": index,
        "price": price,
        "type": pivot_type,
        "degree": degree,
        "stability_score": stability,
        "timestamp": f"2026-01-01T{index:04d}Z"
    }

# ==============================================================================
# PART A: HAND-CRAFTED IMPULSE TESTS
# ==============================================================================

def test_hand_crafted_bullish_impulse():
    # Perfect impulse:
    # 0: 100.0 (trough)
    # 1: 110.0 (peak)   -> L1 = 10
    # 2: 104.0 (trough) -> L2 = 6 (retracement 60%)
    # 3: 130.0 (peak)   -> L3 = 26 (extension 2.6x)
    # 4: 122.0 (trough) -> L4 = 8 (retracement 30.7%)
    # 5: 145.0 (peak)   -> L5 = 23 (extension 0.76 of 1-3)
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 104.0, "trough"),
        make_pivot(50, 130.0, "peak"),
        make_pivot(65, 122.0, "trough"),
        make_pivot(85, 145.0, "peak"),
    ]

    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    pc = res["primary_count"]
    assert pc["pattern"] == "impulse"
    assert pc["subtype"] == "extended_third"
    assert len(pc["waves"]) == 5
    assert pc["pattern_score"] >= 0.75
    assert pc["trade_ready"] is not None
    assert pc["trade_ready"]["risk_reward"] >= 1.5

def test_hand_crafted_bearish_impulse():
    # Bearish impulse:
    # 0: 150.0 (peak)
    # 1: 130.0 (trough) -> L1 = 20
    # 2: 140.0 (peak)   -> L2 = 10 (retracement 50%)
    # 3: 100.0 (trough) -> L3 = 40 (extension 2.0x)
    # 4: 115.0 (peak)   -> L4 = 15 (retracement 37.5%)
    # 5: 80.0  (trough) -> L5 = 35
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 150.0, "peak"),
        make_pivot(25, 130.0, "trough"),
        make_pivot(40, 140.0, "peak"),
        make_pivot(60, 100.0, "trough"),
        make_pivot(75, 115.0, "peak"),
        make_pivot(95, 80.0, "trough"),
    ]

    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    pc = res["primary_count"]
    assert pc["pattern"] == "impulse"
    assert pc["waves"][0]["direction"] == "down"
    assert pc["waves"][1]["direction"] == "up"
    assert pc["trade_ready"] is not None
    assert pc["trade_ready"]["stop_loss"]["price"] > pc["trade_ready"]["entry_zone"]["high"]

def test_fibonacci_ratios_exact_mapping():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 104.0, "trough"),
        make_pivot(30, 126.18, "peak"),
        make_pivot(40, 120.0, "trough"),
        make_pivot(50, 135.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    pc = res["primary_count"]
    assert "fibonacci_relationships" in pc
    assert pc["fibonacci_relationships"]["wave2_vs_wave1"]["measured"] == 0.60
    assert pc["waves"][1]["fib_ratio"] == 0.60

def test_extended_fifth_subtype():
    detector = ElliottDetector()
    # Wave 5 is huge extension
    # L1 = 10, L3 = 15, L5 = 30
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 105.0, "trough"),
        make_pivot(30, 120.0, "peak"),
        make_pivot(40, 116.0, "trough"),
        make_pivot(50, 146.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"]["subtype"] == "extended_fifth"

def test_regular_impulse_subtype():
    detector = ElliottDetector()
    # Moderate wave lengths (L1 = 10, L3 = 14, L5 = 12)
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 105.0, "trough"),
        make_pivot(30, 119.0, "peak"),
        make_pivot(40, 115.0, "trough"),
        make_pivot(50, 127.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"]["subtype"] == "regular"

def test_trade_ready_block_suppressed_when_score_low():
    detector = ElliottDetector()
    # Ratios far from Fibonacci (e.g. Wave 3 only 1.05x Wave 1, Wave 2 retraces 20%)
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 120.0, "peak"),
        make_pivot(20, 118.0, "trough"), # R2 = 10%
        make_pivot(30, 140.0, "peak"),   # E3 = 1.1x
        make_pivot(40, 137.0, "trough"), # R4 = 15%
        make_pivot(50, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    # Pattern score will be low (< 0.70)
    assert res["primary_count"]["pattern_score"] < 0.70
    assert res["primary_count"]["trade_ready"] is None

def test_trade_ready_block_suppressed_when_stability_low():
    detector = ElliottDetector()
    # High pattern score but pivots have low stability score (0.60)
    pivots = [
        make_pivot(0, 100.0, "trough", stability=0.5),
        make_pivot(10, 110.0, "peak", stability=0.6),
        make_pivot(20, 104.0, "trough", stability=0.6),
        make_pivot(30, 130.0, "peak", stability=0.6),
        make_pivot(40, 122.0, "trough", stability=0.6),
        make_pivot(50, 145.0, "peak", stability=0.6),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["stability_score"] < 0.85
    assert res["primary_count"]["trade_ready"] is None

def test_multiple_impulses_highest_score_wins():
    detector = ElliottDetector()
    # Sequence of 7 pivots giving two overlapping impulse windows
    pivots = [
        make_pivot(0, 80.0, "peak"),
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 104.0, "trough"),
        make_pivot(40, 130.0, "peak"),
        make_pivot(50, 122.0, "trough"),
        make_pivot(60, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "impulse"
    assert res["primary_count"]["waves"][0]["start"]["index"] == 10

def test_hard_rule_bearish_wave4_overlaps_wave1_rejected():
    detector = ElliottDetector()
    # Bearish impulse where Wave 4 bounces above Wave 1 trough (130.0) to 132.0 -> VIOLATION!
    pivots = [
        make_pivot(10, 150.0, "peak"),
        make_pivot(25, 130.0, "trough"),
        make_pivot(40, 140.0, "peak"),
        make_pivot(60, 100.0, "trough"),
        make_pivot(75, 132.0, "peak"), # VIOLATION: 132 >= 130
        make_pivot(95, 80.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "wave4_no_overlap_wave1" for r in res["rejected_counts"])

def test_hard_rule_bearish_wave3_is_shortest_rejected():
    detector = ElliottDetector()
    # Bearish impulse where L3 (10 pts) is shorter than L1 (20 pts) and L5 (25 pts) -> VIOLATION!
    pivots = [
        make_pivot(10, 150.0, "peak"),
        make_pivot(25, 130.0, "trough"), # L1 = 20
        make_pivot(40, 135.0, "peak"),
        make_pivot(60, 125.0, "trough"), # L3 = 10 (VIOLATION)
        make_pivot(75, 130.0, "peak"),
        make_pivot(95, 105.0, "trough"), # L5 = 25
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "wave3_not_shortest" for r in res["rejected_counts"])

# ==============================================================================
# PART C: ZIGZAG (A-B-C) TESTS
# ==============================================================================

def test_hand_crafted_downward_zigzag():
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 92.0, "peak"),
        make_pivot(40, 68.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "zigzag"
    assert len(res["primary_count"]["waves"]) == 3
    assert res["primary_count"]["waves"][0]["number"] == "A"
    assert res["primary_count"]["waves"][1]["number"] == "B"
    assert res["primary_count"]["waves"][2]["number"] == "C"

def test_hand_crafted_upward_zigzag():
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 50.0, "trough"),
        make_pivot(20, 70.0, "peak"),
        make_pivot(30, 58.0, "trough"),
        make_pivot(40, 78.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "zigzag"
    assert res["primary_count"]["waves"][0]["direction"] == "up"

def test_zigzag_hard_rule_waveB_retraces_100pct_rejected():
    detector = ElliottDetector()
    # Wave B rises to 102.0 (exceeds start of Wave A at 100.0) -> VIOLATION!
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 102.0, "peak"), # VIOLATION!
        make_pivot(40, 68.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "waveB_retracement < 1.0" for r in res["rejected_counts"])

def test_zigzag_hard_rule_waveC_not_extending_beyond_A_rejected():
    detector = ElliottDetector()
    # Wave C stops at 82.0 (fails to exceed Wave A low of 80.0) -> VIOLATION!
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 92.0, "peak"),
        make_pivot(40, 82.0, "trough"), # VIOLATION! 82 >= 80
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "waveC_extends_beyond_A" for r in res["rejected_counts"])

def test_ambiguity_impulse_and_zigzag_both_reported():
    detector = ElliottDetector()
    # 6 pivots forming an impulse, where subsets also form zigzags
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 104.0, "trough"),
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 122.0, "trough"),
        make_pivot(50, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "impulse"
    assert res["alternative_count"] is not None
    assert res["alternative_count"]["pattern"] in ["impulse", "zigzag"]




# ==============================================================================
# PART B: HARD RULE VIOLATIONS (REJECTIONS)
# ==============================================================================

def test_hard_rule_wave2_retraces_100pct_rejected():
    detector = ElliottDetector()
    # Wave 2 drops to 98.0 (below Wave 0 at 100.0) -> Retracement 120%
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 98.0, "trough"), # VIOLATION!
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 122.0, "trough"),
        make_pivot(50, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert len(res["rejected_counts"]) >= 1
    assert res["rejected_counts"][0]["hard_rule_failed"] == "wave2_retracement < 1.0"

def test_hard_rule_wave3_is_shortest_rejected():
    detector = ElliottDetector()
    # L1 = 20 (100 to 120)
    # L3 = 10 (110 to 120) -> VIOLATION! L3 < L1 and L3 < L5
    # L5 = 25 (115 to 140)
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 120.0, "peak"),
        make_pivot(20, 110.0, "trough"),
        make_pivot(30, 120.0, "peak"), # L3 = 10
        make_pivot(40, 115.0, "trough"),
        make_pivot(50, 140.0, "peak"), # L5 = 25
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] in ["wave3_not_shortest", "wave1_and_wave3_and_wave5_trending"] for r in res["rejected_counts"])

def test_hard_rule_wave4_overlaps_wave1_rejected():
    detector = ElliottDetector()
    # Wave 1 top is at 110.0.
    # Wave 4 trough drops to 108.0 (enters Wave 1 territory) -> VIOLATION!
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 104.0, "trough"),
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 108.0, "trough"), # VIOLATION: 108 <= 110
        make_pivot(50, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "wave4_no_overlap_wave1" for r in res["rejected_counts"])

def test_hard_rule_wave5_failure_truncated_rejected():
    detector = ElliottDetector()
    # Wave 5 fails to exceed Wave 3 high (130.0 vs 128.0) -> VIOLATION!
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 104.0, "trough"),
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 120.0, "trough"),
        make_pivot(50, 128.0, "peak"), # VIOLATION: 128 <= 130
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] == "wave1_and_wave3_and_wave5_trending" for r in res["rejected_counts"])

def test_hard_rule_non_alternating_pivots_rejected():
    detector = ElliottDetector()
    # Two consecutive peaks
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 115.0, "peak"), # Non-alternating
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 120.0, "trough"),
        make_pivot(50, 140.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert any(r["hard_rule_failed"] in ["alternating_pivots", "pivot_polarity"] for r in res["rejected_counts"])
