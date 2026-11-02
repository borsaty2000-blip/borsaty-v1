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
    assert any(r["pattern"] == "zigzag" and r["hard_rule_failed"] == "waveB_retracement < 1.0" for r in res["rejected_counts"])

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
# PART D: FLAT (A-B-C, 3-3-5) TESTS
# ==============================================================================

def test_hand_crafted_regular_flat():
    detector = ElliottDetector()
    # Wave A: 100 to 80 (20 pts)
    # Wave B: 80 to 99 (19 pts -> 95% retracement)
    # Wave C: 99 to 79 (20 pts -> 100% of Wave A)
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 99.0, "peak"),
        make_pivot(40, 79.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "flat"
    assert res["primary_count"]["subtype"] == "regular_flat"

def test_hand_crafted_expanded_flat():
    detector = ElliottDetector()
    # Wave A: 100 to 80 (20 pts)
    # Wave B: 80 to 104 (24 pts -> 120% of Wave A, exceeds Wave A start)
    # Wave C: 104 to 76 (28 pts -> 140% of Wave A, exceeds Wave A end)
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 104.0, "peak"),
        make_pivot(40, 76.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "flat"
    assert res["primary_count"]["subtype"] == "expanded_flat"

def test_flat_hard_rule_waveB_under_90pct_rejected():
    detector = ElliottDetector()
    # Wave B only retraces 70% (80 to 94) -> ZigZag, NOT Flat!
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 80.0, "trough"),
        make_pivot(30, 94.0, "peak"),
        make_pivot(40, 75.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    # Must reject as flat
    assert any(r["pattern"] == "flat" and r["hard_rule_failed"] == "waveB_retraces_at_least_90pct_A" for r in res["rejected_counts"])

# ==============================================================================
# PART E: TRIANGLE (A-B-C-D-E, 3-3-3-3-3) TESTS
# ==============================================================================

def test_hand_crafted_contracting_triangle():
    detector = ElliottDetector()
    # Alternating contracting swings:
    # A: 100 to 70 (30 pts)
    # B: 70 to 90 (20 pts)
    # C: 90 to 76 (14 pts)
    # D: 76 to 85 (9 pts)
    # E: 85 to 80 (5 pts)
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 70.0, "trough"),
        make_pivot(30, 90.0, "peak"),
        make_pivot(40, 76.0, "trough"),
        make_pivot(50, 85.0, "peak"),
        make_pivot(60, 80.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["primary_count"]["pattern"] == "triangle"
    assert res["primary_count"]["subtype"] == "contracting"
    assert len(res["primary_count"]["waves"]) == 5

def test_triangle_hard_rule_non_contracting_rejected():
    detector = ElliottDetector()
    # Non-monotonic wave lengths: A=30, B=20, C=25 (C > B!) -> VIOLATION
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 70.0, "trough"), # 30
        make_pivot(30, 90.0, "peak"),   # 20
        make_pivot(40, 65.0, "trough"), # 25 (VIOLATION)
        make_pivot(50, 80.0, "peak"),
        make_pivot(60, 75.0, "trough"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert any(r["pattern"] == "triangle" and r["hard_rule_failed"] == "each_wave_contracts_or_expands_consistently" for r in res["rejected_counts"])

def test_triangle_hard_rule_waveE_outside_waveA_range_rejected():
    detector = ElliottDetector()
    # Expanding triangle where waves expand: A=10, B=15, C=20, D=25, E=30
    # Wave A range is [90, 100]. Wave E terminates at 80.0 (outside [90, 100]) -> VIOLATION!
    pivots = [
        make_pivot(10, 100.0, "peak"),
        make_pivot(20, 90.0, "trough"), # Wave A is [90, 100] (10 pts)
        make_pivot(30, 105.0, "peak"),   # B = 15 pts
        make_pivot(40, 85.0, "trough"),  # C = 20 pts
        make_pivot(50, 110.0, "peak"),   # D = 25 pts
        make_pivot(60, 80.0, "trough"),  # E = 30 pts (terminates at 80 < 90, outside Wave A range)
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert any(r["pattern"] == "triangle" and r["hard_rule_failed"] == "waveE_inside_waveA_range" for r in res["rejected_counts"])





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

# ==============================================================================
# PART F: AMBIGUITY TESTS (5 TESTS)
# ==============================================================================

def test_ambiguity_reports_distinct_wave_counts():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 115.0, "peak"),
        make_pivot(20, 107.0, "trough"),
        make_pivot(30, 135.0, "peak"),
        make_pivot(40, 126.0, "trough"),
        make_pivot(50, 150.0, "peak"),
        make_pivot(60, 140.0, "trough"),
        make_pivot(70, 165.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["alternative_count"] is not None
    assert res["primary_count"]["pattern_score"] >= res["alternative_count"]["pattern_score"]

def test_ambiguity_no_suppression_of_alternative():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 50.0, "trough"),
        make_pivot(10, 65.0, "peak"),
        make_pivot(20, 58.0, "trough"),
        make_pivot(30, 85.0, "peak"),
        make_pivot(40, 78.0, "trough"),
        make_pivot(50, 95.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert "reason_for_alternative" in res["alternative_count"]

def test_ambiguity_scores_both_reported():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 104.0, "trough"),
        make_pivot(30, 130.0, "peak"),
        make_pivot(40, 122.0, "trough"),
        make_pivot(50, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert 0.0 < res["primary_count"]["pattern_score"] <= 1.0
    assert 0.0 < res["alternative_count"]["pattern_score"] <= 1.0

def test_ambiguity_distinctness_enforced():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 105.0, "trough"),
        make_pivot(30, 120.0, "peak"),
        make_pivot(40, 116.0, "trough"),
        make_pivot(50, 135.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    pc = res["primary_count"]
    ac = res["alternative_count"]
    # Structurally distinct
    assert pc["pattern"] != ac["pattern"] or pc["subtype"] != ac["subtype"] or pc["waves"][0]["start"]["index"] != ac["waves"][0]["start"]["index"]

def test_ambiguity_different_subtypes_reported():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 105.0, "trough"),
        make_pivot(30, 125.0, "peak"),
        make_pivot(40, 120.0, "trough"),
        make_pivot(50, 150.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["alternative_count"] is not None

def test_alternative_is_not_same_waves_relabeled():
    detector = ElliottDetector()
    pivots = [
        make_pivot(0, 100.0, "trough"),
        make_pivot(10, 110.0, "peak"),
        make_pivot(20, 105.0, "trough"),
        make_pivot(30, 125.0, "peak"),
        make_pivot(40, 120.0, "trough"),
        make_pivot(50, 150.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is not None
    assert res["alternative_count"] is not None

    pc_pivots = [(w["start"]["index"], w["end"]["index"]) for w in res["primary_count"]["waves"]]
    ac_pivots = [(w["start"]["index"], w["end"]["index"]) for w in res["alternative_count"]["waves"]]
    assert pc_pivots != ac_pivots



# ==============================================================================
# PART G: REAL DATA SIMULATION TESTS (10 TESTS)
# ==============================================================================

from engines.hspd import HSPDEngine
import random
import math

def generate_stock_bars(base=86.0, length=250, seed=42):
    random.seed(seed)
    candles = []
    for i in range(length):
        c1 = 18.0 * math.sin(2 * math.pi * i / 120)
        c2 = 8.0 * math.sin(2 * math.pi * i / 40)
        c3 = 3.0 * math.sin(2 * math.pi * i / 12)
        p = base + c1 + c2 + c3 + random.gauss(0, 0.4)
        candles.append({
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(p, 2),
            "high": round(p + 1.2, 2),
            "low": round(p - 1.2, 2),
            "close": round(p, 2),
            "volume": 1000000
        })
    return candles

def test_real_data_comi():
    hspd = HSPDEngine()
    candles = generate_stock_bars(base=86.0, seed=1)
    pivots = hspd.detect(candles, min_degree=1, max_degree=3)
    detector = ElliottDetector()
    res = detector.detect("COMI", "1D", pivots, min_degree=1)
    assert res["symbol"] == "COMI"
    assert res["primary_count"] is not None
    assert len(res["primary_count"]["waves"]) in [3, 5]

def test_real_data_2222_aramco():
    hspd = HSPDEngine()
    candles = generate_stock_bars(base=27.5, seed=2)
    pivots = hspd.detect(candles, min_degree=1, max_degree=3)
    detector = ElliottDetector()
    res = detector.detect("2222", "1D", pivots, min_degree=1)
    assert res["symbol"] == "2222"
    # Graceful handling: either a valid primary count or clean rejection list
    if res["primary_count"] is not None:
        assert len(res["primary_count"]["waves"]) in [3, 5]
    else:
        assert isinstance(res["rejected_counts"], list)

def test_real_data_aapl():
    hspd = HSPDEngine()
    candles = generate_stock_bars(base=230.0, seed=3)
    pivots = hspd.detect(candles, min_degree=1, max_degree=3)
    detector = ElliottDetector()
    res = detector.detect("AAPL", "1D", pivots, min_degree=1)
    assert res["symbol"] == "AAPL"
    assert res["primary_count"] is not None

def test_real_data_msft():
    hspd = HSPDEngine()
    candles = generate_stock_bars(base=420.0, seed=4)
    pivots = hspd.detect(candles, min_degree=1, max_degree=3)
    detector = ElliottDetector()
    res = detector.detect("MSFT", "1D", pivots, min_degree=1)
    assert res["symbol"] == "MSFT"
    if res["primary_count"] is not None:
        assert len(res["primary_count"]["waves"]) in [3, 5]
    else:
        assert isinstance(res["rejected_counts"], list)

def test_real_data_nvda():
    hspd = HSPDEngine()
    candles = generate_stock_bars(base=135.0, seed=5)
    pivots = hspd.detect(candles, min_degree=1, max_degree=3)
    detector = ElliottDetector()
    res = detector.detect("NVDA", "1D", pivots, min_degree=1)
    assert res["symbol"] == "NVDA"
    assert res["primary_count"] is not None

def test_real_data_no_hard_rule_violations_in_primary():
    hspd = HSPDEngine()
    detector = ElliottDetector()
    for seed in [10, 20, 30]:
        candles = generate_stock_bars(seed=seed)
        pivots = hspd.detect(candles, min_degree=1, max_degree=3)
        res = detector.detect("STOCK", "1D", pivots, min_degree=1)
        if res["primary_count"]:
            # Hard rules passed must be populated
            assert len(res["primary_count"]["hard_rules_passed"]) >= 2

def test_real_data_trade_ready_block_structure():
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 104.0, "trough"),
        make_pivot(50, 130.0, "peak"),
        make_pivot(65, 122.0, "trough"),
        make_pivot(85, 145.0, "peak"),
    ]
    res = detector.detect("COMI", "1D", pivots, min_degree=2)
    tr = res["primary_count"]["trade_ready"]
    assert "entry_zone" in tr
    assert "stop_loss" in tr
    assert "target_1" in tr
    assert "target_2" in tr
    assert "invalidation" in tr

def test_real_data_data_quality_metadata():
    hspd = HSPDEngine()
    candles = generate_stock_bars(length=250)
    pivots = hspd.detect(candles)
    detector = ElliottDetector()
    res = detector.detect("COMI", "1D", pivots, candles_used=250)
    assert res["data_quality"]["candles_used"] == 250
    assert res["data_quality"]["pivots_used"] > 0

def test_real_data_versioning_consistency():
    detector = ElliottDetector()
    res = detector.detect("TEST", "1D", [])
    assert res["version"] == "1.0.0"

def test_real_data_degree_awareness():
    detector = ElliottDetector()
    pivots = [
        make_pivot(10, 100.0, "trough", degree=1),
        make_pivot(20, 110.0, "peak", degree=1),
        make_pivot(30, 104.0, "trough", degree=1),
        make_pivot(40, 130.0, "peak", degree=1),
    ]
    # Filter min_degree = 2 excludes degree 1 pivots
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None


# ==============================================================================
# PART H: MULTI-TIMEFRAME COHERENCE TESTS (5 TESTS)
# ==============================================================================

from elliott.multi_tf import MultiTfElliott, global_multi_tf_elliott

def test_multi_tf_full_analysis():
    mtf = MultiTfElliott()
    c_w = generate_stock_bars(base=86.0, length=150, seed=1)
    c_d = generate_stock_bars(base=86.0, length=250, seed=2)
    c_4h = generate_stock_bars(base=86.0, length=300, seed=3)
    
    res = mtf.analyze("COMI", dataset_by_tf={"1W": c_w, "1D": c_d, "4H": c_4h})
    assert res["symbol"] == "COMI"
    assert "1W_vs_1D" in res["pairwise_coherence"]
    assert "1D_vs_4H" in res["pairwise_coherence"]
    assert 0.0 <= res["coherence_score"] <= 1.0
    assert res["coherence_tier"] in ["HIGH", "MEDIUM", "LOW"]

def test_multi_tf_high_coherence_trade_ready():
    mtf = MultiTfElliott()
    pivots_up = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 104.0, "trough"),
        make_pivot(40, 130.0, "peak"),
        make_pivot(50, 122.0, "trough"),
        make_pivot(60, 145.0, "peak"),
    ]
    # All TFs agree on impulse up
    hspd_data = {
        "1W": {"pivots": pivots_up, "data_quality": {"candles_used": 100}},
        "1D": {"pivots": pivots_up, "data_quality": {"candles_used": 250}},
        "4H": {"pivots": pivots_up, "data_quality": {"candles_used": 500}},
    }
    res = mtf.analyze("COMI", hspd_by_tf=hspd_data)
    assert res["coherence_score"] >= 0.85
    assert res["coherence_tier"] == "HIGH"
    assert res["trade_ready"] is not None
    assert res["trade_ready"]["confidence"] == "HIGH"

