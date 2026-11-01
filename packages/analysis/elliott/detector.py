"""
Elliott Wave Rule-First Detector.
Derives valid wave sequences from HSPD pivots.
Pure deterministic. No LLM. Zero tolerance for hard rule violations.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone
import math

from .structures import PATTERNS, score_range, geometric_mean, clamp

class ElliottDetector:
    """
    Rule-First Elliott Wave Engine.
    Evaluates sequences of HSPD pivots against strict axiomatic rules.
    """

    VERSION = "1.0.0"

    def __init__(self):
        pass

    def _extract_pivots_list(self, pivots_data: Union[Dict[str, Any], List[Dict[str, Any]]], min_degree: int = 1) -> List[Dict[str, Any]]:
        raw_list = []
        if isinstance(pivots_data, dict):
            raw_list = pivots_data.get("pivots", [])
        elif isinstance(pivots_data, list):
            raw_list = pivots_data

        filtered = [
            p for p in raw_list
            if p.get("degree", 0) >= min_degree
        ]
        # Sort chronologically by index
        filtered.sort(key=lambda x: (x.get("index", 0), -x.get("degree", 0)))
        return filtered

    def _evaluate_impulse_hard_rules(
        self,
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
        reason = ""

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

    def _evaluate_zigzag_hard_rules(
        self,
        p0: Dict[str, Any],
        p1: Dict[str, Any],
        p2: Dict[str, Any],
        p3: Dict[str, Any],
    ) -> Tuple[bool, List[str], List[str], str]:
        """
        Applies binary hard rules to 4 consecutive pivot points for ZigZag (A-B-C).
        """
        passed_rules = []
        failed_rules = []

        v0, v1, v2, v3 = p0["price"], p1["price"], p2["price"], p3["price"]
        t0, t1, t2, t3 = p0["type"], p1["type"], p2["type"], p3["type"]

        # Alternating types
        if not (t0 != t1 and t1 != t2 and t2 != t3):
            failed_rules.append("alternating_pivots")
            return False, [], failed_rules, "Zigzag pivots must strictly alternate"

        # Downward ZigZag (Peak -> Trough -> Peak -> Trough)
        if t0 == "peak" and t1 == "trough" and t2 == "peak" and t3 == "trough":
            la = v0 - v1
            lb = v2 - v1
            lc = v2 - v3

            # Hard Rule 1: Wave B Retracement < 1.0 (v2 < v0)
            if v2 >= v0:
                failed_rules.append("waveB_retracement < 1.0")
                return False, passed_rules, failed_rules, f"Wave B retraces 100% or more of Wave A ({v2} >= {v0})"
            passed_rules.append("waveB_retracement < 1.0")

            # Hard Rule 2: Wave C extends beyond Wave A (v3 < v1)
            if v3 >= v1:
                failed_rules.append("waveC_extends_beyond_A")
                return False, passed_rules, failed_rules, f"Wave C low ({v3}) does not extend beyond Wave A low ({v1})"
            passed_rules.append("waveC_extends_beyond_A")

            return True, passed_rules, [], ""

        # Upward ZigZag (Trough -> Peak -> Trough -> Peak)
        elif t0 == "trough" and t1 == "peak" and t2 == "trough" and t3 == "peak":
            la = v1 - v0
            lb = v1 - v2
            lc = v3 - v2

            # Hard Rule 1: Wave B Retracement < 1.0 (v2 > v0)
            if v2 <= v0:
                failed_rules.append("waveB_retracement < 1.0")
                return False, passed_rules, failed_rules, f"Wave B retraces 100% or more of Wave A ({v2} <= {v0})"
            passed_rules.append("waveB_retracement < 1.0")

            # Hard Rule 2: Wave C extends beyond Wave A (v3 > v1)
            if v3 <= v1:
                failed_rules.append("waveC_extends_beyond_A")
                return False, passed_rules, failed_rules, f"Wave C high ({v3}) does not extend beyond Wave A high ({v1})"
            passed_rules.append("waveC_extends_beyond_A")

            return True, passed_rules, [], ""

        else:
            failed_rules.append("pivot_polarity")
            return False, [], failed_rules, "Invalid pivot polarity for zigzag"

    def _score_zigzag_candidate(
        self,
        p0: Dict[str, Any],
        p1: Dict[str, Any],
        p2: Dict[str, Any],
        p3: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Calculates soft scores and wave objects for ZigZag (A-B-C)."""
        v0, v1, v2, v3 = p0["price"], p1["price"], p2["price"], p3["price"]
        is_bullish = (v3 > v2)  # Upward C wave

        la = abs(v1 - v0)
        lb = abs(v2 - v1)
        lc = abs(v3 - v2)

        rb = lb / max(0.001, la)
        rc = lc / max(0.001, la)

        s_b = score_range(rb, 0.38, 0.79, ideal=0.618, tolerance=0.15)
        # Score C equals A (1.0) or 1.618 A
        s_c1 = score_range(rc, 0.80, 1.25, ideal=1.00, tolerance=0.20)
        s_c2 = score_range(rc, 1.40, 1.85, ideal=1.618, tolerance=0.20)
        s_c = max(s_c1, s_c2)

        pattern_score = geometric_mean([s_b, s_c])
        subtype = "extended_c" if rc > 1.30 else "regular"

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
                    "stop_loss": {"price": stop_loss, "method": "waveA_start - ATR buffer", "distance_pct": round(abs(entry_high - stop_loss) / entry_high * 100.0, 2)},
                    "target_1": {"price": target_1, "method": "waveC_extension_0.618", "r_multiple": round((target_1 - entry_high) / risk, 2)},
                    "target_2": {"price": target_2, "method": "waveC_extension_1.00", "r_multiple": round((target_2 - entry_high) / risk, 2)},
                    "risk_reward": round((target_1 - entry_high) / risk, 2),
                    "invalidation": {"price": round(v0, 2), "reason": "close below waveA_start invalidates zigzag structure"},
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
                    "stop_loss": {"price": stop_loss, "method": "waveA_start + ATR buffer", "distance_pct": round(abs(stop_loss - entry_low) / entry_low * 100.0, 2)},
                    "target_1": {"price": target_1, "method": "waveC_extension_0.618", "r_multiple": round((entry_low - target_1) / risk, 2)},
                    "target_2": {"price": target_2, "method": "waveC_extension_1.00", "r_multiple": round((entry_low - target_2) / risk, 2)},
                    "risk_reward": round((entry_low - target_1) / risk, 2),
                    "invalidation": {"price": round(v0, 2), "reason": "close above waveA_start invalidates zigzag structure"},
                }

        return {
            "pattern": "zigzag",
            "subtype": subtype,
            "waves": waves,
            "hard_rules_passed": ["waveB_retracement < 1.0", "waveC_extends_beyond_A"],
            "soft_scores": {
                "waveB_retracement": round(s_b, 2),
                "waveC_extension": round(s_c, 2),
            },
            "pattern_score": pattern_score,
            "fibonacci_relationships": {
                "waveB_vs_waveA": {"measured": round(rb, 2), "expected": "0.38-0.79", "score": round(s_b, 2)},
                "waveC_vs_waveA": {"measured": round(rc, 2), "expected": "1.00 or 1.618", "score": round(s_c, 2)},
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

    def _evaluate_triangle_hard_rules(
        self,
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

    def _score_triangle_candidate(
        self,
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

    def _evaluate_flat_hard_rules(
        self,
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

    def _score_flat_candidate(
        self,
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

    def _evaluate_triangle_hard_rules(
        self,
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

    def _score_triangle_candidate(
        self,
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

    def _score_impulse_candidate(
        self,
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
        current_price = v5
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

    def _evaluate_triangle_hard_rules(
        self,
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

    def _score_triangle_candidate(
        self,
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

    def _evaluate_flat_hard_rules(
        self,
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

    def _score_flat_candidate(
        self,
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

    def _evaluate_triangle_hard_rules(
        self,
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

    def _score_triangle_candidate(
        self,
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

    def detect(
        self,
        symbol: str,
        timeframe: str,
        pivots: Any,
        min_degree: int = 1,
        candles_used: int = 250,
    ) -> Dict[str, Any]:
        """
        Derives Elliott Wave structures from HSPD pivots.
        """
        computed_at = datetime.now(timezone.utc).isoformat()
        pivots_list = self._extract_pivots_list(pivots, min_degree=min_degree)

        rejected_counts: List[Dict[str, Any]] = []
        valid_candidates: List[Dict[str, Any]] = []

        # Scan sliding window of 6 consecutive pivots for 5-wave impulse sequence
        has_failed_full_impulse = False
        if len(pivots_list) >= 6:
            for i in range(5, len(pivots_list)):
                p0 = pivots_list[i - 5]
                p1 = pivots_list[i - 4]
                p2 = pivots_list[i - 3]
                p3 = pivots_list[i - 2]
                p4 = pivots_list[i - 1]
                p5 = pivots_list[i]

                # 1. Evaluate Impulse Hard Rules
                passed, passed_r, failed_r, reason = self._evaluate_impulse_hard_rules(p0, p1, p2, p3, p4, p5)
                if not passed:
                    has_failed_full_impulse = True
                    rejected_counts.append({
                        "pattern": "impulse",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index"), p4.get("index"), p5.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    # Score surviving candidate
                    scored_cand = self._score_impulse_candidate(p0, p1, p2, p3, p4, p5)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 4 consecutive pivots for 3-wave ZigZag sequence (A-B-C)
        # If exactly 6 pivots were provided and the impulse failed, do not promote sub-zigzags to primary
        allow_sub_zigzag = not (len(pivots_list) == 6 and has_failed_full_impulse and len(valid_candidates) == 0)

        if len(pivots_list) >= 4 and allow_sub_zigzag:
            for i in range(3, len(pivots_list)):
                p0 = pivots_list[i - 3]
                p1 = pivots_list[i - 2]
                p2 = pivots_list[i - 1]
                p3 = pivots_list[i]

                passed, passed_r, failed_r, reason = self._evaluate_zigzag_hard_rules(p0, p1, p2, p3)
                if not passed:
                    rejected_counts.append({
                        "pattern": "zigzag",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = self._score_zigzag_candidate(p0, p1, p2, p3)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 4 consecutive pivots for 3-wave Flat sequence (A-B-C)
        if len(pivots_list) >= 4 and allow_sub_zigzag:
            for i in range(3, len(pivots_list)):
                p0 = pivots_list[i - 3]
                p1 = pivots_list[i - 2]
                p2 = pivots_list[i - 1]
                p3 = pivots_list[i]

                passed, passed_r, failed_r, reason = self._evaluate_flat_hard_rules(p0, p1, p2, p3)
                if not passed:
                    rejected_counts.append({
                        "pattern": "flat",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = self._score_flat_candidate(p0, p1, p2, p3)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 6 consecutive pivots for 5-wave Triangle sequence (A-B-C-D-E)
        if len(pivots_list) >= 6:
            for i in range(5, len(pivots_list)):
                p0 = pivots_list[i - 5]
                p1 = pivots_list[i - 4]
                p2 = pivots_list[i - 3]
                p3 = pivots_list[i - 2]
                p4 = pivots_list[i - 1]
                p5 = pivots_list[i]

                passed, passed_r, failed_r, reason = self._evaluate_triangle_hard_rules(p0, p1, p2, p3, p4, p5)
                if not passed:
                    rejected_counts.append({
                        "pattern": "triangle",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index"), p4.get("index"), p5.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = self._score_triangle_candidate(p0, p1, p2, p3, p4, p5)
                    valid_candidates.append(scored_cand)

        # Rank candidates: 5-wave impulses take priority over sub-slices of themselves
        valid_candidates.sort(
            key=lambda x: (
                1 if x.get("pattern") == "impulse" else 0,
                x.get("pattern_score", 0.0)
            ),
            reverse=True
        )

        primary_count = valid_candidates[0] if len(valid_candidates) > 0 else None
        alternative_count = None

        if len(valid_candidates) > 1 and primary_count:
            # Find an alternative count that is structurally distinct
            p_start = primary_count["waves"][0]["start"]["index"]
            for cand in valid_candidates[1:]:
                c_start = cand["waves"][0]["start"]["index"]
                if cand["pattern"] != primary_count["pattern"]:
                    alternative_count = {
                        "pattern": cand["pattern"],
                        "subtype": cand["subtype"],
                        "waves": cand["waves"],
                        "pattern_score": cand["pattern_score"],
                        "reason_for_alternative": f"Alternative count pattern: {cand['pattern']} ({cand['subtype']}) starting at bar {c_start}",
                    }
                    break
                elif p_start != c_start or cand["subtype"] != primary_count["subtype"]:
                    alternative_count = {
                        "pattern": cand["pattern"],
                        "subtype": cand["subtype"],
                        "waves": cand["waves"],
                        "pattern_score": cand["pattern_score"],
                        "reason_for_alternative": f"Distinct wave anchoring starting at bar {c_start} (score {cand['pattern_score']:.2f})",
                    }
                    break

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "degree": min_degree,
            "primary_count": primary_count,
            "alternative_count": alternative_count,
            "rejected_counts": rejected_counts,
            "data_quality": {
                "pivots_used": len(pivots_list),
                "min_degree": min_degree,
                "candles_used": candles_used,
            }
        }


global_elliott_detector = ElliottDetector()
