"""
Classical Pattern Validators: Volume and Breakout.
Deterministic evaluation of volume profiles, breakout confirmation (close vs wick), and retests.
"""

from typing import Optional, Tuple, List, Dict, Any, Union
import math


class VolumeValidator:
    """Volume analysis at pattern formation and breakout."""

    def formation_volume_profile(
        self, candles: List[Dict[str, Any]], start_idx: int, end_idx: int
    ) -> Dict[str, Any]:
        """
        Computes volume trend across the formation span [start_idx, end_idx].
        Returns normalized slope and trend profile: 'declining', 'rising', or 'flat'.
        """
        if not candles or start_idx < 0 or end_idx >= len(candles) or start_idx >= end_idx:
            return {"slope": 0.0, "profile": "flat", "avg_volume": 0.0}

        sub_candles = candles[start_idx : end_idx + 1]
        vols = [float(c.get("volume", 0.0)) for c in sub_candles]
        n = len(vols)
        avg_vol = sum(vols) / n if n > 0 else 0.0

        if n < 3 or avg_vol <= 1e-6:
            return {"slope": 0.0, "profile": "flat", "avg_volume": round(avg_vol, 2)}

        # Normalize volume by mean volume to make slope scale-invariant
        y = [v / avg_vol for v in vols]
        x = list(range(n))
        x_mean = (n - 1) / 2.0
        y_mean = sum(y) / n

        denom = sum((xi - x_mean) ** 2 for xi in x)
        if denom <= 1e-9:
            return {"slope": 0.0, "profile": "flat", "avg_volume": round(avg_vol, 2)}

        slope = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n)) / denom
        # Total change over window = slope * n
        total_delta = slope * n

        if total_delta < -0.10:
            profile = "declining"
        elif total_delta > 0.10:
            profile = "rising"
        else:
            profile = "flat"

        return {
            "slope": round(slope, 6),
            "total_delta": round(total_delta, 4),
            "profile": profile,
            "avg_volume": round(avg_vol, 2),
        }

    def breakout_volume_ratio(
        self, candles: List[Dict[str, Any]], breakout_idx: int, window: int = 20
    ) -> float:
        """
        Computes ratio of volume at breakout candle to SMA(volume, window) prior to breakout.
        """
        if not candles or breakout_idx < 0 or breakout_idx >= len(candles):
            return 1.0

        breakout_vol = float(candles[breakout_idx].get("volume", 0.0))
        start_w = max(0, breakout_idx - window)
        prior_vols = [float(candles[i].get("volume", 0.0)) for i in range(start_w, breakout_idx)]

        if not prior_vols:
            return 1.0

        sma_vol = sum(prior_vols) / len(prior_vols)
        if sma_vol <= 1e-6:
            return 1.0

        return round(breakout_vol / sma_vol, 4)

    def volume_confirms_breakout(
        self, candles: List[Dict[str, Any]], breakout_idx: int, threshold: float = 1.3
    ) -> bool:
        """Returns True if breakout volume ratio >= threshold."""
        ratio = self.breakout_volume_ratio(candles, breakout_idx)
        return ratio >= threshold


class BreakoutValidator:
    """Breakout confirmation using close, not wick."""

    def confirmed_close(
        self,
        candles: List[Dict[str, Any]],
        level: float,
        direction: str,
        start_search_idx: int = 0,
    ) -> Tuple[bool, Optional[int], Optional[float], bool]:
        """
        Checks for confirmed bar close across level.
        Returns: (confirmed, breakout_index, breakout_close_price, wick_only_detected)
        """
        if not candles or start_search_idx >= len(candles):
            return False, None, None, False

        wick_only = False
        for i in range(start_search_idx, len(candles)):
            c = candles[i]
            close_p = float(c.get("close", 0.0))
            high_p = float(c.get("high", close_p))
            low_p = float(c.get("low", close_p))

            if direction == "bearish":
                # Close must be below neckline/support
                if close_p < level:
                    return True, i, close_p, wick_only
                elif low_p < level:
                    # Intraday wick crossed below, but close remained above or equal
                    wick_only = True
            elif direction == "bullish":
                # Close must be above resistance/neckline
                if close_p > level:
                    return True, i, close_p, wick_only
                elif high_p > level:
                    # Intraday wick crossed above, but close remained below or equal
                    wick_only = True

        return False, None, None, wick_only

    def retest_happened(
        self,
        candles: List[Dict[str, Any]],
        breakout_idx: int,
        level: float,
        direction: str,
        tolerance_pct: float = 0.015,
    ) -> Tuple[bool, Optional[int]]:
        """
        Checks if price retested the breakout level and respected it.
        """
        if not candles or breakout_idx >= len(candles) - 1:
            return False, None

        for i in range(breakout_idx + 1, len(candles)):
            c = candles[i]
            close_p = float(c.get("close", 0.0))
            high_p = float(c.get("high", close_p))
            low_p = float(c.get("low", close_p))

            if direction == "bearish":
                # Retest: price bounces up towards level (within tolerance) but closes below level
                if high_p >= level * (1.0 - tolerance_pct) and close_p <= level * 1.005:
                    return True, i
                # If price closed strongly back above level, invalidation/retest failed
                if close_p > level * (1.0 + tolerance_pct):
                    break
            elif direction == "bullish":
                # Retest: price pulls back towards level but closes above level
                if low_p <= level * (1.0 + tolerance_pct) and close_p >= level * 0.995:
                    return True, i
                if close_p < level * (1.0 - tolerance_pct):
                    break

        return False, None


global_volume_validator = VolumeValidator()
global_breakout_validator = BreakoutValidator()
