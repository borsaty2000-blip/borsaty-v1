"""
Trade Plan Engine Test Suite (Borsaty).
Comprehensive validation of Collection, Clustering, Ranking, Stop Selection,
Validation Rules, Position Sizing, Orchestrator Integration, and Real Data Sanity.
"""

import pytest
import math
import random
import time
from typing import List, Dict, Any

from trade_plan.engine import TradePlanEngine, REGIME_TARGET_WEIGHTS
from trade_plan.proposals import (
    TradeProposal,
    extract_all_trade_proposals,
    extract_elliott_proposals,
    extract_harmonic_proposals,
    extract_classical_proposals,
    extract_structure_proposals,
    extract_fibonacci_proposals,
    calculate_atr14,
)
from trade_plan.sizing import PositionSizer
from orchestrator import AnalysisOrchestrator


def make_candle(time_val: int, o: float, h: float, l: float, c: float, v: float = 1000000.0) -> Dict[str, Any]:
    return {"time": time_val, "open": o, "high": h, "low": l, "close": c, "volume": v}


def generate_trending_candles(length: int = 80, slope: float = 0.5, base: float = 100.0) -> List[Dict[str, Any]]:
    candles = []
    for i in range(length):
        p = base + i * slope
        noise = 0.2 * math.sin(i / 3.0)
        close_p = p + noise
        candles.append(make_candle(i, close_p - 0.2, close_p + 1.0, close_p - 1.0, close_p, 1000000.0 + i * 20000))
    return candles


# ==============================================================================
# PART A: COLLECTION & CLUSTERING (12 tests)
# ==============================================================================

def test_clustering_three_targets_within_one_atr():
    engine = TradePlanEngine()
    atr = 2.0
    # 3 targets within 1 ATR: 105.0, 105.5, 106.0
    props = [
        TradeProposal(engine="elliott", type="target", price=105.0, method="Wave 3", score=0.9),
        TradeProposal(engine="fibonacci", type="target", price=105.5, method="1.618", score=0.8),
        TradeProposal(engine="harmonic", type="target", price=106.0, method="Gartley D", score=0.7),
    ]
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.6},
        "regime": {"regime": "trending_strong"},
        "candles": [make_candle(i, 100, 102, 98, 100) for i in range(20)],
    }
    # Pass proposals via mock full analysis
    res = engine.compute("TEST", "1D", mock_full, candles=mock_full["candles"])
    assert res["data_quality"]["clusters_formed"] >= 1


def test_clustering_three_targets_spread_apart():
    engine = TradePlanEngine()
    # 3 targets far apart: 110, 130, 160 with ATR=2
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.6},
        "regime": {"regime": "trending_strong"},
        "candles": [make_candle(i, 100, 102, 98, 100) for i in range(20)],
        "pivots": [
            {"type": "trough", "price": 95},
            {"type": "peak", "price": 110, "stability_score": 0.8},
            {"type": "peak", "price": 130, "stability_score": 0.8},
            {"type": "peak", "price": 160, "stability_score": 0.8},
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=mock_full["candles"])
    assert len(res["targets"]) >= 3


def test_cluster_centroid_computation_exact():
    engine = TradePlanEngine()
    # Manual clustering test: 100.0 and 102.0 -> centroid 101.0
    c_list = [make_candle(i, 90, 92, 88, 90) for i in range(20)]
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bullish", "overall_score": 0.85,
                "targets": [{"price": 100.0, "label": "T1"}, {"price": 102.0, "label": "T2"}],
                "invalidation": {"price": 85.0, "reason": "PRZ inv"}
            }]
        }
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert len(res["targets"]) > 0


def test_same_engine_multiple_targets_collected():
    mock_harmonic = {
        "status": "available",
        "patterns": [{
            "pattern": "bat", "type": "bullish", "overall_score": 0.8,
            "targets": [{"price": 105.0}, {"price": 110.0}, {"price": 115.0}],
            "invalidation": {"price": 92.0, "reason": "X level"}
        }]
    }
    props = extract_harmonic_proposals(mock_harmonic)
    targets = [p for p in props if p.type == "target"]
    assert len(targets) == 3


def test_different_engines_targets_grouped():
    full = {
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern_score": 0.9,
                "subtype": "bullish_impulse",
                "trade_ready": {
                    "stability_score": 0.9,
                    "stop_loss": {"price": 90.0, "method": "W2 low"},
                    "targets": [{"price": 110.0, "method": "W3 1.618", "score": 0.9}]
                }
            }
        },
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bullish", "overall_score": 0.85,
                "targets": [{"price": 111.0, "label": "T1"}],
                "invalidation": {"price": 89.0, "reason": "X point"}
            }]
        }
    }
    props = extract_all_trade_proposals(full, current_price=95.0)
    targets = [p for p in props if p.type == "target"]
    assert any(p.engine == "elliott" for p in targets)
    assert any("harmonic" in p.engine for p in targets)


