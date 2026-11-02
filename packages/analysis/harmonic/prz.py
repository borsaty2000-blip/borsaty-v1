"""
Potential Reversal Zone (PRZ) Confluence Calculator.
PRZ is a ZONE (two price bounds), not a single price level.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple
import math


class PrzCalculator:
    """
    Computes PRZ cluster from Fibonacci projections for harmonic patterns.
    Enforces that PRZ is a zone containing at least 2 confirming projections
    with total width <= 2 * ATR.
    """

    VERSION = "1.0.0"

    def compute_prz(
        self,
        points: Dict[str, Dict[str, Any]],
        pattern_name: str,
        is_bullish: bool,
        atr: float = 1.0,
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Calculates the PRZ cluster for a confirmed harmonic pattern.
        Returns: (prz_dict, rejection_reason)
        """
        px = points["X"]["price"]
        pa = points["A"]["price"]
        pb = points["B"]["price"]
        pc = points["C"]["price"]
        pd = points["D"]["price"]

        xa = abs(pa - px)
        ab = abs(pb - pa)
        bc = abs(pc - pb)
        xc = abs(pc - px)

        atr_val = max(0.01, atr)
        projections: List[float] = []

        # Derive projections based on pattern geometry
        if pattern_name == "gartley":
            if is_bullish:
                projections.append(pa - 0.786 * xa)
                projections.append(pc - 1.272 * bc)
                projections.append(pc - 1.618 * bc)
            else:
                projections.append(pa + 0.786 * xa)
                projections.append(pc + 1.272 * bc)
                projections.append(pc + 1.618 * bc)

        elif pattern_name == "bat":
            if is_bullish:
                projections.append(pa - 0.886 * xa)
                projections.append(pc - 2.00 * bc)
                projections.append(pc - 2.618 * bc)
            else:
                projections.append(pa + 0.886 * xa)
                projections.append(pc + 2.00 * bc)
                projections.append(pc + 2.618 * bc)

        elif pattern_name == "butterfly":
            if is_bullish:
                projections.append(pa - 1.27 * xa)
                projections.append(pa - 1.618 * xa)
                projections.append(pc - 2.24 * bc)
            else:
                projections.append(pa + 1.27 * xa)
                projections.append(pa + 1.618 * xa)
                projections.append(pc + 2.24 * bc)

        elif pattern_name in ["crab", "deep_crab"]:
            d_mult = 2.618 if pattern_name == "deep_crab" else 1.618
            if is_bullish:
                projections.append(pa - d_mult * xa)
                projections.append(pc - 2.618 * bc)
                projections.append(pc - 3.618 * bc)
                if pattern_name == "deep_crab":
                    projections.append(pc - 4.236 * bc)
            else:
                projections.append(pa + d_mult * xa)
                projections.append(pc + 2.618 * bc)
                projections.append(pc + 3.618 * bc)
                if pattern_name == "deep_crab":
                    projections.append(pc + 4.236 * bc)

        elif pattern_name == "shark":
            if is_bullish:
                projections.append(pa - 0.886 * xa)
                projections.append(pc - 1.13 * xc)
                projections.append(pc - 1.618 * bc)
            else:
                projections.append(pa + 0.886 * xa)
                projections.append(pc + 1.13 * xc)
                projections.append(pc + 1.618 * bc)

        elif pattern_name == "cypher":
            if is_bullish:
                projections.append(pc - 0.786 * xc)
                projections.append(pc - 1.414 * bc)
            else:
                projections.append(pc + 0.786 * xc)
                projections.append(pc + 1.414 * bc)

        elif pattern_name == "abcd":
            if is_bullish:
                projections.append(pc - 1.27 * bc)
                projections.append(pc - 1.618 * bc)
            else:
                projections.append(pc + 1.27 * bc)
                projections.append(pc + 1.618 * bc)

        else:
            if is_bullish:
                projections.append(pa - 0.786 * xa)
                projections.append(pc - 1.272 * bc)
            else:
                projections.append(pa + 0.786 * xa)
                projections.append(pc + 1.272 * bc)

        # Include measured D as reference point if projections are tight around it
        valid_projs = [p for p in projections if p > 0]
        if not valid_projs:
            return None, "No positive price projections found"

        valid_projs.sort()

        # Find the best cluster of at least 2 projections
        best_cluster: Optional[List[float]] = None
        min_cluster_width = float("inf")

        # Check all contiguous windows of size >= 2
        for size in range(len(valid_projs), 1, -1):
            for i in range(len(valid_projs) - size + 1):
                subset = valid_projs[i : i + size]
                w = subset[-1] - subset[0]
                if w <= 2.0 * atr_val and w < min_cluster_width:
                    min_cluster_width = w
                    best_cluster = subset

        if not best_cluster:
            # If no pair is within 2 ATR
            max_w = valid_projs[-1] - valid_projs[0]
            if max_w > 2.0 * atr_val:
                return None, f"PRZ cluster width ({max_w:.2f}) exceeds 2 ATR threshold ({2.0 * atr_val:.2f})"
            if len(valid_projs) < 2:
                return None, "Insufficient projection confluence (minimum 2 projections required)"
            best_cluster = valid_projs

        prz_low = round(min(best_cluster), 2)
        prz_high = round(max(best_cluster), 2)
        
        # In rare cases where projections are identical, create minimal 0.2% band
        if prz_low == prz_high:
            half_band = round(max(0.01, prz_low * 0.002), 2)
            prz_low = round(prz_low - half_band, 2)
            prz_high = round(prz_high + half_band, 2)

        prz_center = round((prz_low + prz_high) / 2.0, 2)
        width_pct = round(((prz_high - prz_low) / max(0.01, prz_center)) * 100.0, 2)

        return {
            "low": prz_low,
            "high": prz_high,
            "center": prz_center,
            "width_pct": width_pct,
            "projections_count": len(best_cluster),
            "method": "fibonacci_cluster",
        }, ""


global_prz_calculator = PrzCalculator()
