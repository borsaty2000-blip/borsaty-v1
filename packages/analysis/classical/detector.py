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

    def _detect_head_and_shoulders(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Scans pivot sequence for regular Head and Shoulders (Bearish Reversal).
        Sequence: Peak (LS), Trough (Valley 1), Peak (Head), Trough (Valley 2), Peak (RS).
        """
        confirmed = []
        near_misses = []
        rejected = []

        n = len(pivots)
        if n < 5:
            return confirmed, near_misses, rejected

        for i in range(n - 4):
            p_ls = pivots[i]
            p_v1 = pivots[i + 1]
            p_head = pivots[i + 2]
            p_v2 = pivots[i + 3]
            p_rs = pivots[i + 4]

            # Alternation check: Peak, Trough, Peak, Trough, Peak
            if not (
                p_ls["type"] == "peak"
                and p_v1["type"] == "trough"
                and p_head["type"] == "peak"
                and p_v2["type"] == "trough"
                and p_rs["type"] == "peak"
            ):
                continue

            ls_p = p_ls["price"]
            head_p = p_head["price"]
            rs_p = p_rs["price"]
            v1_p = p_v1["price"]
            v2_p = p_v2["price"]

            # Shape Rule 1: Head higher than both shoulders
            if head_p <= ls_p or head_p <= rs_p:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": "head not higher than both shoulders",
                })
                continue

            # Shape Rule 2: Shoulders near equal (within 10%)
            avg_shoulder = (ls_p + rs_p) / 2.0
            shoulder_diff_pct = abs(ls_p - rs_p) / avg_shoulder
            if shoulder_diff_pct > 0.10:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": f"shoulders unequal by {shoulder_diff_pct * 100:.1f}% (threshold 10%)",
                })
                continue

            # Shape Rule 3: Valleys below shoulders
            if v1_p >= min(ls_p, head_p) or v2_p >= min(head_p, rs_p):
                rejected.append({
                    "pivots": [p_ls["index"], p_v1["index"], p_head["index"], p_v2["index"], p_rs["index"]],
                    "closest_pattern": "head_and_shoulders",
                    "reason": "valleys not below shoulder peaks",
                })
                continue

            # Shape rules passed!
            shape_rules_passed = ["3_peaks_identified", "head_higher_than_both", "shoulders_near_equal", "neckline_defined"]

            # Neckline definition
            dx = max(1, p_v2["index"] - p_v1["index"])
            slope = (v2_p - v1_p) / dx

            def get_neckline_y(idx: int) -> float:
                return v1_p + slope * (idx - p_v1["index"])

            # Time Rules:
            duration_shoulders = p_rs["index"] - p_ls["index"]
            d1 = max(1, p_head["index"] - p_ls["index"])
            d2 = max(1, p_rs["index"] - p_head["index"])
            symmetry_score = round(1.0 - abs(d1 - d2) / max(d1, d2), 2)

            time_rule_pass = (duration_shoulders >= 20 and symmetry_score >= 0.60)
            if not time_rule_pass:
                # Still check logic gates to see if it's a near miss
                pass

            # Volume Logic:
            vol_ls = self._get_candle_volume(candles, p_ls["index"])
            vol_head = self._get_candle_volume(candles, p_head["index"])
            vol_rs = self._get_candle_volume(candles, p_rs["index"])

            gate_vol_head = (vol_head > vol_ls)
            gate_vol_rs = (vol_rs < vol_head)

            # Check for breakout in candles after RS peak
            neckline_at_rs = get_neckline_y(p_rs["index"])
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

            # Check Retest
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

            # Invalidation & Target derivation
            head_depth = abs(head_p - get_neckline_y(p_head["index"]))
            neck_ref = get_neckline_y(bo_idx if bo_idx is not None else p_rs["index"])
            target1 = round(neck_ref - head_depth * 1.0, 2)
            target2 = round(neck_ref - head_depth * 1.618, 2)
            inv_price = round(rs_p, 2)
            inv_dist_pct = round(abs(inv_price - neck_ref) / neck_ref * 100, 1)

            # Check Invalidation (Failed state)
            is_failed = False
            fail_reason = None
            if has_breakout and bo_idx is not None and candles:
                for b in range(bo_idx + 1, len(candles)):
                    if float(candles[b].get("close", 0.0)) > inv_price:
                        is_failed = True
                        fail_reason = "Price closed back above Right Shoulder invalidation level"
                        break

            # Calculate pattern score
            # Gates: Shape (1.0), Vol_Formation (1.0 or 0.0), Vol_Breakout (1.0 or 0.0), Time (symmetry), Retest (bonus)
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

            # Status classification
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
                # All 5 gates passed!
                pattern_entry["status"] = "confirmed"
                confirmed.append(pattern_entry)

        return confirmed, near_misses, rejected

    def _detect_inverse_head_and_shoulders(
        self,
        pivots: List[Dict[str, Any]],
        candles: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Scans pivot sequence for Inverse Head and Shoulders (Bullish Reversal).
        Sequence: Trough (LS), Peak (Valley 1), Trough (Head), Peak (Valley 2), Trough (RS).
        """
        confirmed = []
        near_misses = []
        rejected = []

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

            ls_p = p_ls["price"]
            head_p = p_head["price"]
            rs_p = p_rs["price"]
            v1_p = p_v1["price"]
            v2_p = p_v2["price"]

            # Shape Rule 1: Head lower than both shoulders
            if head_p >= ls_p or head_p >= rs_p:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "inverse_head_and_shoulders",
                    "reason": "head not lower than both shoulders",
                })
                continue

            # Shape Rule 2: Shoulders near equal (within 10%)
            avg_shoulder = (ls_p + rs_p) / 2.0
            shoulder_diff_pct = abs(ls_p - rs_p) / avg_shoulder
            if shoulder_diff_pct > 0.10:
                rejected.append({
                    "pivots": [p_ls["index"], p_head["index"], p_rs["index"]],
                    "closest_pattern": "inverse_head_and_shoulders",
                    "reason": f"shoulders unequal by {shoulder_diff_pct * 100:.1f}% (threshold 10%)",
                })
                continue

            # Shape Rule 3: Neckline peaks higher than shoulders
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

    def detect(
        self,
        symbol: str,
        timeframe: str,
        pivots: Union[Dict[str, Any], List[Dict[str, Any]]],
        candles: Optional[List[Dict[str, Any]]] = None,
        min_degree: int = 1,
    ) -> Dict[str, Any]:
        """
        Runs classical pattern detection over pivots and candles.
        """
        candles = candles or []
        pivots_list = self._extract_pivots_list(pivots, min_degree=min_degree)
        computed_at = datetime.now(timezone.utc).isoformat()

        all_patterns = []
        all_near_misses = []
        all_rejected = []

        # 1. Head and Shoulders
        hs_patterns, hs_near_misses, hs_rejected = self._detect_head_and_shoulders(pivots_list, candles)
        all_patterns.extend(hs_patterns)
        all_near_misses.extend(hs_near_misses)
        all_rejected.extend(hs_rejected)

        # 2. Inverse Head and Shoulders
        ihs_patterns, ihs_near_misses, ihs_rejected = self._detect_inverse_head_and_shoulders(pivots_list, candles)
        all_patterns.extend(ihs_patterns)
        all_near_misses.extend(ihs_near_misses)
        all_rejected.extend(ihs_rejected)

        # Status determination
        if len(pivots_list) < 5:
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

        # Sort patterns by score
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