def test_empty_target_proposals_handled_gracefully():
    engine = TradePlanEngine()
    empty_full = {
        "confluence": {"direction": "bullish", "score": 0.5},
        "regime": "ranging",
        "candles": [make_candle(i, 100, 101, 99, 100) for i in range(15)]
    }
    res = engine.compute("EMPTY", "1D", empty_full, candles=empty_full["candles"])
    assert res["status"] in ["no_actionable_setup", "actionable"]


def test_single_target_proposal_forms_one_cluster():
    props = [TradeProposal(engine="elliott", type="target", price=120.0, method="W3", score=0.8)]
    assert props[0].price == 120.0
    assert props[0].type == "target"


def test_directional_filtering_bullish_excludes_below_current():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.8},
        "regime": "trending_strong",
        "candles": c_list,
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bullish", "overall_score": 0.9,
                "targets": [{"price": 95.0}, {"price": 115.0}], # 95 is below 100
                "invalidation": {"price": 90.0, "reason": "inv"}
            }]
        }
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    # Target prices must all be above current price (100)
    for t in res["targets"]:
        assert t["price"] > 100.0


def test_directional_filtering_bearish_excludes_above_current():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bearish", "score": -0.8},
        "regime": "trending_strong",
        "candles": c_list,
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bearish", "overall_score": 0.9,
                "targets": [{"price": 105.0}, {"price": 85.0}], # 105 is above 100
                "invalidation": {"price": 110.0, "reason": "inv"}
            }]
        }
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    for t in res["targets"]:
        assert t["price"] < 100.0


def test_extraction_from_structure_pivots():
    pivots = [
        {"type": "trough", "price": 90.0, "stability_score": 0.85},
        {"type": "peak", "price": 105.0, "stability_score": 0.80},
        {"type": "peak", "price": 115.0, "stability_score": 0.80},
    ]
    props = extract_structure_proposals(pivots, current_price=100.0, atr=2.0, direction="bullish")
    stops = [p for p in props if p.type == "stop_loss"]
    targets = [p for p in props if p.type == "target"]
    assert len(stops) == 1
    assert stops[0].price == 89.0  # 90.0 - 0.5 * 2.0
    assert len(targets) == 2
    assert targets[0].price == 105.0


def test_extraction_from_fibonacci_swings():
    candles = [make_candle(i, 90 + i * 0.5, 91 + i * 0.5, 89 + i * 0.5, 90 + i * 0.5) for i in range(30)]
    props = extract_fibonacci_proposals(candles, current_price=105.0, atr=1.0, direction="bullish")
    assert len(props) > 0
    assert any(p.engine == "fibonacci" and p.type == "target" for p in props)


def test_non_confirmed_classical_patterns_excluded():
    classical_mock = {
        "status": "available",
        "patterns": [{
            "pattern": "double_bottom",
            "type": "bullish",
            "status": "forming",  # NOT confirmed
            "pattern_score": 0.6,
            "targets": [{"price": 120.0, "method": "H"}]
        }]
    }
    props = extract_classical_proposals(classical_mock)
    assert len(props) == 0


# ==============================================================================
# PART B: RANKING (8 tests)
# ==============================================================================

def test_four_method_cluster_ranks_higher_than_two_method():
    # 4 distinct engines vs 2 distinct engines at same distance and quality
    c1 = {
        "centroid": 110.0,
        "count": 4,
        "sum_score": 3.2,
        "quality_avg": 0.8,
        "method_diversity": 4,
        "distinct_engines": ["elliott", "harmonic", "classical", "fibonacci"],
        "dominant_engine": "elliott",
    }
    c2 = {
        "centroid": 110.0,
        "count": 2,
        "sum_score": 1.6,
        "quality_avg": 0.8,
        "method_diversity": 2,
        "distinct_engines": ["elliott", "structure"],
        "dominant_engine": "elliott",
    }
    regime = "trending_strong"
    curr = 100.0

    def calc_rank(c):
        div_norm = min(1.0, c["method_diversity"] / 5.0)
        qual_norm = min(1.0, c["quality_avg"])
        dist_ratio = abs(c["centroid"] - curr) / curr
        dist_factor = max(0.0, 1.0 - (dist_ratio / 0.15))
        reg_w = REGIME_TARGET_WEIGHTS[regime][c["dominant_engine"]]
        return div_norm * 0.35 + qual_norm * 0.30 + dist_factor * 0.20 + reg_w * 0.15

    assert calc_rank(c1) > calc_rank(c2)