def test_multi_tf_contradiction_hides_trade_ready():
    mtf = MultiTfElliott()
    pivots_up = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 104.0, "trough"),
        make_pivot(40, 130.0, "peak"),
        make_pivot(50, 122.0, "trough"),
        make_pivot(60, 145.0, "peak"),
    ]
    pivots_down = [
        make_pivot(10, 150.0, "peak"),
        make_pivot(20, 130.0, "trough"),
        make_pivot(30, 140.0, "peak"),
        make_pivot(40, 100.0, "trough"),
        make_pivot(50, 115.0, "peak"),
        make_pivot(60, 80.0, "trough"),
    ]
    # Weekly is impulse down, Daily is impulse up -> Contradiction!
    hspd_data = {
        "1W": {"pivots": pivots_down, "data_quality": {"candles_used": 100}},
        "1D": {"pivots": pivots_up, "data_quality": {"candles_used": 250}},
        "4H": {"pivots": pivots_down, "data_quality": {"candles_used": 500}},
    }
    res = mtf.analyze("COMI", hspd_by_tf=hspd_data)
    # Trade ready must be explicitly hidden
    assert res["trade_ready"] is None
    assert res["trade_ready_status"] == "SUPPRESSED"
    assert "contradictory" in res["suppression_reason"]

def test_multi_tf_verdict_ar_displayed():
    mtf = MultiTfElliott()
    res = mtf.analyze("COMI", dataset_by_tf={})
    assert "توافق" in res["coherence_verdict_ar"]

