"""
Technical Score Engine — Borsaty Phase ق
Calculates an institutional-grade Technical Score from -100 to +100 with weighted components:
- Trend (Moving Averages alignment): ±30 points
- Momentum (RSI + MACD + Stochastic): ±25 points
- Volume (Volume trend confirmation): ±15 points
- Structure (HSPD - HH/HL vs LH/LL): ±20 points
- Patterns (Harmonic + Classical confirmed): ±10 points
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from engines.indicator_engine import global_indicator_engine
from engines.hspd import global_hspd_engine
from harmonic.detector import global_harmonic_detector
from classical.detector import global_classical_detector


class TechnicalScoreEngine:
    VERSION = "1.0.0"

    def __init__(self):
        self.indicator_engine = global_indicator_engine
        self.hspd_engine = global_hspd_engine
        self.harmonic_detector = global_harmonic_detector
        self.classical_detector = global_classical_detector

    def compute_score(
        self,
        candles: List[Dict[str, Any]],
        symbol: str = "UNKNOWN",
        timeframe: str = "1D"
    ) -> Dict[str, Any]:
        """
        Calculates a technical score from -100 to +100 based on 5 weighted components.
        """
        if not candles or len(candles) < 5:
            return {
                "symbol": symbol.upper(),
                "score": 0,
                "verdict": "NEUTRAL",
                "verdict_ar": "محايد",
                "components": {
                    "trend": 0,
                    "momentum": 0,
                    "volume": 0,
                    "structure": 0,
                    "patterns": 0,
                },
                "details": {},
                "timeframe": timeframe,
                "as_of": datetime.now(timezone.utc).isoformat(),
            }

        closes = [float(c.get("close", 0)) for c in candles]
        highs = [float(c.get("high", c.get("close", 0))) for c in candles]
        lows = [float(c.get("low", c.get("close", 0))) for c in candles]
        volumes = [float(c.get("volume", 0) or 0) for c in candles]

        last_close = closes[-1]
        n = len(closes)

        # ---------------------------------------------------------------------
        # 1. Trend Component (±30 points)
        # ---------------------------------------------------------------------
        trend_score = 0.0
        ema20 = self.indicator_engine.compute_ema(closes, period=min(20, n))
        ema50 = self.indicator_engine.compute_ema(closes, period=min(50, n))
        sma200 = self.indicator_engine.compute_sma(closes, period=min(200, n))

        val_ema20 = ema20[-1] if ema20 and ema20[-1] is not None else last_close
        val_ema50 = ema50[-1] if ema50 and ema50[-1] is not None else last_close
        val_sma200 = sma200[-1] if sma200 and sma200[-1] is not None else last_close

        # Price vs EMA20 (±8)
        if last_close > val_ema20:
            trend_score += 8.0
        elif last_close < val_ema20:
            trend_score -= 8.0

        # Price vs EMA50 (±8)
        if last_close > val_ema50:
            trend_score += 8.0
        elif last_close < val_ema50:
            trend_score -= 8.0

        # Price vs SMA200 (±8)
        if last_close > val_sma200:
            trend_score += 8.0
        elif last_close < val_sma200:
            trend_score -= 8.0

        # EMA20 vs EMA50 alignment (±6)
        if val_ema20 > val_ema50:
            trend_score += 6.0
        elif val_ema20 < val_ema50:
            trend_score -= 6.0

        trend_score = max(-30.0, min(30.0, trend_score))

        # ---------------------------------------------------------------------
        # 2. Momentum Component (±25 points)
        # ---------------------------------------------------------------------
        momentum_score = 0.0

        # RSI (14) (±10 points)
        rsi_series = self.indicator_engine.compute_rsi(closes, period=min(14, max(2, n - 1)))
        last_rsi = rsi_series[-1] if rsi_series and rsi_series[-1] is not None else 50.0

        if last_rsi >= 70.0:
            # Overbought / extreme bull
            momentum_score += 4.0
        elif last_rsi >= 55.0:
            # Strong bullish momentum
            momentum_score += 10.0
        elif last_rsi <= 30.0:
            # Oversold
            momentum_score -= 4.0
        elif last_rsi <= 45.0:
            # Strong bearish momentum
            momentum_score -= 10.0
        else:
            # Neutral zone (45..55)
            momentum_score += 0.0

        # MACD (12, 26, 9) (±10 points)
        macd_res = self.indicator_engine.compute_macd(closes)
        macd_line = macd_res.get("macd", [])
        signal_line = macd_res.get("signal", [])
        hist = macd_res.get("histogram", [])

        last_macd = macd_line[-1] if macd_line and macd_line[-1] is not None else 0.0
        last_signal = signal_line[-1] if signal_line and signal_line[-1] is not None else 0.0
        last_hist = hist[-1] if hist and hist[-1] is not None else 0.0

        if last_macd > last_signal:
            momentum_score += 7.0
            if last_hist > 0:
                momentum_score += 3.0
        elif last_macd < last_signal:
            momentum_score -= 7.0
            if last_hist < 0:
                momentum_score -= 3.0

        # Stochastic (14, 3, 3) (±5 points)
        stoch_res = self.indicator_engine.compute_stochastic(highs, lows, closes)
        stoch_k = stoch_res.get("k", [])
        stoch_d = stoch_res.get("d", [])
        last_k = stoch_k[-1] if stoch_k and stoch_k[-1] is not None else 50.0
        last_d = stoch_d[-1] if stoch_d and stoch_d[-1] is not None else 50.0

        if last_k > last_d and last_k < 80.0:
            momentum_score += 5.0
        elif last_k < last_d and last_k > 20.0:
            momentum_score -= 5.0

        momentum_score = max(-25.0, min(25.0, momentum_score))

        # ---------------------------------------------------------------------
        # 3. Volume Component (±15 points)
        # ---------------------------------------------------------------------
        volume_score = 0.0
        if any(v > 0 for v in volumes):
            vol_sma20 = self.indicator_engine.compute_sma(volumes, period=min(20, n))
            avg_vol = vol_sma20[-1] if vol_sma20 and vol_sma20[-1] is not None and vol_sma20[-1] > 0 else (sum(volumes) / len(volumes))
            last_vol = volumes[-1]
            vol_ratio = (last_vol / avg_vol) if avg_vol > 0 else 1.0

            is_up_candle = last_close >= (closes[-2] if n >= 2 else last_close)

            if is_up_candle:
                if vol_ratio >= 1.5:
                    volume_score = 15.0
                elif vol_ratio >= 1.1:
                    volume_score = 10.0
                elif vol_ratio < 0.8:
                    volume_score = 3.0
                else:
                    volume_score = 7.0
            else:
                if vol_ratio >= 1.5:
                    volume_score = -15.0
                elif vol_ratio >= 1.1:
                    volume_score = -10.0
                elif vol_ratio < 0.8:
                    volume_score = -3.0
                else:
                    volume_score = -7.0
        else:
            # When volume is unavailable, derive from price directional velocity
            pct_move = (closes[-1] - closes[-2]) / closes[-2] if n >= 2 and closes[-2] > 0 else 0
            volume_score = max(-15.0, min(15.0, pct_move * 300.0))

        volume_score = max(-15.0, min(15.0, volume_score))

        # ---------------------------------------------------------------------
        # 4. Structure Component (HSPD - HH/HL vs LH/LL) (±20 points)
        # ---------------------------------------------------------------------
        structure_score = 0.0
        hspd_result = self.hspd_engine.detect(candles, min_degree=0, max_degree=2, symbol=symbol, timeframe=timeframe)
        all_pivots = hspd_result.get("pivots", []) or []

        if len(all_pivots) >= 4:
            high_pivots = [p for p in all_pivots if p.get("type") in ("peak", "HIGH")]
            low_pivots = [p for p in all_pivots if p.get("type") in ("trough", "LOW")]

            is_higher_highs = False
            is_higher_lows = False
            is_lower_highs = False
            is_lower_lows = False

            if len(high_pivots) >= 2:
                is_higher_highs = high_pivots[-1]["price"] > high_pivots[-2]["price"]
                is_lower_highs = high_pivots[-1]["price"] < high_pivots[-2]["price"]

            if len(low_pivots) >= 2:
                is_higher_lows = low_pivots[-1]["price"] > low_pivots[-2]["price"]
                is_lower_lows = low_pivots[-1]["price"] < low_pivots[-2]["price"]

            if is_higher_highs and is_higher_lows:
                structure_score = 20.0  # Full Bullish Market Structure
            elif is_lower_highs and is_lower_lows:
                structure_score = -20.0  # Full Bearish Market Structure
            elif is_higher_highs:
                structure_score = 10.0
            elif is_lower_lows:
                structure_score = -10.0
            elif is_higher_lows:
                structure_score = 6.0
            elif is_lower_highs:
                structure_score = -6.0
            elif is_lower_highs:
                structure_score = -6.0
        else:
            # Fallback simple local structure
            if n >= 10:
                recent_half = closes[n // 2 :]
                first_half = closes[: n // 2]
                if max(recent_half) > max(first_half) and min(recent_half) > min(first_half):
                    structure_score = 15.0
                elif max(recent_half) < max(first_half) and min(recent_half) < min(first_half):
                    structure_score = -15.0

        structure_score = max(-20.0, min(20.0, structure_score))

        # ---------------------------------------------------------------------
        # 5. Patterns Component (Harmonic + Classical) (±10 points)
        # ---------------------------------------------------------------------
        patterns_score = 0.0
        try:
            # Check Harmonics
            harm_res = self.harmonic_detector.detect(candles)
            harm_patterns = harm_res.get("patterns", [])
            for p in harm_patterns:
                p_type = p.get("type", "").lower()
                if "bullish" in p_type:
                    patterns_score += 5.0
                elif "bearish" in p_type:
                    patterns_score -= 5.0

            # Check Classical
            class_res = self.classical_detector.detect(candles)
            class_patterns = class_res.get("patterns", [])
            for cp in class_patterns:
                direction = cp.get("direction", "").lower()
                if direction == "bullish":
                    patterns_score += 5.0
                elif direction == "bearish":
                    patterns_score -= 5.0
        except Exception:
            # Graceful non-blocking
            pass

        patterns_score = max(-10.0, min(10.0, patterns_score))

        # ---------------------------------------------------------------------
        # Total Weighted Technical Score (-100 to +100)
        # ---------------------------------------------------------------------
        total_score = round(trend_score + momentum_score + volume_score + structure_score + patterns_score)
        total_score = max(-100, min(100, total_score))

        # Determine Verdict
        if total_score >= 50:
            verdict = "STRONG BUY"
            verdict_ar = "شراء قوي"
        elif total_score >= 15:
            verdict = "BUY"
            verdict_ar = "شراء"
        elif total_score <= -50:
            verdict = "STRONG SELL"
            verdict_ar = "بيع قوي"
        elif total_score <= -15:
            verdict = "SELL"
            verdict_ar = "بيع"
        else:
            verdict = "NEUTRAL"
            verdict_ar = "محايد"

        return {
            "symbol": symbol.upper(),
            "score": total_score,
            "verdict": verdict,
            "verdict_ar": verdict_ar,
            "components": {
                "trend": round(trend_score, 1),
                "momentum": round(momentum_score, 1),
                "volume": round(volume_score, 1),
                "structure": round(structure_score, 1),
                "patterns": round(patterns_score, 1),
            },
            "details": {
                "rsi_14": round(last_rsi, 1),
                "macd_histogram": round(last_hist, 3),
                "stoch_k": round(last_k, 1),
                "ema20": round(val_ema20, 2),
                "ema50": round(val_ema50, 2),
                "sma200": round(val_sma200, 2),
            },
            "timeframe": timeframe,
            "as_of": datetime.now(timezone.utc).isoformat(),
        }


global_technical_score_engine = TechnicalScoreEngine()