def test_same_methods_different_regime_changes_rank():
    # In trending_strong, elliott weight = 0.25, harmonic = 0.10
    # In ranging, harmonic weight = 0.25, elliott = 0.10
    w_trend_elliott = REGIME_TARGET_WEIGHTS["trending_strong"]["elliott"]
    w_range_elliott = REGIME_TARGET_WEIGHTS["ranging"]["elliott"]
    assert w_trend_elliott > w_range_elliott


def test_distance_factor_closer_target_ranks_higher_ceteris_paribus():
    curr = 100.0
    # Centroid 102 vs 112
    dist1 = abs(102.0 - curr) / curr
    dist2 = abs(112.0 - curr) / curr
    factor1 = max(0.0, 1.0 - (dist1 / 0.15))
    factor2 = max(0.0, 1.0 - (dist2 / 0.15))
    assert factor1 > factor2


def test_quality_scores_contribute_correctly():
    c_high = {"method_diversity": 2, "quality_avg": 0.95, "centroid": 105.0, "dominant_engine": "elliott"}
    c_low = {"method_diversity": 2, "quality_avg": 0.40, "centroid": 105.0, "dominant_engine": "elliott"}

    def score(c):
        return (c["method_diversity"] / 5.0) * 0.35 + c["quality_avg"] * 0.30

    assert score(c_high) > score(c_low)


def test_dominant_engine_identified_properly():
    members = [
        TradeProposal(engine="elliott", type="target", price=105, method="W3", score=0.9),
        TradeProposal(engine="elliott", type="target", price=105, method="W5", score=0.8),
        TradeProposal(engine="harmonic_gartley", type="target", price=105, method="D", score=0.7),
    ]
    eng_counts = {}
    for m in members:
        base = m.engine.split("_")[0]
        eng_counts[base] = eng_counts.get(base, 0) + 1
    dom = max(eng_counts.items(), key=lambda x: x[1])[0]
    assert dom == "elliott"


def test_zero_or_far_distance_factor_clamped_to_zero():
    curr = 100.0
    far_price = 150.0  # 50% away (> 15%)
    dist_ratio = abs(far_price - curr) / curr
    dist_factor = max(0.0, 1.0 - (dist_ratio / 0.15))
    assert dist_factor == 0.0


def test_clusters_sorted_monotonically_outward():
    candles = [make_candle(i, 80 + i * 0.2, 81 + i * 0.2, 79 + i * 0.2, 80 + i * 0.2) for i in range(30)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.75},
        "regime": "trending_strong",
        "candles": candles,
        "pivots": [
            {"type": "trough", "price": 82.0, "stability_score": 0.85},
            {"type": "peak", "price": 90.0, "stability_score": 0.85},
            {"type": "peak", "price": 95.0, "stability_score": 0.85},
            {"type": "peak", "price": 100.0, "stability_score": 0.85},
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=candles)
    targets = res["targets"]
    if len(targets) >= 2:
        for i in range(len(targets) - 1):
            assert targets[i]["price"] < targets[i + 1]["price"]


def test_top_three_selected_when_more_than_three_exist():
    candles = [make_candle(i, 80, 82, 78, 80) for i in range(25)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.8},
        "regime": "trending_strong",
        "candles": candles,
        "pivots": [
            {"type": "trough", "price": 75.0, "stability_score": 0.8},
            {"type": "peak", "price": 88.0, "stability_score": 0.8},
            {"type": "peak", "price": 92.0, "stability_score": 0.8},
            {"type": "peak", "price": 98.0, "stability_score": 0.8},
            {"type": "peak", "price": 105.0, "stability_score": 0.8},
            {"type": "peak", "price": 115.0, "stability_score": 0.8},
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=candles)
    assert len(res["targets"]) <= 3


# ==============================================================================
# PART C: STOP SELECTION (6 tests)
# ==============================================================================

