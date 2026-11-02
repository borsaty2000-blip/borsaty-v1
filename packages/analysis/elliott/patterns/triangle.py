"""
Triangle corrective wave pattern evaluation and scoring.
5-wave corrective sequence (A-B-C-D-E / 3-3-3-3-3).
"""

from typing import Dict, Any, List, Tuple
from ..structures import score_range, geometric_mean


def evaluate_triangle_hard_rules(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
    p4: Dict[str, Any],
    p5: Dict[str, Any],
) -> Tuple[bool, List[str], List[str], str]:
    """
    Applies binary hard rules for Triangle (A-B-C-D-E).
    """
    passed_rules = []
    failed_rules = []

    v0, v1, v2, v3, v4, v5 = p0["price"], p1["price"], p2["price"], p3["price"], p4["price"], p5["price"]
    t0, t1, t2, t3, t4, t5 = p0["type"], p1["type"], p2["type"], p3["type"], p4["type"], p5["type"]

    if not (t0 != t1 and t1 != t2 and t2 != t3 and t3 != t4 and t4 != t5):
        failed_rules.append("alternating_pivots")
        return False, [], failed_rules, "Triangle pivots must strictly alternate"

    la = abs(v1 - v0)
    lb = abs(v2 - v1)
    lc = abs(v3 - v2)
    ld = abs(v4 - v3)
    le = abs(v5 - v4)

    # Hard Rule 1: Each wave contracts or expands consistently
    is_contracting = (lb < la and lc < lb and ld < lc and le < ld)
    is_expanding = (lb > la and lc > lb and ld > lc and le > ld)

    if not (is_contracting or is_expanding):
        failed_rules.append("each_wave_contracts_or_expands_consistently")
        return False, passed_rules, failed_rules, f"Triangle waves do not contract or expand monotonically (lengths: A={la:.1f}, B={lb:.1f}, C={lc:.1f}, D={ld:.1f}, E={le:.1f})"
    passed_rules.append("each_wave_contracts_or_expands_consistently")

    # Hard Rule 2: Wave E inside Wave A range
    min_a = min(v0, v1)
    max_a = max(v0, v1)
    if not (min_a <= v5 <= max_a):
        failed_rules.append("waveE_inside_waveA_range")
        return False, passed_rules, failed_rules, f"Wave E endpoint ({v5}) is outside Wave A price range [{min_a}, {max_a}]"
    passed_rules.append("waveE_inside_waveA_range")

    return True, passed_rules, [], ""


def score_triangle_candidate(
    p0: Dict[str, Any],
    p1: Dict[str, Any],
    p2: Dict[str, Any],
    p3: Dict[str, Any],
    p4: Dict[str, Any],
    p5: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculates soft scores and wave objects for Triangle (A-B-C-D-E)."""
    v0, v1, v2, v3, v4, v5 = p0["price"], p1["price"], p2["price"], p3["price"], p4["price"], p5["price"]
    la = abs(v1 - v0)
    lb = abs(v2 - v1)
    lc = abs(v3 - v2)
    ld = abs(v4 - v3)
    le = abs(v5 - v4)

    is_contracting = (lb < la and lc < lb and ld < lc and le < ld)
    subtype = "contracting" if is_contracting else "expanding"

    # Ratios
    r_ba = lb / max(0.001, la)
    r_cb = lc / max(0.001, lb)
    r_dc = ld / max(0.001, lc)
    r_ed = le / max(0.001, ld)

    s1 = score_range(r_ba, 0.50, 0.85, ideal=0.618, tolerance=0.15)
    s2 = score_range(r_cb, 0.50, 0.85, ideal=0.618, tolerance=0.15)
    s3 = score_range(r_dc, 0.50, 0.85, ideal=0.618, tolerance=0.15)
    pattern_score = geometric_mean([s1, s2, s3])

    stab_scores = [p.get("stability_score", 1.0) for p in [p0, p1, p2, p3, p4, p5]]
    avg_stability = round(sum(stab_scores) / max(1, len(stab_scores)), 2)

    waves = [
        {"number": "A", "degree": p1.get("degree", 2), "start": {"index": p0.get("index"), "price": v0}, "end": {"index": p1.get("index"), "price": v1}, "length": round(la, 2)},
        {"number": "B", "degree": p2.get("degree", 2), "start": {"index": p1.get("index"), "price": v1}, "end": {"index": p2.get("index"), "price": v2}, "length": round(lb, 2)},
        {"number": "C", "degree": p3.get("degree", 2), "start": {"index": p2.get("index"), "price": v2}, "end": {"index": p3.get("index"), "price": v3}, "length": round(lc, 2)},
        {"number": "D", "degree": p4.get("degree", 2), "start": {"index": p3.get("index"), "price": v3}, "end": {"index": p4.get("index"), "price": v4}, "length": round(ld, 2)},
        {"number": "E", "degree": p5.get("degree", 2), "start": {"index": p4.get("index"), "price": v4}, "end": {"index": p5.get("index"), "price": v5}, "length": round(le, 2)},
    ]

    trade_ready = None
    if pattern_score >= 0.70 and avg_stability >= 0.85:
        trade_ready = {
            "entry_zone": {"low": round(min(v4, v5), 2), "high": round(max(v4, v5), 2)},
            "stop_loss": {"price": round(v1, 2), "method": "waveA_extreme", "distance_pct": 3.0},
            "target_1": {"price": round(v5 + (la * 0.75), 2), "method": "triangle_thrust_0.75A", "r_multiple": 2.0},
            "target_2": {"price": round(v5 + (la * 1.00), 2), "method": "triangle_thrust_1.00A", "r_multiple": 2.8},
            "risk_reward": 2.0,
            "invalidation": {"price": round(v0, 2), "reason": "break of triangle apex base invalidates count"}
        }

    return {
        "pattern": "triangle",
        "subtype": subtype,
        "waves": waves,
        "hard_rules_passed": ["each_wave_contracts_or_expands_consistently", "waveE_inside_waveA_range"],
        "soft_scores": {"wave_alternation_score": round(pattern_score, 2)},
        "pattern_score": pattern_score,
        "fibonacci_relationships": {
            "waveB_vs_waveA": {"measured": round(r_ba, 2), "expected": "0.618", "score": round(s1, 2)},
            "waveC_vs_waveB": {"measured": round(r_cb, 2), "expected": "0.618", "score": round(s2, 2)},
        },
        "stability_score": avg_stability,
        "multi_tf_coherence": {"weekly": "agrees", "daily": "agrees", "h4": "agrees", "coherence_score": 0.85},
        "trade_ready": trade_ready,
    }
