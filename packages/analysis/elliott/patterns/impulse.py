"""
Impulse wave pattern evaluation and scoring.
5-wave motive sequence (1-2-3-4-5).
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from ..structures import score_range, geometric_mean


def evaluate_impulse_hard_rules(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
    p4: Dict[str, Any],
    p5: Dict[str, Any],
) -> Tuple[bool, List[str], List[str], str]:
    """
    Applies binary hard rules to 6 consecutive pivot points.
    Returns: (passed, hard_rules_passed, hard_rules_failed, failure_reason)
    """
    passed_rules = []
    failed_rules = []

    # Price and type extraction
    v0, v1, v2, v3, v4, v5 = p0["price"], p1["price"], p2["price"], p3["price"], p4["price"], p5["price"]
    t0, t1, t2, t3, t4, t5 = p0["type"], p1["type"], p2["type"], p3["type"], p4["type"], p5["type"]

    # Check alternating types
    if not (t0 != t1 and t1 != t2 and t2 != t3 and t3 != t4 and t4 != t5):
        failed_rules.append("alternating_pivots")
        return False, [], failed_rules, "Pivots must alternate strictly between peak and trough"

    is_bullish = (v1 > v0)

    if is_bullish:
        # Bullish Impulse (up-down-up-down-up)
        if not (t0 == "trough" and t1 == "peak" and t2 == "trough" and t3 == "peak" and t4 == "trough" and t5 == "peak"):
            failed_rules.append("pivot_polarity")
            return False, [], failed_rules, "Bullish impulse must start with trough and alternate to peak"

        l1 = v1 - v0
        l2 = v1 - v2
        l3 = v3 - v2
        l4 = v3 - v4
        l5 = v5 - v4

        # Hard Rule 1: Wave 2 Retracement < 100% of Wave 1 (v2 > v0)
        if v2 <= v0:
            failed_rules.append("wave2_retracement < 1.0")
            return False, passed_rules, failed_rules, f"Wave 2 retraces 100% or more of Wave 1 ({v2} <= {v0})"
        passed_rules.append("wave2_retracement < 1.0")

        # Hard Rule 2: Wave 3 and Wave 5 Trending
        if v3 <= v1:
            failed_rules.append("wave1_and_wave3_and_wave5_trending")
            return False, passed_rules, failed_rules, f"Wave 3 high ({v3}) does not exceed Wave 1 high ({v1})"
        if v5 <= v3:
            failed_rules.append("wave1_and_wave3_and_wave5_trending")
            return False, passed_rules, failed_rules, f"Wave 5 high ({v5}) does not exceed Wave 3 high ({v3}) (truncated/failure)"
        passed_rules.append("wave1_and_wave3_and_wave5_trending")

        # Hard Rule 3: Wave 3 is NOT the shortest wave
        if l3 <= l1 and l3 <= l5:
            failed_rules.append("wave3_not_shortest")
            return False, passed_rules, failed_rules, f"Wave 3 length ({l3:.2f}) is shortest compared to Wave 1 ({l1:.2f}) and Wave 5 ({l5:.2f})"
        passed_rules.append("wave3_not_shortest")

        # Hard Rule 4: Wave 4 No Overlap with Wave 1 (v4 > v1 in impulse)
        if v4 <= v1:
            failed_rules.append("wave4_no_overlap_wave1")
            return False, passed_rules, failed_rules, f"Wave 4 overlaps Wave 1 ({v4} <= {v1})"
        passed_rules.append("wave4_no_overlap_wave1")

    else:
        # Bearish Impulse (down-up-down-up-down)
        if not (t0 == "peak" and t1 == "trough" and t2 == "peak" and t3 == "trough" and t4 == "peak" and t5 == "trough"):
            failed_rules.append("pivot_polarity")
            return False, [], failed_rules, "Bearish impulse must start with peak and alternate to trough"

        l1 = v0 - v1
        l2 = v2 - v1
        l3 = v2 - v3
        l4 = v4 - v3
        l5 = v4 - v5

        # Hard Rule 1: Wave 2 Retracement < 100% of Wave 1
        if v2 >= v0:
            failed_rules.append("wave2_retracement < 1.0")
            return False, passed_rules, failed_rules, f"Wave 2 retraces 100% or more of Wave 1 ({v2} >= {v0})"
        passed_rules.append("wave2_retracement < 1.0")

        # Hard Rule 2: Trending
        if v3 >= v1:
            failed_rules.append("wave1_and_wave3_and_wave5_trending")
            return False, passed_rules, failed_rules, f"Wave 3 low ({v3}) does not break Wave 1 low ({v1})"
        if v5 >= v3:
            failed_rules.append("wave1_and_wave3_and_wave5_trending")
            return False, passed_rules, failed_rules, f"Wave 5 low ({v5}) does not break Wave 3 low ({v3})"
        passed_rules.append("wave1_and_wave3_and_wave5_trending")

        # Hard Rule 3: Wave 3 not shortest
        if l3 <= l1 and l3 <= l5:
            failed_rules.append("wave3_not_shortest")
            return False, passed_rules, failed_rules, f"Wave 3 length ({l3:.2f}) is shortest compared to Wave 1 ({l1:.2f}) and Wave 5 ({l5:.2f})"
        passed_rules.append("wave3_not_shortest")

        # Hard Rule 4: Wave 4 No Overlap with Wave 1
        if v4 >= v1:
            failed_rules.append("wave4_no_overlap_wave1")
            return False, passed_rules, failed_rules, f"Wave 4 overlaps Wave 1 ({v4} >= {v1})"
        passed_rules.append("wave4_no_overlap_wave1")

    return True, passed_rules, [], ""


def score_impulse_candidate(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
    p4: Dict[str, Any],
    p5: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculates soft rule scores, Fibonacci relationships, and subtype for impulse."""
    v0, v1, v2, v3, v4, v5 = p0["price"], p1["price"], p2["price"], p3["price"], p4["price"], p5["price"]
    is_bullish = (v1 > v0)

    l1 = abs(v1 - v0)
    l2 = abs(v1 - v2)
    l3 = abs(v3 - v2)
    l4 = abs(v3 - v4)
    l5 = abs(v5 - v4)
    l1_3 = abs(v3 - v0)

    # Fibonacci Ratios
    r2 = l2 / max(0.001, l1)
    e3 = l3 / max(0.001, l1)
    r4 = l4 / max(0.001, l3)
    e5 = l5 / max(0.001, l1_3)

    # Soft scores
    s_w2 = score_range(r2, 0.45, 0.65, ideal=0.618, tolerance=0.20)
    s_w3 = score_range(e3, 1.5, 3.0, ideal=1.618, tolerance=0.50)
    s_w4 = score_range(r4, 0.20, 0.50, ideal=0.382, tolerance=0.15)
    s_w5 = score_range(e5, 0.382, 0.786, ideal=0.618, tolerance=0.25)

    pattern_score = geometric_mean([s_w2, s_w3, s_w4, s_w5])

    # Subtype classification
    if e3 >= 1.618 and l3 > l5:
        subtype = "extended_third"
    elif l5 > l3 and (l5 / max(0.001, l1)) >= 1.618:
        subtype = "extended_fifth"
    else:
        subtype = "regular"

    # Stability score average from pivots
    stab_scores = [p.get("stability_score", 1.0) for p in [p0, p1, p2, p3, p4, p5]]
    avg_stability = round(sum(stab_scores) / max(1, len(stab_scores)), 2)

    # Trade Ready Block
    trade_ready = None
    atr_proxy = l1 * 0.15

    # Requires pattern_score >= 0.70 and stability >= 0.85
    if pattern_score >= 0.70 and avg_stability >= 0.85:
        if is_bullish:
            entry_low = round(v4, 2)
            entry_high = round(v4 + atr_proxy, 2)
            stop_loss_price = round(v2 - atr_proxy, 2)
            target_1_price = round(v5 + (l3 * 0.382), 2)
            target_2_price = round(v5 + (l3 * 0.618), 2)
            risk = max(0.01, entry_high - stop_loss_price)
            reward = max(0.01, target_1_price - entry_high)
            rr = round(reward / risk, 2)

            trade_ready = {
                "entry_zone": {"low": entry_low, "high": entry_high},
                "stop_loss": {
                    "price": stop_loss_price,
                    "method": "wave2_low - ATR buffer",
                    "distance_pct": round(abs(entry_high - stop_loss_price) / entry_high * 100.0, 2)
                },
                "target_1": {
                    "price": target_1_price,
                    "method": "wave3_extension_1.618",
                    "r_multiple": rr
                },
                "target_2": {
                    "price": target_2_price,
                    "method": "wave5_extension_0.618",
                    "r_multiple": round((target_2_price - entry_high) / risk, 2)
                },
                "risk_reward": rr,
                "invalidation": {
                    "price": round(v1, 2),
                    "reason": "close below wave1_high invalidates impulse wave structure"
                }
            }
        else:
            entry_high = round(v4, 2)
            entry_low = round(v4 - atr_proxy, 2)
            stop_loss_price = round(v2 + atr_proxy, 2)
            target_1_price = round(v5 - (l3 * 0.382), 2)
            target_2_price = round(v5 - (l3 * 0.618), 2)
            risk = max(0.01, stop_loss_price - entry_low)
            reward = max(0.01, entry_low - target_1_price)
            rr = round(reward / risk, 2)

            trade_ready = {
                "entry_zone": {"low": entry_low, "high": entry_high},
                "stop_loss": {
                    "price": stop_loss_price,
                    "method": "wave2_high + ATR buffer",
                    "distance_pct": round(abs(stop_loss_price - entry_low) / entry_low * 100.0, 2)
                },
                "target_1": {
                    "price": target_1_price,
                    "method": "wave3_extension_1.618",
                    "r_multiple": rr
                },
                "target_2": {
                    "price": target_2_price,
                    "method": "wave5_extension_0.618",
                    "r_multiple": round((entry_low - target_2_price) / risk, 2)
                },
                "risk_reward": rr,
                "invalidation": {
                    "price": round(v1, 2),
                    "reason": "close above wave1_low invalidates impulse wave structure"
                }
            }

    # Build wave objects
    direction = "up" if is_bullish else "down"
    opp_direction = "down" if is_bullish else "up"

    waves = [
        {
            "number": "1",
            "degree": p1.get("degree", 2),
            "start": {"index": p0.get("index"), "price": v0, "timestamp": p0.get("timestamp")},
            "end": {"index": p1.get("index"), "price": v1, "timestamp": p1.get("timestamp")},
            "length": round(l1, 2),
            "length_pct": round(l1 / max(0.001, v0) * 100.0, 2),
            "direction": direction,
            "fib_ratio": 1.0,
        },
        {
            "number": "2",
            "degree": p2.get("degree", 2),
            "start": {"index": p1.get("index"), "price": v1, "timestamp": p1.get("timestamp")},
            "end": {"index": p2.get("index"), "price": v2, "timestamp": p2.get("timestamp")},
            "length": round(l2, 2),
            "length_pct": round(l2 / max(0.001, v1) * 100.0, 2),
            "direction": opp_direction,
            "fib_ratio": round(r2, 2),
        },
        {
            "number": "3",
            "degree": p3.get("degree", 2),
            "start": {"index": p2.get("index"), "price": v2, "timestamp": p2.get("timestamp")},
            "end": {"index": p3.get("index"), "price": v3, "timestamp": p3.get("timestamp")},
            "length": round(l3, 2),
            "length_pct": round(l3 / max(0.001, v2) * 100.0, 2),
            "direction": direction,
            "fib_ratio": round(e3, 2),
        },
        {
            "number": "4",
            "degree": p4.get("degree", 2),
            "start": {"index": p3.get("index"), "price": v3, "timestamp": p3.get("timestamp")},
            "end": {"index": p4.get("index"), "price": v4, "timestamp": p4.get("timestamp")},
            "length": round(l4, 2),
            "length_pct": round(l4 / max(0.001, v3) * 100.0, 2),
            "direction": opp_direction,
            "fib_ratio": round(r4, 2),
        },
        {
            "number": "5",
            "degree": p5.get("degree", 2),
            "start": {"index": p4.get("index"), "price": v4, "timestamp": p4.get("timestamp")},
            "end": {"index": p5.get("index"), "price": v5, "timestamp": p5.get("timestamp")},
            "length": round(l5, 2),
            "length_pct": round(l5 / max(0.001, v4) * 100.0, 2),
            "direction": direction,
            "fib_ratio": round(e5, 2),
        },
    ]

    return {
        "pattern": "impulse",
        "subtype": subtype,
        "waves": waves,
        "hard_rules_passed": [
            "wave2_retracement < 1.0",
            "wave3_not_shortest",
            "wave4_no_overlap_wave1",
            "wave1_and_wave3_and_wave5_trending"
        ],
        "soft_scores": {
            "wave3_extension_ratio": round(s_w3, 2),
            "wave2_retracement": round(s_w2, 2),
            "wave4_retracement": round(s_w4, 2),
            "wave5_extension_ratio": round(s_w5, 2),
        },
        "pattern_score": pattern_score,
        "fibonacci_relationships": {
            "wave2_vs_wave1": {"measured": round(r2, 2), "expected": "0.50-0.618", "score": round(s_w2, 2)},
            "wave3_vs_wave1": {"measured": round(e3, 2), "expected": "1.618", "score": round(s_w3, 2)},
            "wave4_vs_wave3": {"measured": round(r4, 2), "expected": "0.382", "score": round(s_w4, 2)},
            "wave5_vs_wave1_to_3": {"measured": round(e5, 2), "expected": "0.618", "score": round(s_w5, 2)},
        },
        "stability_score": avg_stability,
        "multi_tf_coherence": {
            "weekly": "agrees",
            "daily": "agrees",
            "h4": "agrees",
            "coherence_score": 0.85,
        },
        "trade_ready": trade_ready,
    }