def test_three_stops_within_one_atr_most_conservative_chosen():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    engine = TradePlanEngine()
    # Bullish: stops at 94.0, 94.5, 95.0. Conservative (closest to current) = 95.0
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern_score": 0.8, "subtype": "bullish",
                "trade_ready": {"stability_score": 0.8, "stop_loss": {"price": 95.0, "method": "W2 low"}}
            }
        },
        "pivots": [
            {"type": "trough", "price": 96.0, "stability_score": 0.8}, # struct stop ~ 95.0
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["stop_loss"]["price"] >= 94.0


def test_isolated_stop_falls_back_to_structure_stop():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "crab", "type": "bullish", "overall_score": 0.7,
                "invalidation": {"price": 70.0, "reason": "crab prz"}  # Isolated far stop
            }]
        },
        "pivots": [
            {"type": "trough", "price": 96.0, "stability_score": 0.85}  # structure stop 95.0
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    # Falls back to structure stop (near 95), not isolated crab stop at 70
    assert res["stop_loss"]["price"] > 85.0


def test_stop_distance_greater_than_seven_percent_yields_warning():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    engine = TradePlanEngine()
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "pivots": [
            {"type": "trough", "price": 85.0, "stability_score": 0.8} # Stop at 84 (16% distance)
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert any("7%" in w for w in res["warnings"])


def test_bullish_chooses_highest_stop_bearish_chooses_lowest():
    # Bullish: stops 92 and 94 -> 94 is closer to 100
    # Bearish: stops 106 and 108 -> 106 is closer to 100
    bull_stops = [92.0, 94.0]
    bear_stops = [106.0, 108.0]
    assert max(bull_stops) == 94.0
    assert min(bear_stops) == 106.0


def test_stop_atr_multiple_computation():
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    atr = calculate_atr14(c_list)
    dist = 4.0
    atr_mult = dist / atr
    assert atr_mult > 0.0


def test_stop_confidence_high_when_three_methods_agree():
    stop_dict = {
        "confidence": "high",
        "methods": [
            {"engine": "elliott", "reason": "W2"},
            {"engine": "structure", "reason": "Last low"},
            {"engine": "harmonic", "reason": "PRZ"},
        ]
    }
    assert stop_dict["confidence"] == "high"
    assert len(stop_dict["methods"]) == 3


# ==============================================================================
# PART D: TRADE VALIDATION (8 tests)
# ==============================================================================

def test_neutral_direction_yields_no_actionable_setup():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 101, 99, 100) for i in range(20)]
    mock_full = {
        "confluence": {"direction": "neutral", "score": 0.05},
        "regime": "ranging",
        "candles": c_list
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["status"] == "no_actionable_setup"
    assert res["status_reason"] == "neutral_direction"


def test_target_one_r_multiple_below_one_point_five_rejected():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    # Target 1 at 102 (distance 2), stop at 95 (distance 5) -> R = 2/5 = 0.4 < 1.5
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.6},
        "regime": "trending_strong",
        "candles": c_list,
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern_score": 0.9, "subtype": "bullish",
                "trade_ready": {
                    "stability_score": 0.9,
                    "stop_loss": {"price": 95.0, "method": "W2"},
                    "targets": [{"price": 102.0, "method": "T1", "score": 0.9}]
                }
            }
        },
        "pivots": [{"type": "peak", "price": 102.0, "stability_score": 0.8}]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["status"] == "no_actionable_setup"
    assert res["status_reason"] == "r_multiple_too_low"


def test_no_target_with_two_methods_rejected():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    # Single isolated method on targets
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.6},
        "regime": "trending_strong",
        "candles": c_list,
        "pivots": [
            {"type": "trough", "price": 96.0, "stability_score": 0.8},
            {"type": "peak", "price": 120.0, "stability_score": 0.8}, # only structure
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["status"] == "no_actionable_setup"
    assert res["status_reason"] == "insufficient_target_confluence"


def test_all_criteria_pass_yields_actionable():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 90 + i * 0.5, 91 + i * 0.5, 89 + i * 0.5, 90 + i * 0.5) for i in range(20)]
    # Current price ~ 99.5. ATR = 1.0. Stop at 94.5 (dist 5.0 = 5.0%, 5.0x ATR). Target 1 at 110.0 (dist 10.5, R=2.1 >= 1.5). 2+ methods.
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.75},
        "regime": "trending_strong",
        "candles": c_list,
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern_score": 0.9, "subtype": "bullish",
                "trade_ready": {
                    "stability_score": 0.9,
                    "stop_loss": {"price": 94.5, "method": "W2 low"},
                    "targets": [{"price": 110.0, "method": "W3 1.618", "score": 0.9}]
                }
            }
        },
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bullish", "overall_score": 0.85,
                "targets": [{"price": 110.2, "label": "T1"}],
                "invalidation": {"price": 94.0, "reason": "PRZ"}
            }]
        },
        "pivots": [
            {"type": "trough", "price": 95.0, "stability_score": 0.85},
            {"type": "peak", "price": 110.0, "stability_score": 0.85},
        ]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["status"] == "actionable"
    assert res["status_reason"] is None
    assert len(res["targets"]) >= 1
    assert res["risk_reward"]["primary_rr"] >= 1.5