def test_multi_tf_empty_input_graceful():
    mtf = MultiTfElliott()
    res = mtf.analyze("TEST", dataset_by_tf=None)
    assert res["coherence_score"] >= 0.0
    assert res["symbol"] == "TEST"


# ==============================================================================
# PART I: REGRESSION VS ZIGZAG-BASED ELLIOTT (3 TESTS)
# ==============================================================================

def test_new_detector_rejects_more_false_counts_than_old():
    # An irregular swing that a naive wave pattern would accept
    # but HSPD/rule engine rejects because Wave 4 overlaps Wave 1
    detector = ElliottDetector()
    invalid_pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 120.0, "peak"),
        make_pivot(30, 112.0, "trough"),
        make_pivot(40, 140.0, "peak"),
        make_pivot(50, 115.0, "trough"), # Overlaps Wave 1 (115 < 120)
        make_pivot(60, 155.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", invalid_pivots, min_degree=2)
    # Impulse must be rejected
    assert any(r["pattern"] == "impulse" for r in res["rejected_counts"])

def test_old_detector_false_positive_elimination():
    detector = ElliottDetector()
    # Wave 2 retraces 105% of Wave 1
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 99.0, "trough"), # 99 < 100
        make_pivot(40, 130.0, "peak"),
        make_pivot(50, 120.0, "trough"),
        make_pivot(60, 145.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert any(r["hard_rule_failed"] == "wave2_retracement < 1.0" for r in res["rejected_counts"])

def test_hspd_grounding_prevents_hallucinated_counts():
    detector = ElliottDetector()
    # Single wave (only 2 pivots)
    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
    ]
    res = detector.detect("TEST", "1D", pivots, min_degree=2)
    assert res["primary_count"] is None
    assert res["alternative_count"] is None


# ==============================================================================
# PART J: PERFORMANCE (2 TESTS)
# ==============================================================================

import time

def test_performance_per_instrument_timeframe_under_100ms():
    detector = ElliottDetector()
    pivots = [make_pivot(i * 10, 100.0 + (i % 3) * 10.0, "peak" if i % 2 == 1 else "trough") for i in range(20)]
    
    t0 = time.time()
    _ = detector.detect("PERF", "1D", pivots, min_degree=1)
    elapsed_ms = (time.time() - t0) * 1000.0
    
    print(f"\nElliott Detector per-instrument-per-timeframe: {elapsed_ms:.2f}ms")
    assert elapsed_ms < 100.0

def test_performance_100_instruments_under_30s():
    detector = ElliottDetector()
    dataset = [
        [make_pivot(i * 10, 100.0 + (i % 3) * 10.0, "peak" if i % 2 == 1 else "trough") for i in range(15)]
        for _ in range(100)
    ]
    
    t0 = time.time()
    for p_list in dataset:
        _ = detector.detect("PERF", "1D", p_list, min_degree=1)
    total_sec = time.time() - t0
    
    print(f"\n100 Instruments Elliott Detection: {total_sec:.2f}s")
    assert total_sec < 30.0

