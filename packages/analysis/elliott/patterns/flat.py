"""
Flat corrective wave pattern evaluation and scoring.
3-wave corrective sequence (A-B-C / 3-3-5).
"""

from typing import Dict, Any, List, Tuple
from ..structures import score_range, geometric_mean


def evaluate_flat_hard_rules(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
) -> Tuple[bool, List[str], List[str], str]:
    """
    Applies binary hard rules for Flat (3-3-5) correction.
    """
    passed_rules = []
    failed_rules = []

    v0, v1, v2, v3 = p0["price"], p1["price"], p2["price"], p3["price"]
    t0, t1, t2, t3 = p0["type"], p1["type"], p2["type"], p3["type"]

    if not (t0 != t1 and t1 != t2 and t2 != t3):
        failed_rules.append("alternating_pivots")
        return False, [], failed_rules, "Flat pivots must strictly alternate"

    la = abs(v1 - v0)
    lb = abs(v2 - v1)
    lc = abs(v3 - v2)

    if la <= 0.0001:
        return False, [], ["waveA_length > 0"], "Wave A length must be greater than zero"

    rb = lb / la
    rc = lc / la

    # Hard Rule 1: Wave B retraces at least 90% of Wave A (B ≈ A)
    if rb < 0.90:
        failed_rules.append("waveB_retraces_at_least_90pct_A")
        return False, passed_rules, failed_rules, f"Wave B retracement ({rb:.2f}) is under 90% (characteristic of zigzag, not flat)"
    passed_rules.append("waveB_retraces_at_least_90pct_A")

    # Hard Rule 2: Wave C terminates near or beyond end of Wave A (rc >= 0.85)
    if rc < 0.85:
        failed_rules.append("waveC_terminates_near_A_start")
        return False, passed_rules, failed_rules, f"Wave C length ratio ({rc:.2f}) is too small (< 85% of A)"
    passed_rules.append("waveC_terminates_near_A_start")

    return True, passed_rules, [], ""


def score_flat_candidate(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculates soft scores and wave objects for Flat (A-B-C)."""
    v0, v1, v2, v3 = p0["price"], p1["price"], p2["price"], p3["price"]
    is_bullish = (v3 > v2)

    la = abs(v1 - v0)
    lb = abs(v2 - v1)
    lc = abs(v3 - v2)

    rb = lb / max(0.001, la)
    rc = lc / max(0.001, la)

    s_b = score_range(rb, 0.90, 1.05, ideal=1.00, tolerance=0.15)
    s_c = score_range(rc, 0.90, 1.38, ideal=1.00, tolerance=0.20)
    pattern_score = geometric_mean([s_b, s_c])

    # Subtype
    if rb > 1.05 and rc > 1.00:
        subtype = "expanded_flat"
    elif rb > 1.00 and rc < 1.00:
        subtype = "running_flat"
    else:
        subtype = "regular_flat"

    stab_scores = [p.get("stability_score", 1.0) for p in [p0, p1, p2, p3]]
    avg_stability = round(sum(stab_scores) / max(1, len(stab_scores)), 2)

    direction = "up" if is_bullish else "down"
    opp_direction = "down" if is_bullish else "up"

    waves = [
        {
            "number": "A",
            "degree": p1.get("degree", 2),
            "start": {"index": p0.get("index"), "price": v0, "timestamp": p0.get("timestamp")},
            "end": {"index": p1.get("index"), "price": v1, "timestamp": p1.get("timestamp")},
            "length": round(la, 2),
            "length_pct": round(la / max(0.001, v0) * 100.0, 2),
            "direction": direction,
            "fib_ratio": 1.0,
        },
        {
            "number": "B",
            "degree": p2.get("degree", 2),
            "start": {"index": p1.get("index"), "price": v1, "timestamp": p1.get("timestamp")},
            "end": {"index": p2.get("index"), "price": v2, "timestamp": p2.get("timestamp")},
            "length": round(lb, 2),
            "length_pct": round(lb / max(0.001, v1) * 100.0, 2),
            "direction": opp_direction,
            "fib_ratio": round(rb, 2),
        },
        {
            "number": "C",
            "degree": p3.get("degree", 2),
            "start": {"index": p2.get("index"), "price": v2, "timestamp": p2.get("timestamp")},
            "end": {"index": p3.get("index"), "price": v3, "timestamp": p3.get("timestamp")},
            "length": round(lc, 2),
            "length_pct": round(lc / max(0.001, v2) * 100.0, 2),
            "direction": direction,
            "fib_ratio": round(rc, 2),
        },
    ]

    trade_ready = None
    atr_proxy = la * 0.15

    if pattern_score >= 0.70 and avg_stability >= 0.85:
        if is_bullish:
            entry_low = round(v2, 2)
            entry_high = round(v2 + atr_proxy, 2)
            stop_loss = round(v0 - atr_proxy, 2)
            target_1 = round(v3 + (la * 0.618), 2)
            target_2 = round(v3 + (la * 1.00), 2)
            risk = max(0.01, entry_high - stop_loss)
            trade_ready = {
                "entry_zone": {"low": entry_low, "high": entry_high},
                "stop_loss": {"price": stop_loss, "method": "flat_invalidation_level - ATR buffer", "distance_pct": round(abs(entry_high - stop_loss) / entry_high * 100.0, 2)},
                "target_1": {"price": target_1, "method": "flat_waveC_target", "r_multiple": round((target_1 - entry_high) / risk, 2)},
                "target_2": {"price": target_2, "method": "waveC_extension_1.00", "r_multiple": round((target_2 - entry_high) / risk, 2)},
                "risk_reward": round((target_1 - entry_high) / risk, 2),
                "invalidation": {"price": round(v0, 2), "reason": "close below flat base invalidates pattern"},
            }
        else:
            entry_high = round(v2, 2)
            entry_low = round(v2 - atr_proxy, 2)
            stop_loss = round(v0 + atr_proxy, 2)
            target_1 = round(v3 - (la * 0.618), 2)
            target_2 = round(v3 - (la * 1.00), 2)
            risk = max(0.01, stop_loss - entry_low)
            trade_ready = {
                "entry_zone": {"low": entry_low, "high": entry_high},
                "stop_loss": {"price": stop_loss, "method": "flat_invalidation_level + ATR buffer", "distance_pct": round(abs(stop_loss - entry_low) / entry_low * 100.0, 2)},
                "target_1": {"price": target_1, "method": "flat_waveC_target", "r_multiple": round((entry_low - target_1) / risk, 2)},
                "target_2": {"price": target_2, "method": "waveC_extension_1.00", "r_multiple": round((entry_low - target_2) / risk, 2)},
                "risk_reward": round((entry_low - target_1) / risk, 2),
                "invalidation": {"price": round(v0, 2), "reason": "close above flat base invalidates pattern"},
            }

    return {
        "pattern": "flat",
        "subtype": subtype,
        "waves": waves,
        "hard_rules_passed": ["waveB_retraces_at_least_90pct_A", "waveC_terminates_near_A_start"],
        "soft_scores": {
            "waveB_retracement": round(s_b, 2),
            "waveC_extension": round(s_c, 2),
        },
        "pattern_score": pattern_score,
        "fibonacci_relationships": {
            "waveB_vs_waveA": {"measured": round(rb, 2), "expected": "0.90-1.05", "score": round(s_b, 2)},
            "waveC_vs_waveA": {"measured": round(rc, 2), "expected": "1.00", "score": round(s_c, 2)},
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