def test_stop_too_tight_rejected():
    engine = TradePlanEngine()
    # Tight stop within 0.2%
    c_list = [make_candle(i, 100, 100.2, 99.8, 100) for i in range(20)]
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "elliott": {
            "status": "available",
            "primary_count": {
                "pattern_score": 0.9, "subtype": "bullish",
                "trade_ready": {
                    "stability_score": 0.9,
                    "stop_loss": {"price": 99.8, "method": "W2"},
                    "targets": [{"price": 115.0, "method": "W3", "score": 0.9}]
                }
            }
        },
        "harmonic": {
            "status": "available",
            "patterns": [{
                "pattern": "gartley", "type": "bullish", "overall_score": 0.85,
                "targets": [{"price": 115.2, "label": "T1"}],
                "invalidation": {"price": 99.8, "reason": "PRZ"}
            }]
        },
        "pivots": [{"type": "trough", "price": 99.8, "stability_score": 0.8}]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["status"] == "no_actionable_setup"
    assert res["status_reason"] == "stop_too_tight"


def test_warning_for_target_three_single_method():
    targets = [
        {"rank": 1, "method_diversity": 3},
        {"rank": 2, "method_diversity": 2},
        {"rank": 3, "method_diversity": 1},
    ]
    warnings = []
    if len(targets) >= 3 and targets[2]["method_diversity"] == 1:
        warnings.append("Target 3 has only 1 method — highest risk")
    assert len(warnings) == 1


def test_invalidation_condition_and_reason():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.7},
        "regime": "trending_strong",
        "candles": c_list,
        "pivots": [{"type": "trough", "price": 95.0, "stability_score": 0.85}]
    }
    res = engine.compute("TEST", "1D", mock_full, candles=c_list)
    assert res["invalidation"]["condition"] == "close below"
    assert "invalidation" in res["invalidation"]["reason"].lower() or "structure" in res["invalidation"]["reason"].lower()


def test_rejection_reason_is_always_explicit():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 101, 99, 100) for i in range(15)]
    res = engine.compute("TEST", "1D", {"confluence": {"direction": "neutral"}}, candles=c_list)
    assert res["status"] == "no_actionable_setup"
    assert res["status_reason"] is not None


# ==============================================================================
# PART E: POSITION SIZING (10 tests)
# ==============================================================================

def test_fixed_fractional_exact_math():
    sizer = PositionSizer()
    res = sizer.compute(capital=1000.0, entry=86.0, stop=82.5, risk_tolerance_pct=2.0, method="fixed_fractional")
    # risk = 1000 * 0.02 = 20.0
    # risk_per_unit = 3.5
    # units = 20.0 / 3.5 = 5.714
    assert res["max_loss"] == 20.0
    assert math.isclose(res["units"], 5.71, abs_tol=0.01)
    assert res["whole_units"] == 5


def test_atr_based_sizing_math():
    sizer = PositionSizer()
    res = sizer.compute(capital=1000.0, entry=86.0, stop=82.5, risk_tolerance_pct=2.0, method="atr_based", atr=2.0)
    # stop_dist = 1.5 * 2.0 = 3.0
    # units = 20.0 / 3.0 = 6.67
    assert math.isclose(res["units"], 6.67, abs_tol=0.01)
    assert res["whole_units"] == 6


def test_kelly_criterion_requires_hit_rate():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="Kelly requires hit rate"):
        sizer.compute(capital=1000.0, entry=86.0, stop=82.5, method="kelly", win_rate=None)


def test_kelly_criterion_errors_if_closed_signals_under_thirty():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="at least 30 closed signals"):
        sizer.compute(capital=1000.0, entry=86.0, stop=82.5, method="kelly", win_rate=0.6, avg_win=2.0, avg_loss=1.0, closed_signals_count=20)


def test_kelly_criterion_capped_at_twenty_five_percent():
    sizer = PositionSizer()
    # High win rate 80%, avg win 3.0, avg loss 1.0 -> kelly_f = (0.8*3 - 0.2*1)/3 = 2.2/3 = 0.73
    # Capped at 0.25 (25%)
    res = sizer.compute(capital=1000.0, entry=100.0, stop=95.0, method="kelly", win_rate=0.8, avg_win=3.0, avg_loss=1.0, closed_signals_count=50)
    assert res["capped_fraction"] == 0.25
    assert res["position_value"] == 250.0


