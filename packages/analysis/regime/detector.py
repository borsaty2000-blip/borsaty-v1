"""
Market Regime Detector Engine (Borsaty).
Purely deterministic market state classification. No ML. No LLM.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone
import math

from engines.indicator_engine import IndicatorEngine, global_indicator_engine
from classical.validators import VolumeValidator, global_volume_validator


class RegimeDetector:
    """
    Classify current market state deterministically into 7 regimes:
    1. trending_strong: ADX > 30, DI spread > 15
    2. trending_weak: ADX 20-30
    3. ranging: ADX < 20, price near BB middle
    4. volatile_expansion: BB width > 90th percentile
    5. volatile_contraction: BB width < 10th percentile
    6. breakout: price > 1.5σ outside BB
    7. mean_reversion: price at BB extreme + RSI extreme + declining volume
    """

    VERSION = "1.0.0"

    REGIMES = [
        "trending_strong",
        "trending_weak",
        "ranging",
        "volatile_expansion",
        "volatile_contraction",
        "breakout",
        "mean_reversion",
    ]

    def __init__(
        self,
        indicator_engine: Optional[IndicatorEngine] = None,
        volume_validator: Optional[VolumeValidator] = None,
    ):
        self.ie = indicator_engine or global_indicator_engine
        self.vol_val = volume_validator or global_volume_validator

    def _classify_bar(
        self,
        close: float,
        upper_bb: float,
        middle_bb: float,
        lower_bb: float,
        bb_width_percentile: float,
        adx: float,
        di_spread: float,
        rsi: float,
        volume_trend: str,
    ) -> Tuple[str, float]:
        """
        Evaluates a single bar against the priority rules.
        Returns: (regime_name, confidence)
        """
        bb_std = max(1e-6, (upper_bb - middle_bb) / 2.0)
        middle_ref = max(1e-6, middle_bb)
        bb_width = (upper_bb - lower_bb) / middle_ref

        # 1. Volatility check FIRST (overrides trend)
        # Volatile expansion: width in top 10% AND width is genuinely wide
        if bb_width_percentile > 0.90 and bb_width > 0.05:
            conf = min(0.95, round(0.80 + (bb_width_percentile - 0.90) * 1.5, 2))
            return "volatile_expansion", conf
        # Volatile contraction: width in bottom 10% AND in quiet consolidation (ADX < 25, narrow bands)
        elif bb_width_percentile < 0.10 and adx < 25.0 and bb_width < 0.06:
            conf = min(0.95, round(0.80 + (0.10 - bb_width_percentile) * 1.5, 2))
            return "volatile_contraction", conf

        # 2. Breakout check
        # price > 1.5σ outside BB: close > upper_bb + 0.5 * bb_std or close > upper_bb * (1 + 0.5 * bb_std/middle)
        breakout_up_level = upper_bb * (1.0 + 0.5 * bb_std / middle_ref)
        breakout_down_level = lower_bb * (1.0 - 0.5 * bb_std / middle_ref)

        if close > breakout_up_level or close < breakout_down_level:
            conf = 0.88
            return "breakout", conf

        # 3. Trend strength
        if adx > 30 and di_spread > 15:
            conf = min(0.95, round(0.70 + (adx - 30) * 0.01 + (di_spread - 15) * 0.005, 2))
            return "trending_strong", conf
        elif adx > 20:
            conf = min(0.85, round(0.65 + (adx - 20) * 0.015, 2))
            return "trending_weak", conf

        # 4. Mean reversion
        # close at BB extreme (upper 1% or lower 1%) + RSI extreme + declining volume
        is_bb_extreme = (close >= upper_bb * 0.985) or (close <= lower_bb * 1.015)
        is_rsi_extreme = (rsi > 70.0) or (rsi < 30.0)
        is_vol_declining = (volume_trend == "declining")

        if is_bb_extreme and is_rsi_extreme and is_vol_declining:
            conf = min(0.92, round(0.75 + abs(rsi - 50.0) * 0.005, 2))
            return "mean_reversion", conf

        # 5. Default: ranging
        conf = min(0.88, round(0.70 + max(0.0, (20.0 - adx)) * 0.01, 2))
        return "ranging", conf

    def detect(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Classifies market regime for the given symbol and timeframe.
        """
        if not candles or len(candles) < 20:
            return {
                "symbol": symbol,
                "timeframe": timeframe,
                "version": self.VERSION,
                "regime": "ranging",
                "confidence": 0.50,
                "evidence": {
                    "adx_value": 0.0,
                    "adx_threshold": 30,
                    "di_spread": 0.0,
                    "bb_width_percentile": 0.50,
                    "volume_trend": "flat",
                },
                "since_bars": 1,
                "previous_regime": "ranging",
                "transition_warning": False,
                "insufficient_data": True,
            }

        highs = [float(c.get("high", c.get("close", 0.0))) for c in candles]
        lows = [float(c.get("low", c.get("close", 0.0))) for c in candles]
        closes = [float(c.get("close", 0.0)) for c in candles]

        # 1. Indicator computations
        bb_res = self.ie.compute_bollinger(closes, period=20, num_std=2.0)
        adx_res = self.ie.compute_adx(highs, lows, closes, period=14)
        rsi_series = self.ie.compute_rsi(closes, period=14)

        upper_list = bb_res.get("upper", [])
        middle_list = bb_res.get("middle", [])
        lower_list = bb_res.get("lower", [])
        adx_list = adx_res.get("adx", [])
        plus_di_list = adx_res.get("plus_di", [])
        minus_di_list = adx_res.get("minus_di", [])

        # 2. Compute BB width series across all available bars
        bb_widths: List[Optional[float]] = []
        for i in range(len(closes)):
            u, m, l = upper_list[i], middle_list[i], lower_list[i]
            if u is not None and m is not None and l is not None and m > 1e-6:
                bb_widths.append((u - l) / m)
            else:
                bb_widths.append(None)

        # 3. Classify trailing sequence to compute history and since_bars
        history_regimes: List[str] = []
        n = len(candles)
        scan_len = min(n, 120)

        for i in range(n - scan_len, n):
            u = upper_list[i]
            m = middle_list[i]
            l = lower_list[i]
            adx_val = adx_list[i]
            p_di = plus_di_list[i]
            m_di = minus_di_list[i]
            rsi_val = rsi_series[i]

            if None in (u, m, l, adx_val, p_di, m_di, rsi_val):
                history_regimes.append("ranging")
                continue

            # Percentile rank of BB width vs previous 100 bars
            w_curr = bb_widths[i] or 0.0
            start_window = max(0, i - 100)
            valid_widths = [bb_widths[k] for k in range(start_window, i + 1) if bb_widths[k] is not None]
            if len(valid_widths) >= 20 and (max(valid_widths) - min(valid_widths)) >= 0.015:
                count_lower = sum(1 for w in valid_widths if w < w_curr)
                count_eq = sum(1 for w in valid_widths if abs(w - w_curr) < 1e-6)
                pct_rank = (count_lower + 0.5 * count_eq) / len(valid_widths)
            else:
                pct_rank = 0.50

            # Volume trend over prior 15 bars
            v_start = max(0, i - 15)
            prof = self.vol_val.formation_volume_profile(candles, v_start, i)
            vol_trend = prof.get("profile", "flat")

            di_spr = abs(p_di - m_di)
            reg_name, _ = self._classify_bar(
                close=closes[i],
                upper_bb=u,
                middle_bb=m,
                lower_bb=l,
                bb_width_percentile=pct_rank,
                adx=adx_val,
                di_spread=di_spr,
                rsi=rsi_val,
                volume_trend=vol_trend,
            )
            history_regimes.append(reg_name)

        current_regime = history_regimes[-1] if history_regimes else "ranging"

        # Determine since_bars and previous_regime
        since_bars = 0
        previous_regime = current_regime

        for reg in reversed(history_regimes):
            if reg == current_regime:
                since_bars += 1
            else:
                previous_regime = reg
                break

        transition_warning = (since_bars <= 2)

        # Final evidence for current bar
        last_i = n - 1
        last_u = upper_list[last_i] or closes[-1] * 1.02
        last_m = middle_list[last_i] or closes[-1]
        last_l = lower_list[last_i] or closes[-1] * 0.98
        last_adx = round(adx_list[last_i] or 0.0, 1)
        last_p_di = plus_di_list[last_i] or 0.0
        last_m_di = minus_di_list[last_i] or 0.0
        last_di_spr = round(abs(last_p_di - last_m_di), 1)
        last_rsi = round(rsi_series[last_i] or 50.0, 1)

        last_w = bb_widths[-1] or 0.0
        start_w = max(0, n - 100)
        valid_widths = [bb_widths[k] for k in range(start_w, n) if bb_widths[k] is not None]
        if len(valid_widths) >= 20 and (max(valid_widths) - min(valid_widths)) >= 0.015:
            count_lower = sum(1 for w in valid_widths if w < last_w)
            count_eq = sum(1 for w in valid_widths if abs(w - last_w) < 1e-6)
            last_pct_rank = round((count_lower + 0.5 * count_eq) / len(valid_widths), 2)
        else:
            last_pct_rank = 0.50

        prof = self.vol_val.formation_volume_profile(candles, max(0, n - 15), n - 1)
        last_vol_trend = prof.get("profile", "flat")

        _, confidence = self._classify_bar(
            close=closes[-1],
            upper_bb=last_u,
            middle_bb=last_m,
            lower_bb=last_l,
            bb_width_percentile=last_pct_rank,
            adx=last_adx,
            di_spread=last_di_spr,
            rsi=last_rsi,
            volume_trend=last_vol_trend,
        )

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "regime": current_regime,
            "confidence": confidence,
            "evidence": {
                "adx_value": last_adx,
                "adx_threshold": 30,
                "di_spread": last_di_spr,
                "bb_width_percentile": last_pct_rank,
                "volume_trend": last_vol_trend,
            },
            "since_bars": since_bars,
            "previous_regime": previous_regime,
            "transition_warning": transition_warning,
        }


global_regime_detector = RegimeDetector()
