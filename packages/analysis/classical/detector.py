"""
Classical Chart Pattern Detector Engine (Borsaty).
Deterministic 5-Gate Pattern Recognition from HSPD Pivots and Candlestick Data.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone
import math

from .structures import CLASSICAL_PATTERNS
from .validators import VolumeValidator, BreakoutValidator, global_volume_validator, global_breakout_validator


class ClassicalPatternDetector:
    """
    Detects classical chart patterns using HSPD pivots and 5-gate validation:
    1. Shape (geometry from pivots)
    2. Volume (formation profile + breakout ratio)
    3. Time (duration & symmetry)
    4. Breakout (confirmed close, not wick)
    5. Retest (optional confidence booster)
    """

    VERSION = "1.0.0"

    def __init__(
        self,
        volume_validator: Optional[VolumeValidator] = None,
        breakout_validator: Optional[BreakoutValidator] = None,
    ):
        self.vol_val = volume_validator or global_volume_validator
        self.bo_val = breakout_validator or global_breakout_validator

    def _extract_pivots_list(
        self, pivots_data: Union[Dict[str, Any], List[Dict[str, Any]]], min_degree: int = 1
    ) -> List[Dict[str, Any]]:
        raw_list = []
        if isinstance(pivots_data, dict):
            raw_list = pivots_data.get("pivots", [])
        elif isinstance(pivots_data, list):
            raw_list = pivots_data

        filtered = [p for p in raw_list if p.get("degree", 0) >= min_degree]
        filtered.sort(key=lambda x: (x.get("index", 0), -x.get("degree", 0)))
        return filtered

    def _get_candle_volume(self, candles: List[Dict[str, Any]], idx: int) -> float:
        if not candles or idx < 0 or idx >= len(candles):
            return 1.0
        return float(candles[idx].get("volume", 1.0))

    # --------------------------------------------------------------------------
    # 1. HEAD AND SHOULDERS
    # --------------------------------------------------------------------------
    def _detect_head_and_shoulders(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 5:
            return confirmed, near_misses, rejected

        for i in range(n - 4):
            p_ls = pivots[i]
            p_v1 = pivots[i + 1]
            p_head = pivots[i + 2]
            p_v2 = pivots[i + 3]
            p_rs = pivots[i + 4]

            if not (
                p_ls["type"] == "peak"
                and p_v1["type"] == "trough"
                and p_head["type"] == "peak"
                and p_v2["type"] == "trough"
                and p_rs["type"] == "peak"
            ):
                continue

            ls_p, head_p, rs_p = p_ls["price"], p_head["price"], p_rs["price"]
            v1_p, v2_p = p_v1["price"], p_v2["price"]

            if head_p <= ls_p or head_p <= rs_p:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": "head not higher than both shoulders",
                })
                continue

            avg_shoulder = (ls_p + rs_p) / 2.0
            shoulder_diff_pct = abs(ls_p - rs_p) / avg_shoulder
            if shoulder_diff_pct > 0.10:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": f"shoulders unequal by {shoulder_diff_pct * 100:.1f}% (threshold 10%)",
                })
                continue

            if v1_p >= min(ls_p, head_p) or v2_p >= min(head_p, rs_p):
                rejected.append({
                    "pivots": [p_ls["index"], p_v1["index"], p_head["index"], p_v2["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": "valleys not below shoulder peaks",
                })
                continue

            shape_rules_passed = ["3_peaks_identified", "head_higher_than_both", "shoulders_near_equal", "neckline_defined"]

            dx = max(1, p_v2["index"] - p_v1["index"])
            slope = (v2_p - v1_p) / dx

            def get_neckline_y(idx: int) -> float:
                return v1_p + slope * (idx - p_v1["index"])

            duration_shoulders = p_rs["index"] - p_ls["index"]
            d1 = max(1, p_head["index"] - p_ls["index"])
            d2 = max(1, p_rs["index"] - p_head["index"])
            symmetry_score = round(1.0 - abs(d1 - d2) / max(d1, d2), 2)

            vol_ls = self._get_candle_volume(candles, p_ls["index"])
            vol_head = self._get_candle_volume(candles, p_head["index"])
            vol_rs = self._get_candle_volume(candles, p_rs["index"])

            gate_vol_head = (vol_head > vol_ls)
            gate_vol_rs = (vol_rs < vol_head)

            has_breakout, bo_idx, bo_price, wick_only = False, None, None, False
            bo_vol_ratio = 1.0

            if candles:
                for b in range(p_rs["index"] + 1, len(candles)):
                    c = candles[b]
                    c_neck = get_neckline_y(b)
                    close_p = float(c.get("close", 0.0))
                    low_p = float(c.get("low", close_p))

                    if close_p < c_neck:
                        has_breakout = True
                        bo_idx = b
                        bo_price = close_p
                        bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                        break
                    elif low_p < c_neck:
                        wick_only = True

            gate_bo_vol = (bo_vol_ratio >= 1.3)
            gate_confirmed_close = has_breakout

            retest_happened = False
            if has_breakout and bo_idx is not None and candles:
                c_neck_bo = get_neckline_y(bo_idx)
                retest_happened, _ = self.bo_val.retest_happened(candles, bo_idx, c_neck_bo, "bearish")

            logic_gates = {
                "volume_head > volume_LS": {"pass": gate_vol_head, "head": vol_head, "LS": vol_ls},
                "volume_RS < volume_head": {"pass": gate_vol_rs, "RS": vol_rs, "head": vol_head},
                "breakout_volume_ratio > 1.3": {"pass": gate_bo_vol, "value": bo_vol_ratio, "threshold": 1.3},
                "confirmed_close_below": {"pass": gate_confirmed_close, "wick_only": wick_only},
                "retest_after_breakout": {"pass": retest_happened, "note": "retest verified" if retest_happened else "not yet tested"},
            }

            time_rules = {
                "duration_between_shoulders": duration_shoulders,
                "symmetry_score": symmetry_score,
            }

            head_depth = abs(head_p - get_neckline_y(p_head["index"]))
            neck_ref = get_neckline_y(bo_idx if bo_idx is not None else p_rs["index"])
            target1 = round(neck_ref - head_depth * 1.0, 2)
            target2 = round(neck_ref - head_depth * 1.618, 2)
            inv_price = round(rs_p, 2)
            inv_dist_pct = round(abs(inv_price - neck_ref) / neck_ref * 100, 1)

            is_failed = False
            fail_reason = None
            if has_breakout and bo_idx is not None and candles:
                for b in range(bo_idx + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) > inv_price:
                        is_failed = True
                        fail_reason = "Price closed back above Right Shoulder invalidation level"
                        break

            vol_score = 1.0 if (gate_vol_head and gate_vol_rs) else 0.5
            bo_score = 1.0 if (gate_bo_vol and gate_confirmed_close) else (0.5 if gate_confirmed_close else 0.0)
            time_score = min(1.0, max(0.5, symmetry_score))
            retest_bonus = 0.05 if retest_happened else 0.0

            base_score = (1.0 * 0.3) + (vol_score * 0.25) + (bo_score * 0.25) + (time_score * 0.2) + retest_bonus
            pattern_score = round(min(0.99, max(0.50, base_score)), 2)

            pattern_entry = {
                "pattern": "head_and_shoulders",
                "type": "reversal",
                "direction": "bearish",
                "points": {
                    "LS_low": {"index": p_v1["index"], "price": v1_p},
                    "LS_high": {"index": p_ls["index"], "price": ls_p},
                    "Head": {"index": p_head["index"], "price": head_p},
                    "RS_high": {"index": p_rs["index"], "price": rs_p},
                    "RS_low": {"index": p_v2["index"], "price": v2_p},
                    "neckline": {
                        "start": v1_p,
                        "end": v2_p,
                        "slope": round(slope, 5),
                    },
                },
                "shape_rules_passed": shape_rules_passed,
                "logic_gates": logic_gates,
                "time_rules": time_rules,
                "pattern_score": pattern_score,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_vol_ratio,
                } if has_breakout else None,
                "invalidation": {
                    "price": inv_price,
                    "method": "close back above right shoulder / neckline",
                    "distance_pct": inv_dist_pct,
                },
                "targets": [
                    {"price": target1, "method": "measured_move (neckline - head_depth)", "r_multiple": 1.0},
                    {"price": target2, "method": "1.618 extension", "r_multiple": 2.1},
                ],
                "volume_confirmation": {
                    "during_formation": "declining" if (gate_vol_head and gate_vol_rs) else "non_confirming",
                    "at_breakout": f"elevated_{bo_vol_ratio:.2f}x" if gate_bo_vol else f"low_{bo_vol_ratio:.2f}x",
                    "confirmed": bool(gate_vol_head and gate_vol_rs and gate_bo_vol),
                },
            }

            if is_failed:
                pattern_entry["status"] = "failed"
                pattern_entry["invalidation_reason"] = fail_reason
                confirmed.append(pattern_entry)
            elif not gate_vol_head:
                near_misses.append({
                    "pattern": "head_and_shoulders",
                    "reason": f"Volume at Head ({vol_head}) <= Left Shoulder ({vol_ls})",
                    "specific_gate": "volume_head > volume_LS",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not gate_vol_rs:
                near_misses.append({
                    "pattern": "head_and_shoulders",
                    "reason": f"Volume at Right Shoulder ({vol_rs}) >= Head ({vol_head})",
                    "specific_gate": "volume_RS < volume_head",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not has_breakout:
                pattern_entry["status"] = "forming"
                confirmed.append(pattern_entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": "head_and_shoulders",
                    "reason": f"Breakout volume ratio {bo_vol_ratio} below threshold 1.3",
                    "specific_gate": "breakout_volume_ratio > 1.3",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            else:
                pattern_entry["status"] = "confirmed"
                confirmed.append(pattern_entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 2. INVERSE HEAD AND SHOULDERS
    # --------------------------------------------------------------------------
    def _detect_inverse_head_and_shoulders(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 5:
            return confirmed, near_misses, rejected

        for i in range(n - 4):
            p_ls = pivots[i]
            p_v1 = pivots[i + 1]
            p_head = pivots[i + 2]
            p_v2 = pivots[i + 3]
            p_rs = pivots[i + 4]

            if not (
                p_ls["type"] == "trough"
                and p_v1["type"] == "peak"
                and p_head["type"] == "trough"
                and p_v2["type"] == "peak"
                and p_rs["type"] == "trough"
            ):
                continue

            ls_p, head_p, rs_p = p_ls["price"], p_head["price"], p_rs["price"]
            v1_p, v2_p = p_v1["price"], p_v2["price"]

            if head_p >= ls_p or head_p >= rs_p:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "inverse_head_and_shoulders",
                    "reason": "head not lower than both shoulders",
                })
                continue

            avg_shoulder = (ls_p + rs_p) / 2.0
            shoulder_diff_pct = abs(ls_p - rs_p) / avg_shoulder
            if shoulder_diff_pct > 0.10:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "inverse_head_and_shoulders",
                    "reason": f"shoulders unequal by {shoulder_diff_pct * 100:.1f}% (threshold 10%)",
                })
                continue

            if v1_p <= max(ls_p, head_p) or v2_p <= max(head_p, rs_p):
                rejected.append({
                    "pivots": [p_ls["index"], p_v1["index"], p_head["index"], p_v2["index"], p_rs["index"]],
                    "closest_pattern": "inverse_head_and_shoulders",
                    "reason": "peaks not above shoulder troughs",
                })
                continue

            shape_rules_passed = ["3_troughs_identified", "head_lower_than_both", "shoulders_near_equal", "neckline_defined"]

            dx = max(1, p_v2["index"] - p_v1["index"])
            slope = (v2_p - v1_p) / dx

            def get_neckline_y(idx: int) -> float:
                return v1_p + slope * (idx - p_v1["index"])

            duration_shoulders = p_rs["index"] - p_ls["index"]
            d1 = max(1, p_head["index"] - p_ls["index"])
            d2 = max(1, p_rs["index"] - p_head["index"])
            symmetry_score = round(1.0 - abs(d1 - d2) / max(d1, d2), 2)

            vol_ls = self._get_candle_volume(candles, p_ls["index"])
            vol_head = self._get_candle_volume(candles, p_head["index"])
            vol_rs = self._get_candle_volume(candles, p_rs["index"])

            gate_vol_head = (vol_head > vol_ls)
            gate_vol_rs = (vol_rs < vol_head)

            has_breakout, bo_idx, bo_price, wick_only = False, None, None, False
            bo_vol_ratio = 1.0

            if candles:
                for b in range(p_rs["index"] + 1, len(candles)):
                    c = candles[b]
                    c_neck = get_neckline_y(b)
                    close_p = float(c.get("close", 0.0))
                    high_p = float(c.get("high", close_p))

                    if close_p > c_neck:
                        has_breakout = True
                        bo_idx = b
                        bo_price = close_p
                        bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                        break
                    elif high_p > c_neck:
                        wick_only = True

            gate_bo_vol = (bo_vol_ratio >= 1.3)
            gate_confirmed_close = has_breakout

            retest_happened = False
            if has_breakout and bo_idx is not None and candles:
                c_neck_bo = get_neckline_y(bo_idx)
                retest_happened, _ = self.bo_val.retest_happened(candles, bo_idx, c_neck_bo, "bullish")

            logic_gates = {
                "volume_head > volume_LS": {"pass": gate_vol_head, "head": vol_head, "LS": vol_ls},
                "volume_RS < volume_head": {"pass": gate_vol_rs, "RS": vol_rs, "head": vol_head},
                "breakout_volume_ratio > 1.3": {"pass": gate_bo_vol, "value": bo_vol_ratio, "threshold": 1.3},
                "confirmed_close_above": {"pass": gate_confirmed_close, "wick_only": wick_only},
                "retest_after_breakout": {"pass": retest_happened, "note": "retest verified" if retest_happened else "not yet tested"},
            }

            time_rules = {
                "duration_between_shoulders": duration_shoulders,
                "symmetry_score": symmetry_score,
            }

            head_depth = abs(get_neckline_y(p_head["index"]) - head_p)
            neck_ref = get_neckline_y(bo_idx if bo_idx is not None else p_rs["index"])
            target1 = round(neck_ref + head_depth * 1.0, 2)
            target2 = round(neck_ref + head_depth * 1.618, 2)
            inv_price = round(rs_p, 2)
            inv_dist_pct = round(abs(neck_ref - inv_price) / neck_ref * 100, 1)

            is_failed = False
            fail_reason = None
            if has_breakout and bo_idx is not None and candles:
                for b in range(bo_idx + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) < inv_price:
                        is_failed = True
                        fail_reason = "Price closed back below Right Shoulder invalidation level"
                        break

            vol_score = 1.0 if (gate_vol_head and gate_vol_rs) else 0.5
            bo_score = 1.0 if (gate_bo_vol and gate_confirmed_close) else (0.5 if gate_confirmed_close else 0.0)
            time_score = min(1.0, max(0.5, symmetry_score))
            retest_bonus = 0.05 if retest_happened else 0.0

            base_score = (1.0 * 0.3) + (vol_score * 0.25) + (bo_score * 0.25) + (time_score * 0.2) + retest_bonus
            pattern_score = round(min(0.99, max(0.50, base_score)), 2)

            pattern_entry = {
                "pattern": "inverse_head_and_shoulders",
                "type": "reversal",
                "direction": "bullish",
                "points": {
                    "LS_high": {"index": p_v1["index"], "price": v1_p},
                    "LS_low": {"index": p_ls["index"], "price": ls_p},
                    "Head": {"index": p_head["index"], "price": head_p},
                    "RS_low": {"index": p_rs["index"], "price": rs_p},
                    "RS_high": {"index": p_v2["index"], "price": v2_p},
                    "neckline": {
                        "start": v1_p,
                        "end": v2_p,
                        "slope": round(slope, 5),
                    },
                },
                "shape_rules_passed": shape_rules_passed,
                "logic_gates": logic_gates,
                "time_rules": time_rules,
                "pattern_score": pattern_score,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_vol_ratio,
                } if has_breakout else None,
                "invalidation": {
                    "price": inv_price,
                    "method": "close back below right shoulder / neckline",
                    "distance_pct": inv_dist_pct,
                },
                "targets": [
                    {"price": target1, "method": "measured_move (neckline + head_depth)", "r_multiple": 1.0},
                    {"price": target2, "method": "1.618 extension", "r_multiple": 2.1},
                ],
                "volume_confirmation": {
                    "during_formation": "declining" if (gate_vol_head and gate_vol_rs) else "non_confirming",
                    "at_breakout": f"elevated_{bo_vol_ratio:.2f}x" if gate_bo_vol else f"low_{bo_vol_ratio:.2f}x",
                    "confirmed": bool(gate_vol_head and gate_vol_rs and gate_bo_vol),
                },
            }

            if is_failed:
                pattern_entry["status"] = "failed"
                pattern_entry["invalidation_reason"] = fail_reason
                confirmed.append(pattern_entry)
            elif not gate_vol_head:
                near_misses.append({
                    "pattern": "inverse_head_and_shoulders",
                    "reason": f"Volume at Head ({vol_head}) <= Left Shoulder ({vol_ls})",
                    "specific_gate": "volume_head > volume_LS",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not gate_vol_rs:
                near_misses.append({
                    "pattern": "inverse_head_and_shoulders",
                    "reason": f"Volume at Right Shoulder ({vol_rs}) >= Head ({vol_head})",
                    "specific_gate": "volume_RS < volume_head",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not has_breakout:
                pattern_entry["status"] = "forming"
                confirmed.append(pattern_entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": "inverse_head_and_shoulders",
                    "reason": f"Breakout volume ratio {bo_vol_ratio} below threshold 1.3",
                    "specific_gate": "breakout_volume_ratio > 1.3",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            else:
                pattern_entry["status"] = "confirmed"
                confirmed.append(pattern_entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 3. DOUBLE TOP
    # --------------------------------------------------------------------------
    def _detect_double_top(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 3:
            return confirmed, near_misses, rejected

        for i in range(n - 2):
            p1 = pivots[i]
            v = pivots[i + 1]
            p2 = pivots[i + 2]

            if not (p1["type"] == "peak" and v["type"] == "trough" and p2["type"] == "peak"):
                continue

            p1_p, v_p, p2_p = p1["price"], v["price"], p2["price"]
            avg_peak = (p1_p + p2_p) / 2.0
            diff_pct = abs(p1_p - p2_p) / avg_peak
            if diff_pct > 0.03:
                rejected.append({
                    "pivots": [p1["index"], v["index"], p2["index"]],
                    "closest_pattern": "double_top",
                    "reason": f"peaks differ by {diff_pct * 100:.2f}% (max 3%)",
                })
                continue

            valley_decline_pct = (min(p1_p, p2_p) - v_p) / avg_peak
            if valley_decline_pct < 0.03:
                rejected.append({
                    "pivots": [p1["index"], v["index"], p2["index"]],
                    "closest_pattern": "double_top",
                    "reason": f"valley decline {valley_decline_pct * 100:.2f}% is less than 3%",
                })
                continue

            spacing = p2["index"] - p1["index"]
            valley_dur = min(v["index"] - p1["index"], p2["index"] - v["index"])
            shape_rules_passed = ["2_peaks_identified", "peaks_within_3pct", "valley_between", "valley_decline_min_3pct"]

            vol_p1 = self._get_candle_volume(candles, p1["index"])
            vol_p2 = self._get_candle_volume(candles, p2["index"])
            gate_vol_p2 = (vol_p2 <= vol_p1 * 1.05)

            has_breakout, bo_idx, bo_price, wick_only = False, None, None, False
            bo_vol_ratio = 1.0

            if candles:
                for b in range(p2["index"] + 1, len(candles)):
                    c = candles[b]
                    close_p = float(c.get("close", 0.0))
                    low_p = float(c.get("low", close_p))

                    if close_p < v_p:
                        has_breakout = True
                        bo_idx = b
                        bo_price = close_p
                        bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                        break
                    elif low_p < v_p:
                        wick_only = True

            gate_bo_vol = (bo_vol_ratio >= 1.2)
            gate_confirmed_close = has_breakout

            retest_happened = False
            if has_breakout and bo_idx is not None and candles:
                retest_happened, _ = self.bo_val.retest_happened(candles, bo_idx, v_p, "bearish")

            pattern_height = avg_peak - v_p
            target1 = round(v_p - pattern_height * 1.0, 2)
            target2 = round(v_p - pattern_height * 1.618, 2)
            inv_price = round(max(p1_p, p2_p), 2)
            inv_dist_pct = round(abs(inv_price - v_p) / v_p * 100, 1)

            is_failed = False
            fail_reason = None
            if has_breakout and bo_idx is not None and candles:
                for b in range(bo_idx + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) > inv_price:
                        is_failed = True
                        fail_reason = "Price closed back above peak invalidation level"
                        break

            vol_score = 1.0 if gate_vol_p2 else 0.5
            bo_score = 1.0 if (gate_bo_vol and gate_confirmed_close) else (0.5 if gate_confirmed_close else 0.0)
            base_score = 0.35 + (vol_score * 0.3) + (bo_score * 0.3) + (0.05 if retest_happened else 0.0)
            pattern_score = round(min(0.99, max(0.50, base_score)), 2)

            pattern_entry = {
                "pattern": "double_top",
                "type": "reversal",
                "direction": "bearish",
                "points": {
                    "peak1": {"index": p1["index"], "price": p1_p},
                    "valley": {"index": v["index"], "price": v_p},
                    "peak2": {"index": p2["index"], "price": p2_p},
                },
                "shape_rules_passed": shape_rules_passed,
                "logic_gates": {
                    "volume_peak2 <= volume_peak1": {"pass": gate_vol_p2, "peak1": vol_p1, "peak2": vol_p2},
                    "breakout_volume_ratio > 1.2": {"pass": gate_bo_vol, "value": bo_vol_ratio, "threshold": 1.2},
                    "confirmed_close_below": {"pass": gate_confirmed_close, "wick_only": wick_only},
                    "retest_after_breakout": {"pass": retest_happened, "note": "retest verified" if retest_happened else "not yet tested"},
                },
                "time_rules": {
                    "peaks_spacing": spacing,
                    "valley_duration": valley_dur,
                },
                "pattern_score": pattern_score,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_vol_ratio,
                } if has_breakout else None,
                "invalidation": {
                    "price": inv_price,
                    "method": "close back above peak",
                    "distance_pct": inv_dist_pct,
                },
                "targets": [
                    {"price": target1, "method": "measured_move (valley - height)", "r_multiple": 1.0},
                    {"price": target2, "method": "1.618 extension", "r_multiple": 2.1},
                ],
                "volume_confirmation": {
                    "during_formation": "declining" if gate_vol_p2 else "elevated_second_peak",
                    "at_breakout": f"elevated_{bo_vol_ratio:.2f}x" if gate_bo_vol else f"low_{bo_vol_ratio:.2f}x",
                    "confirmed": bool(gate_vol_p2 and gate_bo_vol),
                },
            }

            if is_failed:
                pattern_entry["status"] = "failed"
                pattern_entry["invalidation_reason"] = fail_reason
                confirmed.append(pattern_entry)
            elif not gate_vol_p2:
                near_misses.append({
                    "pattern": "double_top",
                    "reason": f"Volume peak2 ({vol_p2}) > peak1 ({vol_p1}) (should decline)",
                    "specific_gate": "volume_peak2 <= volume_peak1",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not has_breakout:
                pattern_entry["status"] = "forming"
                confirmed.append(pattern_entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": "double_top",
                    "reason": f"Breakout volume ratio {bo_vol_ratio} below threshold 1.2",
                    "specific_gate": "breakout_volume_ratio > 1.2",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            else:
                pattern_entry["status"] = "confirmed"
                confirmed.append(pattern_entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 4. DOUBLE BOTTOM
    # --------------------------------------------------------------------------
    def _detect_double_bottom(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 3:
            return confirmed, near_misses, rejected

        for i in range(n - 2):
            t1 = pivots[i]
            p = pivots[i + 1]
            t2 = pivots[i + 2]

            if not (t1["type"] == "trough" and p["type"] == "peak" and t2["type"] == "trough"):
                continue

            t1_p, p_p, t2_p = t1["price"], p["price"], t2["price"]
            avg_trough = (t1_p + t2_p) / 2.0
            diff_pct = abs(t1_p - t2_p) / avg_trough
            if diff_pct > 0.03:
                rejected.append({
                    "pivots": [t1["index"], p["index"], t2["index"]],
                    "closest_pattern": "double_bottom",
                    "reason": f"troughs differ by {diff_pct * 100:.2f}% (max 3%)",
                })
                continue

            peak_rally_pct = (p_p - max(t1_p, t2_p)) / avg_trough
            if peak_rally_pct < 0.03:
                rejected.append({
                    "pivots": [t1["index"], p["index"], t2["index"]],
                    "closest_pattern": "double_bottom",
                    "reason": f"peak rally {peak_rally_pct * 100:.2f}% is less than 3%",
                })
                continue

            spacing = t2["index"] - t1["index"]
            peak_dur = min(p["index"] - t1["index"], t2["index"] - p["index"])
            shape_rules_passed = ["2_troughs_identified", "troughs_within_3pct", "peak_between", "peak_rally_min_3pct"]

            vol_t1 = self._get_candle_volume(candles, t1["index"])
            vol_t2 = self._get_candle_volume(candles, t2["index"])
            gate_vol_t2 = (vol_t2 <= vol_t1 * 1.05)

            has_breakout, bo_idx, bo_price, wick_only = False, None, None, False
            bo_vol_ratio = 1.0

            if candles:
                for b in range(t2["index"] + 1, len(candles)):
                    c = candles[b]
                    close_p = float(c.get("close", 0.0))
                    high_p = float(c.get("high", close_p))

                    if close_p > p_p:
                        has_breakout = True
                        bo_idx = b
                        bo_price = close_p
                        bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                        break
                    elif high_p > p_p:
                        wick_only = True

            gate_bo_vol = (bo_vol_ratio >= 1.2)
            gate_confirmed_close = has_breakout

            retest_happened = False
            if has_breakout and bo_idx is not None and candles:
                retest_happened, _ = self.bo_val.retest_happened(candles, bo_idx, p_p, "bullish")

            pattern_height = p_p - avg_trough
            target1 = round(p_p + pattern_height * 1.0, 2)
            target2 = round(p_p + pattern_height * 1.618, 2)
            inv_price = round(min(t1_p, t2_p), 2)
            inv_dist_pct = round(abs(p_p - inv_price) / p_p * 100, 1)

            is_failed = False
            fail_reason = None
            if has_breakout and bo_idx is not None and candles:
                for b in range(bo_idx + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) < inv_price:
                        is_failed = True
                        fail_reason = "Price closed back below trough invalidation level"
                        break

            vol_score = 1.0 if gate_vol_t2 else 0.5
            bo_score = 1.0 if (gate_bo_vol and gate_confirmed_close) else (0.5 if gate_confirmed_close else 0.0)
            base_score = 0.35 + (vol_score * 0.3) + (bo_score * 0.3) + (0.05 if retest_happened else 0.0)
            pattern_score = round(min(0.99, max(0.50, base_score)), 2)

            pattern_entry = {
                "pattern": "double_bottom",
                "type": "reversal",
                "direction": "bullish",
                "points": {
                    "trough1": {"index": t1["index"], "price": t1_p},
                    "peak": {"index": p["index"], "price": p_p},
                    "trough2": {"index": t2["index"], "price": t2_p},
                },
                "shape_rules_passed": shape_rules_passed,
                "logic_gates": {
                    "volume_trough2 <= volume_trough1": {"pass": gate_vol_t2, "trough1": vol_t1, "trough2": vol_t2},
                    "breakout_volume_ratio > 1.2": {"pass": gate_bo_vol, "value": bo_vol_ratio, "threshold": 1.2},
                    "confirmed_close_above": {"pass": gate_confirmed_close, "wick_only": wick_only},
                    "retest_after_breakout": {"pass": retest_happened, "note": "retest verified" if retest_happened else "not yet tested"},
                },
                "time_rules": {
                    "troughs_spacing": spacing,
                    "peak_duration": peak_dur,
                },
                "pattern_score": pattern_score,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_vol_ratio,
                } if has_breakout else None,
                "invalidation": {
                    "price": inv_price,
                    "method": "close back below trough",
                    "distance_pct": inv_dist_pct,
                },
                "targets": [
                    {"price": target1, "method": "measured_move (peak + height)", "r_multiple": 1.0},
                    {"price": target2, "method": "1.618 extension", "r_multiple": 2.1},
                ],
                "volume_confirmation": {
                    "during_formation": "declining" if gate_vol_t2 else "elevated_second_trough",
                    "at_breakout": f"elevated_{bo_vol_ratio:.2f}x" if gate_bo_vol else f"low_{bo_vol_ratio:.2f}x",
                    "confirmed": bool(gate_vol_t2 and gate_bo_vol),
                },
            }

            if is_failed:
                pattern_entry["status"] = "failed"
                pattern_entry["invalidation_reason"] = fail_reason
                confirmed.append(pattern_entry)
            elif not gate_vol_t2:
                near_misses.append({
                    "pattern": "double_bottom",
                    "reason": f"Volume trough2 ({vol_t2}) > trough1 ({vol_t1}) (should decline)",
                    "specific_gate": "volume_trough2 <= volume_trough1",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            elif not has_breakout:
                pattern_entry["status"] = "forming"
                confirmed.append(pattern_entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": "double_bottom",
                    "reason": f"Breakout volume ratio {bo_vol_ratio} below threshold 1.2",
                    "specific_gate": "breakout_volume_ratio > 1.2",
                    "would_score": round(pattern_score * 0.7, 2),
                })
            else:
                pattern_entry["status"] = "confirmed"
                confirmed.append(pattern_entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 5. TRIANGLES (Ascending, Descending, Symmetrical)
    # --------------------------------------------------------------------------
    def _detect_triangles(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 4:
            return confirmed, near_misses, rejected

        for i in range(n - 3):
            sub = pivots[i : i + 4]
            peaks = [p for p in sub if p["type"] == "peak"]
            troughs = [p for p in sub if p["type"] == "trough"]

            if len(peaks) != 2 or len(troughs) != 2:
                continue

            pk1, pk2 = peaks[0], peaks[1]
            tr1, tr2 = troughs[0], troughs[1]

            # Ascending Triangle: flat resistance, rising support
            flat_res = abs(pk1["price"] - pk2["price"]) / ((pk1["price"] + pk2["price"]) / 2.0) <= 0.02
            rising_sup = tr2["price"] > tr1["price"] + 0.01 * tr1["price"]

            # Descending Triangle: flat support, falling resistance
            flat_sup = abs(tr1["price"] - tr2["price"]) / ((tr1["price"] + tr2["price"]) / 2.0) <= 0.02
            falling_res = pk2["price"] < pk1["price"] - 0.01 * pk1["price"]

            # Symmetrical Triangle: falling resistance AND rising support
            sym_converge = (pk2["price"] < pk1["price"]) and (tr2["price"] > tr1["price"])

            tri_type = None
            if flat_res and rising_sup:
                tri_type = "ascending_triangle"
                direction = "bullish"
                breakout_level = max(pk1["price"], pk2["price"])
                inv_level = tr2["price"]
                thresh = 1.5
            elif flat_sup and falling_res:
                tri_type = "descending_triangle"
                direction = "bearish"
                breakout_level = min(tr1["price"], tr2["price"])
                inv_level = pk2["price"]
                thresh = 1.5
            elif sym_converge:
                tri_type = "symmetrical_triangle"
                direction = "continuation"
                breakout_level = pk2["price"]
                inv_level = tr2["price"]
                thresh = 1.4

            if not tri_type:
                continue

            # Volume contraction during triangle formation
            prof = self.vol_val.formation_volume_profile(candles, sub[0]["index"], sub[-1]["index"])
            vol_contracting = (prof.get("profile") == "declining")

            # Breakout search
            last_idx = sub[-1]["index"]
            has_breakout, bo_idx, bo_price, wick_only = False, None, None, False
            bo_vol_ratio = 1.0

            if candles:
                for b in range(last_idx + 1, len(candles)):
                    c = candles[b]
                    close_p = float(c.get("close", 0.0))
                    high_p = float(c.get("high", close_p))
                    low_p = float(c.get("low", close_p))

                    if direction == "bullish" or (direction == "continuation" and close_p > breakout_level):
                        if close_p > breakout_level:
                            has_breakout = True
                            bo_idx = b
                            bo_price = close_p
                            bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                            break
                        elif high_p > breakout_level:
                            wick_only = True
                    elif direction == "bearish" or (direction == "continuation" and close_p < inv_level):
                        if close_p < breakout_level:
                            has_breakout = True
                            bo_idx = b
                            bo_price = close_p
                            bo_vol_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                            break
                        elif low_p < breakout_level:
                            wick_only = True

            gate_bo_vol = (bo_vol_ratio >= thresh)
            tri_height = abs(pk1["price"] - tr1["price"])
            target1 = round(breakout_level + tri_height if direction != "bearish" else breakout_level - tri_height, 2)
            target2 = round(breakout_level + tri_height * 1.618 if direction != "bearish" else breakout_level - tri_height * 1.618, 2)

            pattern_score = 0.88 if (has_breakout and gate_bo_vol and vol_contracting) else 0.70

            entry = {
                "pattern": tri_type,
                "type": "continuation",
                "direction": direction,
                "points": {
                    "peak1": {"index": pk1["index"], "price": pk1["price"]},
                    "peak2": {"index": pk2["index"], "price": pk2["price"]},
                    "trough1": {"index": tr1["index"], "price": tr1["price"]},
                    "trough2": {"index": tr2["index"], "price": tr2["price"]},
                },
                "shape_rules_passed": ["converging_lines", "valid_boundary_touches"],
                "logic_gates": {
                    "volume_contracting_into_apex": {"pass": vol_contracting, "profile": prof.get("profile")},
                    f"breakout_volume_ratio > {thresh}": {"pass": gate_bo_vol, "value": bo_vol_ratio},
                    "confirmed_close": {"pass": has_breakout, "wick_only": wick_only},
                },
                "pattern_score": pattern_score,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_vol_ratio,
                } if has_breakout else None,
                "invalidation": {
                    "price": inv_level,
                    "method": "close back across boundary",
                },
                "targets": [
                    {"price": target1, "method": "measured_move (triangle base height)", "r_multiple": 1.0},
                    {"price": target2, "method": "1.618 extension", "r_multiple": 1.8},
                ],
            }

            if not vol_contracting:
                near_misses.append({
                    "pattern": tri_type,
                    "reason": f"Volume not contracting during formation (profile: {prof.get('profile')})",
                    "specific_gate": "volume_contracting_into_apex",
                    "would_score": 0.65,
                })
            elif not has_breakout:
                entry["status"] = "forming"
                confirmed.append(entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": tri_type,
                    "reason": f"Breakout volume ratio {bo_vol_ratio} below threshold {thresh}",
                    "specific_gate": f"breakout_volume_ratio > {thresh}",
                    "would_score": 0.65,
                })
            else:
                entry["status"] = "confirmed"
                confirmed.append(entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 6. FLAGS (Bull Flag & Bear Flag)
    # --------------------------------------------------------------------------
    def _detect_flags(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 3:
            return confirmed, near_misses, rejected

        for i in range(n - 2):
            p0 = pivots[i]
            p1 = pivots[i + 1]
            p2 = pivots[i + 2]

            # Bull Flag: p0 trough -> p1 peak (sharp pole up >= 5% in <= 15 bars), p2 trough (retraces < 50%)
            if p0["type"] == "trough" and p1["type"] == "peak" and p2["type"] == "trough":
                pole_height = p1["price"] - p0["price"]
                pole_bars = max(1, p1["index"] - p0["index"])
                pole_pct = pole_height / p0["price"]

                if pole_pct >= 0.05 and pole_bars <= 15:
                    retrace = (p1["price"] - p2["price"]) / pole_height
                    if retrace < 0.50:
                        # Check consolidation volume contracting
                        flag_prof = self.vol_val.formation_volume_profile(candles, p1["index"], p2["index"])
                        vol_low_flag = (flag_prof.get("profile") == "declining")

                        # Breakout above pole peak
                        has_bo, bo_idx, bo_price = False, None, None
                        bo_ratio = 1.0
                        if candles:
                            for b in range(p2["index"] + 1, len(candles)):
                                if float(candles[b].get("close", 0.0)) > p1["price"]:
                                    has_bo = True
                                    bo_idx = b
                                    bo_price = float(candles[b]["close"])
                                    bo_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                                    break

                        gate_vol_spike = (bo_ratio >= 1.4)
                        entry = {
                            "pattern": "bull_flag",
                            "type": "continuation",
                            "direction": "bullish",
                            "points": {
                                "pole_origin": {"index": p0["index"], "price": p0["price"]},
                                "pole_peak": {"index": p1["index"], "price": p1["price"]},
                                "flag_low": {"index": p2["index"], "price": p2["price"]},
                            },
                            "shape_rules_passed": ["sharp_pole_up", "consolidation_retraces_less_than_50pct"],
                            "logic_gates": {
                                "volume_consolidation_low": {"pass": vol_low_flag},
                                "breakout_volume_spike": {"pass": gate_vol_spike, "value": bo_ratio},
                                "confirmed_close": {"pass": has_bo},
                            },
                            "pattern_score": 0.90 if (has_bo and gate_vol_spike) else 0.75,
                            "breakout": {
                                "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                                "price": bo_price,
                                "volume_ratio": bo_ratio,
                            } if has_bo else None,
                            "invalidation": {
                                "price": p2["price"],
                                "method": "close below flag low",
                            },
                            "targets": [
                                {"price": round(p1["price"] + pole_height, 2), "method": "measured_move (breakout + pole_height)", "r_multiple": 1.5},
                            ],
                        }
                        if not has_bo:
                            entry["status"] = "forming"
                            confirmed.append(entry)
                        elif not gate_vol_spike:
                            near_misses.append({
                                "pattern": "bull_flag",
                                "reason": f"Breakout volume ratio {bo_ratio} below threshold 1.4",
                                "specific_gate": "breakout_volume_spike",
                                "would_score": 0.65,
                            })
                        else:
                            entry["status"] = "confirmed"
                            confirmed.append(entry)

            # Bear Flag: p0 peak -> p1 trough (sharp pole down >= 5%), p2 peak (retraces < 50%)
            elif p0["type"] == "peak" and p1["type"] == "trough" and p2["type"] == "peak":
                pole_height = p0["price"] - p1["price"]
                pole_bars = max(1, p1["index"] - p0["index"])
                pole_pct = pole_height / p0["price"]

                if pole_pct >= 0.05 and pole_bars <= 15:
                    retrace = (p2["price"] - p1["price"]) / pole_height
                    if retrace < 0.50:
                        has_bo, bo_idx, bo_price = False, None, None
                        bo_ratio = 1.0
                        if candles:
                            for b in range(p2["index"] + 1, len(candles)):
                                if float(candles[b].get("close", 0.0)) < p1["price"]:
                                    has_bo = True
                                    bo_idx = b
                                    bo_price = float(candles[b]["close"])
                                    bo_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                                    break

                        gate_vol_spike = (bo_ratio >= 1.4)
                        entry = {
                            "pattern": "bear_flag",
                            "type": "continuation",
                            "direction": "bearish",
                            "points": {
                                "pole_origin": {"index": p0["index"], "price": p0["price"]},
                                "pole_trough": {"index": p1["index"], "price": p1["price"]},
                                "flag_high": {"index": p2["index"], "price": p2["price"]},
                            },
                            "shape_rules_passed": ["sharp_pole_down", "consolidation_retraces_less_than_50pct"],
                            "logic_gates": {
                                "breakout_volume_spike": {"pass": gate_vol_spike, "value": bo_ratio},
                                "confirmed_close": {"pass": has_bo},
                            },
                            "pattern_score": 0.90 if (has_bo and gate_vol_spike) else 0.75,
                            "breakout": {
                                "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                                "price": bo_price,
                                "volume_ratio": bo_ratio,
                            } if has_bo else None,
                            "invalidation": {
                                "price": p2["price"],
                                "method": "close above flag high",
                            },
                            "targets": [
                                {"price": round(p1["price"] - pole_height, 2), "method": "measured_move (breakout - pole_height)", "r_multiple": 1.5},
                            ],
                        }
                        if not has_bo:
                            entry["status"] = "forming"
                            confirmed.append(entry)
                        elif not gate_vol_spike:
                            near_misses.append({
                                "pattern": "bear_flag",
                                "reason": f"Breakout volume ratio {bo_ratio} below threshold 1.4",
                                "specific_gate": "breakout_volume_spike",
                                "would_score": 0.65,
                            })
                        else:
                            entry["status"] = "confirmed"
                            confirmed.append(entry)

        return confirmed, near_misses, rejected

    # --------------------------------------------------------------------------
    # 7. CUP AND HANDLE
    # --------------------------------------------------------------------------
    def _detect_cup_and_handle(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        confirmed, near_misses, rejected = [], [], []
        n = len(pivots)
        if n < 4:
            return confirmed, near_misses, rejected

        for i in range(n - 3):
            p_left = pivots[i]
            p_bot = pivots[i + 1]
            p_right = pivots[i + 2]
            p_handle = pivots[i + 3]

            if not (
                p_left["type"] == "peak"
                and p_bot["type"] == "trough"
                and p_right["type"] == "peak"
                and p_handle["type"] == "trough"
            ):
                continue

            rim_diff_pct = abs(p_left["price"] - p_right["price"]) / ((p_left["price"] + p_right["price"]) / 2.0)
            if rim_diff_pct > 0.03:
                continue

            cup_depth = ((p_left["price"] + p_right["price"]) / 2.0) - p_bot["price"]
            if cup_depth <= 0 or (cup_depth / p_left["price"]) < 0.03:
                continue

            handle_pullback = (p_right["price"] - p_handle["price"]) / cup_depth
            if not (0.05 <= handle_pullback <= 0.40):
                continue

            # Breakout above right rim
            rim_level = p_right["price"]
            has_bo, bo_idx, bo_price = False, None, None
            bo_ratio = 1.0
            if candles:
                for b in range(p_handle["index"] + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) > rim_level:
                        has_bo = True
                        bo_idx = b
                        bo_price = float(candles[b]["close"])
                        bo_ratio = self.vol_val.breakout_volume_ratio(candles, bo_idx)
                        break

            gate_bo_vol = (bo_ratio >= 1.3)
            entry = {
                "pattern": "cup_and_handle",
                "type": "continuation",
                "direction": "bullish",
                "points": {
                    "left_rim": {"index": p_left["index"], "price": p_left["price"]},
                    "cup_bottom": {"index": p_bot["index"], "price": p_bot["price"]},
                    "right_rim": {"index": p_right["index"], "price": p_right["price"]},
                    "handle_low": {"index": p_handle["index"], "price": p_handle["price"]},
                },
                "shape_rules_passed": ["rounded_cup_symmetry", "shallow_handle_pullback"],
                "logic_gates": {
                    "breakout_volume_ratio > 1.3": {"pass": gate_bo_vol, "value": bo_ratio},
                    "confirmed_close": {"pass": has_bo},
                },
                "pattern_score": 0.91 if (has_bo and gate_bo_vol) else 0.74,
                "breakout": {
                    "confirmed_at": candles[bo_idx].get("time", str(bo_idx)) if bo_idx is not None else None,
                    "price": bo_price,
                    "volume_ratio": bo_ratio,
                } if has_bo else None,
                "invalidation": {
                    "price": p_handle["price"],
                    "method": "close below handle low",
                },
                "targets": [
                    {"price": round(rim_level + cup_depth, 2), "method": "measured_move (breakout + cup_depth)", "r_multiple": 1.5},
                ],
            }
            if not has_bo:
                entry["status"] = "forming"
                confirmed.append(entry)
            elif not gate_bo_vol:
                near_misses.append({
                    "pattern": "cup_and_handle",
                    "reason": f"Breakout volume ratio {bo_ratio} below threshold 1.3",
                    "specific_gate": "breakout_volume_ratio > 1.3",
                    "would_score": 0.65,
                })
            else:
                entry["status"] = "confirmed"
                confirmed.append(entry)

        return confirmed, near_misses, rejected

    def detect(
        self,
        symbol: str,
        timeframe: str,
        pivots: Union[Dict[str, Any], List[Dict[str, Any]]],
        candles: Optional[List[Dict[str, Any]]] = None,
        min_degree: int = 1,
        pattern: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Runs classical pattern detection over pivots and candles.
        If `pattern` is specified, only tests for that specific pattern type.
        """
        candles = candles or []
        pivots_list = self._extract_pivots_list(pivots, min_degree=min_degree)
        computed_at = datetime.now(timezone.utc).isoformat()

        all_patterns = []
        all_near_misses = []
        all_rejected = []

        # Helper to check if a pattern should run
        def should_run(name: str) -> bool:
            if pattern is None:
                return True
            return pattern == name or (name in ["ascending_triangle", "descending_triangle", "symmetrical_triangle"] and pattern == "triangles")

        # 1. Head and Shoulders
        if should_run("head_and_shoulders"):
            pats, nms, rejs = self._detect_head_and_shoulders(pivots_list, candles)
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 2. Inverse Head and Shoulders
        if should_run("inverse_head_and_shoulders"):
            pats, nms, rejs = self._detect_inverse_head_and_shoulders(pivots_list, candles)
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 3. Triangles (Ascending, Descending, Symmetrical)
        if should_run("ascending_triangle") or should_run("descending_triangle") or should_run("symmetrical_triangle") or should_run("triangles"):
            pats, nms, rejs = self._detect_triangles(pivots_list, candles)
            if pattern and pattern in ["ascending_triangle", "descending_triangle", "symmetrical_triangle"]:
                pats = [p for p in pats if p["pattern"] == pattern]
                nms = [nm for nm in nms if nm["pattern"] == pattern]
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 4. Flags (Bull & Bear)
        if should_run("bull_flag") or should_run("bear_flag") or should_run("flags"):
            pats, nms, rejs = self._detect_flags(pivots_list, candles)
            if pattern and pattern in ["bull_flag", "bear_flag"]:
                pats = [p for p in pats if p["pattern"] == pattern]
                nms = [nm for nm in nms if nm["pattern"] == pattern]
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 5. Cup and Handle
        if should_run("cup_and_handle"):
            pats, nms, rejs = self._detect_cup_and_handle(pivots_list, candles)
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 6. Double Top
        if should_run("double_top"):
            pats, nms, rejs = self._detect_double_top(pivots_list, candles)
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # 7. Double Bottom
        if should_run("double_bottom"):
            pats, nms, rejs = self._detect_double_bottom(pivots_list, candles)
            all_patterns.extend(pats)
            all_near_misses.extend(nms)
            all_rejected.extend(rejs)

        # Sub-slice subsumption deduplication when running all patterns
        if pattern is None and len(all_patterns) > 1:
            higher_spans = []
            for p in all_patterns:
                pts = p.get("points", {})
                indices = [v.get("index") for v in pts.values() if isinstance(v, dict) and "index" in v]
                if indices and len(indices) >= 4:
                    higher_spans.append((min(indices), max(indices)))

            filtered_pats = []
            for p in all_patterns:
                pts = p.get("points", {})
                indices = [v.get("index") for v in pts.values() if isinstance(v, dict) and "index" in v]
                if not indices or len(indices) >= 4:
                    filtered_pats.append(p)
                else:
                    # 3-point pattern (e.g. double top/bottom)
                    p_min, p_max = min(indices), max(indices)
                    is_subsumed = any(h_min <= p_min and p_max <= h_max for h_min, h_max in higher_spans)
                    if not is_subsumed:
                        filtered_pats.append(p)
            all_patterns = filtered_pats

        # Status determination
        if len(pivots_list) < 3:
            status = "unavailable"
            status_reason = "insufficient_pivots"
            status_message_ar = "عدد نقاط التحول غير كافٍ لاكتشاف النماذج الكلاسيكية"
            status_message_en = "Insufficient validated pivots to detect classical patterns"
        elif len(all_patterns) == 0:
            status = "unavailable"
            status_reason = "no_classical_patterns_found"
            status_message_ar = "السوق في نطاق عرضي — لا تتوفر نماذج فنية كلاسيكية مؤكدة حالياً"
            status_message_en = "Range-bound market — no confirmed classical patterns available"
        else:
            status = "available"
            status_reason = None
            status_message_ar = f"تم العثور على {len(all_patterns)} نموذج فني كلاسيكي"
            status_message_en = f"Found {len(all_patterns)} classical chart pattern(s)"

        all_patterns.sort(key=lambda x: x.get("pattern_score", 0.0), reverse=True)

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "status": status,
            "status_reason": status_reason,
            "status_message_ar": status_message_ar,
            "status_message_en": status_message_en,
            "patterns": all_patterns,
            "near_misses": all_near_misses,
            "rejected_candidates": all_rejected,
            "data_quality": {
                "pivots_used": len(pivots_list),
                "patterns_found": len(all_patterns),
                "near_misses": len(all_near_misses),
                "rejected": len(all_rejected),
            },
        }


global_classical_detector = ClassicalPatternDetector()