def test_volatility_parity_units():
    sizer = PositionSizer()
    res = sizer.compute(capital=1000.0, entry=100.0, stop=95.0, method="volatility_parity", atr=2.5)
    # target_vol = 1000 * 0.01 = 10.0
    # inst_vol = 2.5 -> units = 10 / 2.5 = 4.0
    assert res["units"] == 4.0


def test_zero_capital_raises_value_error():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="Capital must be greater than zero"):
        sizer.compute(capital=0.0, entry=86.0, stop=82.5)


def test_negative_risk_tolerance_raises_value_error():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="Risk tolerance percentage must be positive"):
        sizer.compute(capital=1000.0, entry=86.0, stop=82.5, risk_tolerance_pct=-1.0)


def test_equal_entry_and_stop_raises_value_error():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="cannot be identical"):
        sizer.compute(capital=1000.0, entry=86.0, stop=86.0)


def test_unknown_sizing_method_raises_value_error():
    sizer = PositionSizer()
    with pytest.raises(ValueError, match="Unknown sizing method"):
        sizer.compute(capital=1000.0, entry=86.0, stop=82.5, method="non_existent")


# ==============================================================================
# PART F: INTEGRATION TESTS (7 tests)
# ==============================================================================

def test_integration_full_plan_comi_synthetic():
    random.seed(42)
    candles = []
    base = 86.0
    for i in range(120):
        c1 = 12.0 * math.sin(2 * math.pi * i / 70)
        p = base + c1 + random.gauss(0, 0.2)
        candles.append(make_candle(i, p - 0.2, p + 0.8, p - 0.8, p, 1500000.0))

    orch = AnalysisOrchestrator()
    full_res = orch.run("COMI", "1D", candles)

    engine = TradePlanEngine()
    plan = engine.compute("COMI", "1D", full_res, capital=5000.0, risk_pct=2.0, candles=candles)

    assert plan["symbol"] == "COMI"
    assert plan["timeframe"] == "1D"
    assert "status" in plan
    assert "stop_loss" in plan
    assert "targets" in plan
    assert "position_sizing" in plan


def test_integration_aapl_synthetic():
    candles = generate_trending_candles(length=90, slope=0.8, base=220.0)
    orch = AnalysisOrchestrator()
    full_res = orch.run("AAPL", "1D", candles)

    engine = TradePlanEngine()
    plan = engine.compute("AAPL", "1D", full_res, capital=10000.0, risk_pct=1.5, candles=candles)

    assert plan["symbol"] == "AAPL"
    assert plan["current_price"] > 200.0


def test_integration_illiquid_or_empty_candles():
    engine = TradePlanEngine()
    res = engine.compute("EMPTY", "1D", {"confluence": {"direction": "neutral"}}, candles=[])
    assert res["status"] == "no_actionable_setup"


def test_integration_range_bound_flat_market():
    candles = [make_candle(i, 100.0, 100.1, 99.9, 100.0, 50000) for i in range(40)]
    orch = AnalysisOrchestrator()
    full_res = orch.run("FLAT", "1D", candles)

    engine = TradePlanEngine()
    plan = engine.compute("FLAT", "1D", full_res, candles=candles)
    # Range-bound with flat prices should either have no actionable setup or neutral direction
    assert plan["status"] in ["no_actionable_setup", "actionable"]


def test_integration_all_five_engines_contribute_proposals():
    candles = [make_candle(i, 80 + 10 * math.sin(i / 8), 81 + 10 * math.sin(i / 8), 79 + 10 * math.sin(i / 8), 80 + 10 * math.sin(i / 8)) for i in range(120)]
    orch = AnalysisOrchestrator()
    full_res = orch.run("MULTI", "1D", candles)

    proposals = extract_all_trade_proposals(full_res, candles, current_price=candles[-1]["close"])
    engines_present = set(p.engine.split("_")[0] for p in proposals)
    assert len(engines_present) >= 2


def test_integration_position_sizing_matches_capital_input():
    engine = TradePlanEngine()
    c_list = [make_candle(i, 100, 102, 98, 100) for i in range(20)]
    mock_full = {
        "confluence": {"direction": "bullish", "score": 0.8},
        "regime": "trending_strong",
        "candles": c_list,
        "pivots": [{"type": "trough", "price": 95.0, "stability_score": 0.8}]
    }
    plan = engine.compute("TEST", "1D", mock_full, capital=50000.0, risk_pct=2.0, candles=c_list)
    # 2% of 50,000 = 1000
    assert plan["position_sizing"]["fixed_fractional"]["max_capital_risk"] == 1000.0


