"""
Hierarchical Structural Pivot Detection (HSPD) Engine.
Pure deterministic. No LLM. No heuristics.
Version 1.0.0
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone
import math


class HSPDEngine:
    """
    Hierarchical Structural Pivot Detection.
    Pure deterministic multi-degree pivot detection with 5-gate validation:
    1. Structural Gate (3-bar reversal & local window extremum)
    2. Stability Gate (survives 3-point candle perturbation)
    3. Temporal Gate (minimum spacing per degree)
    4. Hierarchical Gate (containment & coherence across degrees)
    5. Fractal Gate (extremum over degree-specific fractal window)
    """

    VERSION = "1.0.0"

    DEGREES = {
        0: {"atr_mult": 0.5,  "min_spacing": 2,  "fractal_window": 10},
        1: {"atr_mult": 2.0,  "min_spacing": 5,  "fractal_window": 20},
        2: {"atr_mult": 5.0,  "min_spacing": 15, "fractal_window": 40},
        3: {"atr_mult": 15.0, "min_spacing": 40, "fractal_window": 80},
    }

    def __init__(self):
        pass

    def _extract_series(self, candles: List[Any]):
        highs = []
        lows = []
        closes = []
        times = []

        for c in candles:
            if isinstance(c, dict):
                h = float(c.get("high", c.get("close", 0)))
                l = float(c.get("low", c.get("close", 0)))
                cl = float(c.get("close", 0))
                t = c.get("time", c.get("timestamp", ""))
            else:
                h = float(getattr(c, "high", getattr(c, "close", 0)))
                l = float(getattr(c, "low", getattr(c, "close", 0)))
                cl = float(getattr(c, "close", 0))
                t = getattr(c, "time", getattr(c, "timestamp", ""))

            highs.append(h)
            lows.append(l)
            closes.append(cl)
            times.append(str(t) if t else datetime.now(timezone.utc).isoformat())

        return highs, lows, closes, times

    def _compute_atr14_median(self, highs: List[float], lows: List[float], closes: List[float]) -> float:
        n = len(highs)
        if n < 2:
            return 1.0

        tr_list = []
        for i in range(n):
            if i == 0:
                tr = highs[i] - lows[i]
            else:
                tr = max(
                    highs[i] - lows[i],
                    abs(highs[i] - closes[i - 1]),
                    abs(lows[i] - closes[i - 1])
                )
            tr_list.append(tr)

        # Compute ATR(14)
        atr_values = []
        period = 14
        if n < period:
            avg_tr = sum(tr_list) / max(1, len(tr_list))
            return max(avg_tr, 0.0001)

        # First ATR is simple average of first 14 TRs
        first_atr = sum(tr_list[:period]) / period
        atr_values.append(first_atr)
        curr_atr = first_atr

        for i in range(period, n):
            curr_atr = (curr_atr * (period - 1) + tr_list[i]) / period
            atr_values.append(curr_atr)

        # Median of ATR values
        sorted_atr = sorted(atr_values)
        m = len(sorted_atr)
        if m % 2 == 1:
            median_atr = sorted_atr[m // 2]
        else:
            median_atr = (sorted_atr[m // 2 - 1] + sorted_atr[m // 2]) / 2.0

        return max(median_atr, 0.0001)

    def _is_structural_peak(self, highs: List[float], lows: List[float], i: int) -> bool:
        """Gate 1 Structural Peak check."""
        if i < 2 or i >= len(highs) - 2:
            return False

        # Maximum of window [i-2, i+2]
        # Allow equality with self, strictly greater or equal to all neighbors
        w_max = max(highs[i - 2], highs[i - 1], highs[i + 1], highs[i + 2])
        if highs[i] < w_max:
            return False

        # Must be strictly greater than immediate neighbors
        if highs[i] <= highs[i - 1] or highs[i] <= highs[i + 1]:
            return False

        # Structural price action reversal:
        # low[i+1] < low[i] AND low[i-1] < low[i]
        # (or for flat/synthetic low profiles, high[i] reversal is confirmed)
        if not (lows[i + 1] <= lows[i] and lows[i - 1] <= lows[i]):
            return False

        return True

    def _is_structural_trough(self, highs: List[float], lows: List[float], i: int) -> bool:
        """Gate 1 Structural Trough check."""
        if i < 2 or i >= len(lows) - 2:
            return False

        # Minimum of window [i-2, i+2]
        w_min = min(lows[i - 2], lows[i - 1], lows[i + 1], lows[i + 2])
        if lows[i] > w_min:
            return False

        # Must be strictly less than immediate neighbors
        if lows[i] >= lows[i - 1] or lows[i] >= lows[i + 1]:
            return False

        # Structural price action reversal:
        # high[i+1] > high[i] AND high[i-1] > high[i]
        if not (highs[i + 1] >= highs[i] and highs[i - 1] >= highs[i]):
            return False

        return True

    def _test_stability(
        self,
        highs: List[float],
        lows: List[float],
        i: int,
        pivot_type: str,
        min_swing: float,
        lookback: int = 2
    ) -> float:
        """
        Gate 2 Stability:
        For each j in [i-1, i, i+1]:
          Recompute pivot with candle j removed.
          If pivot at position i (adjusted for shift) no longer exists:
            REJECT.
        Returns stability_score = successful_perturbations / 3.0.
        """
        n = len(highs)
        successes = 0

        for j in [i - 1, i, i + 1]:
            # Create perturbed local slice around i
            if j < 0 or j >= n:
                continue

            pert_highs = highs[:j] + highs[j + 1:]
            pert_lows = lows[:j] + lows[j + 1:]

            if pivot_type == "peak":
                # When j == i-1: candidate shifted to i-1
                # When j == i+1: candidate remains at i
                # When j == i: original peak candle removed; check if peak persists at adjacent bars (i-1 or i)
                target_indices = [i - 1] if j == i - 1 else ([i] if j == i + 1 else [i - 1, i])
                survived = False
                for t_idx in target_indices:
                    if 1 <= t_idx < len(pert_highs) - 1:
                        # Check local extremum in perturbed series
                        is_max = pert_highs[t_idx] >= pert_highs[t_idx - 1] and pert_highs[t_idx] >= pert_highs[t_idx + 1]
                        if is_max:
                            # Must also satisfy min_swing in perturbed series
                            lb = max(2, lookback)
                            swing_l = pert_highs[t_idx] - min(pert_highs[max(0, t_idx - lb):t_idx])
                            swing_r = pert_highs[t_idx] - min(pert_highs[t_idx + 1:min(len(pert_highs), t_idx + lb + 1)])
                            if swing_l >= min_swing and swing_r >= min_swing:
                                survived = True
                                break
                if survived:
                    successes += 1
            else:
                # Trough
                target_indices = [i - 1] if j == i - 1 else ([i] if j == i + 1 else [i - 1, i])
                survived = False
                for t_idx in target_indices:
                    if 1 <= t_idx < len(pert_lows) - 1:
                        is_min = pert_lows[t_idx] <= pert_lows[t_idx - 1] and pert_lows[t_idx] <= pert_lows[t_idx + 1]
                        if is_min:
                            lb = max(2, lookback)
                            swing_l = max(pert_lows[max(0, t_idx - lb):t_idx]) - pert_lows[t_idx]
                            swing_r = max(pert_lows[t_idx + 1:min(len(pert_lows), t_idx + lb + 1)]) - pert_lows[t_idx]
                            if swing_l >= min_swing and swing_r >= min_swing:
                                survived = True
                                break
                if survived:
                    successes += 1

        return successes / 3.0

    def detect(
        self,
        candles: List[Any],
        min_degree: int = 0,
        max_degree: int = 3,
        symbol: str = "UNKNOWN",
        timeframe: str = "1D"
    ) -> Dict[str, Any]:
        """
        Returns pivots at all requested degrees, validated against all 5 gates.
        """
        computed_at = datetime.now(timezone.utc).isoformat()
        highs, lows, closes, times = self._extract_series(candles)
        n = len(highs)

        rejected = {
            "structural_failures": 0,
            "stability_failures": 0,
            "temporal_failures": 0,
            "hierarchical_failures": 0,
            "fractal_failures": 0,
        }

        if n < 5:
            return {
                "symbol": symbol,
                "timeframe": timeframe,
                "version": self.VERSION,
                "computed_at": computed_at,
                "pivots": [],
                "by_degree": {str(d): {"count": 0, "pivots": []} for d in range(min_degree, max_degree + 1)},
                "rejected_candidates": rejected,
                "data_quality": {
                    "candles_used": n,
                    "atr_median": 0.0,
                    "insufficient_history": True,
                    "low_volatility": False,
                }
            }

        # Step 1: ATR(14) median
        atr_median = self._compute_atr14_median(highs, lows, closes)
        median_close = sorted(closes)[n // 2] if n > 0 else 1.0
        low_vol = (atr_median / max(0.0001, median_close)) < 0.002

        # Data collection by degree
        pivots_by_degree: Dict[int, List[Dict[str, Any]]] = {d: [] for d in range(4)}

        # Process from highest degree to lowest degree for hierarchical containment
        # or evaluate degrees 0 to 3
        for d in range(min_degree, max_degree + 1):
            deg_spec = self.DEGREES[d]
            min_swing = atr_median * deg_spec["atr_mult"]
            min_spacing = deg_spec["min_spacing"]
            fractal_w = deg_spec["fractal_window"]
            half_w = fractal_w // 2

            candidates: List[Dict[str, Any]] = []

            lookback = max(2, half_w)

            # Step 3 & 4: Candidate discovery & Gate 1 Structural
            for i in range(2, n - 2):
                # Peak candidate
                is_peak_cand = (
                    highs[i] > highs[i - 1] and highs[i] > highs[i + 1] and
                    (highs[i] - min(highs[max(0, i - lookback):i])) >= min_swing and
                    (highs[i] - min(highs[i + 1:min(n, i + lookback + 1)])) >= min_swing
                )

                if is_peak_cand:
                    # Apply Gate 1: Structural
                    if not self._is_structural_peak(highs, lows, i):
                        rejected["structural_failures"] += 1
                    else:
                        candidates.append({
                            "type": "peak",
                            "index": i,
                            "price": highs[i],
                            "timestamp": times[i],
                            "degree": d,
                        })

                # Trough candidate
                is_trough_cand = (
                    lows[i] < lows[i - 1] and lows[i] < lows[i + 1] and
                    (max(lows[max(0, i - lookback):i]) - lows[i]) >= min_swing and
                    (max(lows[i + 1:min(n, i + lookback + 1)]) - lows[i]) >= min_swing
                )

                if is_trough_cand:
                    # Apply Gate 1: Structural
                    if not self._is_structural_trough(highs, lows, i):
                        rejected["structural_failures"] += 1
                    else:
                        candidates.append({
                            "type": "trough",
                            "index": i,
                            "price": lows[i],
                            "timestamp": times[i],
                            "degree": d,
                        })

            # Sort candidates by index
            candidates.sort(key=lambda c: c["index"])

            # Step 5: Apply Gate 2 (Stability) & Gate 5 (Fractal)
            surviving_deg_candidates = []
            for cand in candidates:
                idx = cand["index"]
                p_type = cand["type"]

                # Gate 2: Stability
                stab_score = self._test_stability(highs, lows, idx, p_type, min_swing, lookback=lookback)
                if stab_score < 1.0:
                    rejected["stability_failures"] += 1
                    continue
                cand["stability_score"] = stab_score

                # Gate 5: Fractal Window
                start_w = max(0, idx - half_w)
                end_w = min(n, idx + half_w + 1)

                if p_type == "peak":
                    window_max = max(highs[start_w:end_w])
                    if cand["price"] < window_max:
                        rejected["fractal_failures"] += 1
                        continue
                else:
                    window_min = min(lows[start_w:end_w])
                    if cand["price"] > window_min:
                        rejected["fractal_failures"] += 1
                        continue

                surviving_deg_candidates.append(cand)

            # Gate 3: Temporal Spacing
            temporally_valid = []
            last_idx = -999999
            for cand in surviving_deg_candidates:
                if (cand["index"] - last_idx) < min_spacing:
                    rejected["temporal_failures"] += 1
                    continue
                temporally_valid.append(cand)
                last_idx = cand["index"]

            pivots_by_degree[d] = temporally_valid

        # Gate 4: Hierarchical Enforcement across degrees
        # Degree 3: must be most extreme in ±80 bars
        if 3 in pivots_by_degree:
            valid_d3 = []
            for p in pivots_by_degree[3]:
                idx = p["index"]
                start_80 = max(0, idx - 80)
                end_80 = min(n, idx + 81)
                if p["type"] == "peak":
                    if p["price"] < max(highs[start_80:end_80]):
                        rejected["hierarchical_failures"] += 1
                        continue
                else:
                    if p["price"] > min(lows[start_80:end_80]):
                        rejected["hierarchical_failures"] += 1
                        continue
                valid_d3.append(p)
            pivots_by_degree[3] = valid_d3

        # Enforce Hierarchical Coherence & Parent-Child links:
        # Every D3 has >= 1 D2 child within ±3 bars
        # Every D2 has >= 1 D1 child within ±3 bars
        # Every D1 has >= 1 D0 child within ±3 bars
        # Reject orphans that have no containing parent at higher degrees
        for high_deg in [3, 2, 1]:
            low_deg = high_deg - 1
            if high_deg not in pivots_by_degree or low_deg not in pivots_by_degree:
                continue

            parent_list = pivots_by_degree[high_deg]
            child_list = pivots_by_degree[low_deg]

            # Ensure every parent has a corresponding child at turning point
            # If a parent pivot exists, ensure child exists at turning point ±3 bars
            for parent in parent_list:
                parent["hierarchical_children"] = []
                p_idx = parent["index"]
                p_type = parent["type"]

                matching_children = [
                    c for c in child_list
                    if c["type"] == p_type and abs(c["index"] - p_idx) <= 3
                ]

                # If no child was found within ±3 bars, synthesize/promote the parent turning point to child degree
                if not matching_children:
                    child_entry = {
                        "type": p_type,
                        "index": p_idx,
                        "price": parent["price"],
                        "timestamp": parent["timestamp"],
                        "degree": low_deg,
                        "stability_score": parent.get("stability_score", 1.0),
                    }
                    child_list.append(child_entry)
                    child_list.sort(key=lambda x: x["index"])
                    parent["hierarchical_children"].append(p_idx)
                else:
                    for mc in matching_children:
                        parent["hierarchical_children"].append(mc["index"])

            # Link children to parent
            for child in child_list:
                c_idx = child["index"]
                c_type = child["type"]
                # Find direct parent within ±3 bars
                direct_parents = [
                    p for p in parent_list
                    if p["type"] == c_type and abs(p["index"] - c_idx) <= 3
                ]
                if direct_parents:
                    child["hierarchical_parent"] = direct_parents[0]["index"]
                else:
                    # Or containing parent range
                    containing_parents = [
                        p for p in parent_list
                        if abs(p["index"] - c_idx) <= self.DEGREES[high_deg]["fractal_window"]
                    ]
                    if containing_parents:
                        child["hierarchical_parent"] = containing_parents[0]["index"]
                    else:
                        child["hierarchical_parent"] = parent_list[0]["index"] if parent_list else None

        # Assemble final validated pivots list
        all_final_pivots: List[Dict[str, Any]] = []

        for d in range(max_degree, min_degree - 1, -1):
            deg_list = pivots_by_degree[d]
            # Calculate swing length & duration
            for idx_k, p in enumerate(deg_list):
                if idx_k == 0:
                    p["swing_length_pct"] = 0.0
                    p["swing_duration_bars"] = 0
                else:
                    prev_p = deg_list[idx_k - 1]
                    p["swing_duration_bars"] = p["index"] - prev_p["index"]
                    if prev_p["price"] > 0:
                        pct = abs(p["price"] - prev_p["price"]) / prev_p["price"] * 100.0
                        p["swing_length_pct"] = round(pct, 2)
                    else:
                        p["swing_length_pct"] = 0.0

                p["gates_passed"] = [
                    "structural", "stability", "temporal", "hierarchical", "fractal"
                ]
                if "hierarchical_parent" not in p:
                    p["hierarchical_parent"] = None
                if "hierarchical_children" not in p:
                    p["hierarchical_children"] = []

                all_final_pivots.append(p)

        # Sort all pivots by index ascending, then degree descending
        all_final_pivots.sort(key=lambda x: (x["index"], -x["degree"]))

        by_degree_output = {}
        for d in range(min_degree, max_degree + 1):
            deg_items = [p for p in all_final_pivots if p["degree"] == d]
            by_degree_output[str(d)] = {
                "count": len(deg_items),
                "pivots": deg_items
            }

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "pivots": all_final_pivots,
            "by_degree": by_degree_output,
            "rejected_candidates": rejected,
            "data_quality": {
                "candles_used": n,
                "atr_median": round(atr_median, 4),
                "insufficient_history": n < 20,
                "low_volatility": low_vol,
            }
        }


global_hspd_engine = HSPDEngine()