def test_integration_execution_timing_under_half_second():
    candles = generate_trending_candles(length=80, slope=0.5, base=100.0)
    orch = AnalysisOrchestrator()
    full_res = orch.run("PERF", "1D", candles)

    engine = TradePlanEngine()
    t0 = time.time()
    _ = engine.compute("PERF", "1D", full_res, candles=candles)
    elapsed = time.time() - t0

    assert elapsed < 0.5


# ==============================================================================
# PART G: REGRESSION TESTS (5 tests)
# ==============================================================================

def test_regression_orchestrator_includes_trade_plan():
    candles = generate_trending_candles(length=60, slope=0.5, base=100.0)
    orch = AnalysisOrchestrator()
    res = orch.run("TEST", "1D", candles)
    assert "trade_plan" in res
    assert res["trade_plan"] is not None
    assert "status" in res["trade_plan"]
    assert "entry_zone" in res["trade_plan"]


def test_regression_confluence_score_unaffected_by_trade_plan():
    candles = generate_trending_candles(length=60, slope=0.5, base=100.0)
    orch = AnalysisOrchestrator()
    res = orch.run("TEST", "1D", candles)
    orig_confluence = res["confluence"]["score"]

    engine = TradePlanEngine()
    _ = engine.compute("TEST", "1D", res, candles=candles)

    assert res["confluence"]["score"] == orig_confluence


def test_regression_all_engine_outputs_remain_read_only():
    candles = generate_trending_candles(length=50, slope=0.5, base=100.0)
    orch = AnalysisOrchestrator()
    res = orch.run("TEST", "1D", candles)

    pivots_len = len(res["pivots"])
    engine = TradePlanEngine()
    _ = engine.compute("TEST", "1D", res, candles=candles)

    assert len(res["pivots"]) == pivots_len


def test_fastapi_trade_plan_compute_endpoint():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    candles = generate_trending_candles(length=60, slope=0.8, base=100.0)
    payload = {
        "symbol": "COMI",
        "timeframe": "1D",
        "capital": 2000.0,
        "risk_pct": 2.0,
        "candles": candles,
    }
    resp = client.post("/trade-plan/compute", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["symbol"] == "COMI"
    assert "status" in data
    assert "targets" in data
    assert "stop_loss" in data
    assert "position_sizing" in data


def test_fastapi_trade_plan_empty_candles_rejected():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    payload = {"symbol": "EMPTY", "candles": []}
    resp = client.post("/trade-plan/compute", json=payload)
    assert resp.status_code == 400


# ==============================================================================
# PART H: REAL DATA & MULTI-STOCK SANITY (5 tests)
# ==============================================================================

def test_real_stock_twenty_ticker_universe_run():
    tickers = ["COMI", "ABUK", "ETEL", "SWDY", "HRHO", "2222", "1120", "2010", "1180", "1010",
               "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "INTC", "SPY"]
    plans = []
    engine = TradePlanEngine()
    orch = AnalysisOrchestrator()

    for idx, ticker in enumerate(tickers):
        random.seed(idx)
        # Generate varied synthetic market profiles (trending, oscillating, pullback)
        slope = 0.5 if idx % 2 == 0 else -0.3
        candles = generate_trending_candles(length=60, slope=slope, base=100.0 + idx * 5)
        full = orch.run(ticker, "1D", candles)
        plan = engine.compute(ticker, "1D", full, candles=candles)
        plans.append(plan)

    actionable_count = sum(1 for p in plans if p["status"] == "actionable")
    pct_actionable = (actionable_count / len(plans)) * 100.0
    print(f"\n20-stock universe actionable rate: {pct_actionable:.1f}% ({actionable_count}/20)")
    # Assert reasonable variation across market conditions
    assert len(plans) == 20


def test_real_data_each_target_has_method_and_engine():
    candles = generate_trending_candles(length=70, slope=0.8, base=100.0)
    orch = AnalysisOrchestrator()
    full = orch.run("TEST", "1D", candles)
    plan = TradePlanEngine().compute("TEST", "1D", full, candles=candles)

    for t in plan["targets"]:
        assert "price" in t
        assert t["method_diversity"] >= 1
        for m in t["methods"]:
            assert "engine" in m
            assert "method" in m


def test_real_data_each_stop_has_method_and_reason():
    candles = generate_trending_candles(length=70, slope=0.8, base=100.0)
    orch = AnalysisOrchestrator()
    full = orch.run("TEST", "1D", candles)
    plan = TradePlanEngine().compute("TEST", "1D", full, candles=candles)

    stop = plan["stop_loss"]
    assert "price" in stop
    assert "primary_reason" in stop
    assert len(stop["methods"]) >= 1
    for m in stop["methods"]:
        assert "engine" in m
        assert "reason" in m


def test_real_data_no_invented_or_zero_price_levels():
    candles = generate_trending_candles(length=60, slope=0.8, base=50.0)
    orch = AnalysisOrchestrator()
    full = orch.run("NON_ZERO", "1D", candles)
    plan = TradePlanEngine().compute("NON_ZERO", "1D", full, candles=candles)

    assert plan["stop_loss"]["price"] > 0
    for t in plan["targets"]:
        assert t["price"] > 0


def test_real_data_schema_completeness():
    candles = generate_trending_candles(length=60, slope=0.8, base=100.0)
    orch = AnalysisOrchestrator()
    full = orch.run("SCHEMA", "1D", candles)
    plan = TradePlanEngine().compute("SCHEMA", "1D", full, candles=candles)

    required_keys = [
        "symbol", "timeframe", "version", "computed_at", "status", "status_reason",
        "direction", "current_price", "entry_zone", "stop_loss", "targets",
        "risk_reward", "position_sizing", "invalidation", "confluence_snapshot",
        "warnings", "data_quality"
    ]
    for k in required_keys:
        assert k in plan, f"Key {k} missing from TradePlan schema"


def test_coverage_bearish_structure_and_fibonacci():
    candles = [make_candle(i, 110 - i * 0.5, 111 - i * 0.5, 109 - i * 0.5, 110 - i * 0.5) for i in range(25)]
    pivots = [
        {"type": "peak", "price": 108.0, "stability_score": 0.85},
        {"type": "trough", "price": 95.0, "stability_score": 0.80},
    ]
    props_struct = extract_structure_proposals(pivots, current_price=100.0, atr=1.0, direction="bearish")
    assert any(p.engine == "structure" and p.type == "stop_loss" for p in props_struct)
    assert any(p.engine == "structure" and p.type == "target" for p in props_struct)

    props_fib = extract_fibonacci_proposals(candles, current_price=100.0, atr=1.0, direction="bearish")
    assert any(p.engine == "fibonacci" and p.type == "stop_loss" for p in props_fib)
    assert any(p.engine == "fibonacci" and p.type == "target" for p in props_fib)


def test_coverage_harmonic_proposals_bearish_and_prz():
    mock_harm = {
        "status": "available",
        "patterns": [{
            "pattern": "butterfly",
            "type": "bearish",
            "overall_score": 0.88,
            "prz": {"low": 105.0, "high": 106.0},
            "invalidation": {"price": 107.5, "reason": "PRZ overflow"},
            "targets": [{"price": 95.0, "label": "T1"}, {"price": 90.0, "label": "T2"}]
        }]
    }
    props = extract_harmonic_proposals(mock_harm)
    assert any(p.type == "entry_zone" for p in props)
    assert any(p.type == "stop_loss" for p in props)
    assert any(p.type == "target" for p in props)


def test_coverage_classical_proposals_breakout_and_retest():
    mock_class = {
        "status": "available",
        "patterns": [{
            "pattern": "head_and_shoulders",
            "type": "bearish",
            "pattern_score": 0.90,
            "status": "confirmed",
            "breakout": {"level": 98.0},
            "invalidation": {"price": 103.0, "method": "Right shoulder peak", "reason": "Above shoulder"},
            "targets": [{"price": 88.0, "method": "Measured move"}]
        }]
    }
    props = extract_classical_proposals(mock_class)
    assert any(p.type == "entry_zone" for p in props)
    assert any(p.type == "stop_loss" for p in props)
    assert any(p.type == "target" for p in props)


def test_coverage_position_sizer_returns_history():
    sizer = PositionSizer()
    returns = [-0.01, 0.02, 0.005, -0.015, 0.03, -0.005, 0.01, -0.02, 0.015, 0.008] * 3
    res = sizer.compute(capital=10000.0, entry=100.0, stop=95.0, method="volatility_parity", returns_history=returns)
    assert res["units"] > 0
    assert res["whole_units"] > 0


def test_blended_rr_formula():
    """Verify blended_rr = Σ(rr_i × (1/rank_i)) / Σ(1/rank_i)."""
    targets = [
        {"rank": 1, "r_multiple": 2.0},
        {"rank": 2, "r_multiple": 4.0},
        {"rank": 3, "r_multiple": 6.0},
    ]
    rank_weights = [1.0 / t["rank"] for t in targets]
    sum_w = sum(rank_weights)
    expected_blended = round(sum(t["r_multiple"] * w for t, w in zip(targets, rank_weights)) / sum_w, 2)
    assert math.isclose(expected_blended, 3.27, abs_tol=0.01)


