"""
WalkForwardValidator — Rolling-Window Stability Analysis (Borsaty Phase ح)
Version 1.0.0

Splits the full history into overlapping windows and runs BacktestEngine
on each, then measures stability and out-of-sample efficiency.

STABILITY SCORE:  1 - (std / mean)   ∈ [0, 1]   (1 = perfectly stable)
WF EFFICIENCY:    OOS hit-rate / IS hit-rate      (target > 0.80)
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from backtest.engine import BacktestEngine, BacktestResult


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class WindowResult:
    """Result for a single walk-forward window."""

    window_index: int
    date_range: List[str]
    total_signals: int
    hit_rate_t1: float
    avg_r: float
    sample_adequate: bool   # signals >= 30


@dataclass
class WalkForwardResult:
    """Aggregated result across all walk-forward windows."""

    symbol: str
    timeframe: str
    windows: List[WindowResult]
    overall: Dict[str, Any]
    verdict: str              # "stable" | "unstable" | "insufficient_data"
    message_ar: str
    message_en: str


# ---------------------------------------------------------------------------
# WalkForwardValidator
# ---------------------------------------------------------------------------


class WalkForwardValidator:
    """
    Split full candle history into rolling in-sample windows.
    Run BacktestEngine on each window.
    Measure cross-window stability of the hit rate.

    Parameters
    ----------
    window_size : bars per window (default 500)
    step_size   : step between window starts (default 250)
    warmup_bars : warmup handed to BacktestEngine (default 250)
    """

    VERSION = "1.0.0"

    STABILITY_THRESHOLD = 0.70   # stability_score below this → "unstable"
    WFE_THRESHOLD = 0.75         # walk_forward_efficiency below this → "unstable"
    MIN_WINDOWS = 2              # need at least 2 windows for stability

    def __init__(
        self,
        backtest_engine: Optional[BacktestEngine] = None,
        window_size: int = 500,
        step_size: int = 250,
        warmup_bars: int = 250,
    ):
        self._engine = backtest_engine or BacktestEngine()
        self.window_size = window_size
        self.step_size = step_size
        self.warmup_bars = warmup_bars

    def validate(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
        fast_mode: bool = True,
    ) -> WalkForwardResult:
        """
        Run walk-forward validation on the given candle history.

        Parameters
        ----------
        symbol    : Ticker symbol.
        timeframe : Candle timeframe.
        candles   : Full chronological OHLCV list.

        Returns
        -------
        WalkForwardResult
        """
        sym = symbol.upper()
        tf = timeframe.upper()
        n = len(candles)

        # ── Build window slices ─────────────────────────────────────────
        starts: List[int] = []
        s = 0
        while s + self.window_size <= n:
            starts.append(s)
            s += self.step_size

        # If fewer than 2 windows → insufficient data
        if len(starts) < self.MIN_WINDOWS:
            return WalkForwardResult(
                symbol=sym,
                timeframe=tf,
                windows=[],
                overall={
                    "hit_rate_mean": 0.0,
                    "hit_rate_std": 0.0,
                    "stability_score": 0.0,
                    "walk_forward_efficiency": 0.0,
                    "n_windows": 0,
                },
                verdict="insufficient_data",
                message_ar="بيانات غير كافية لتطبيق التحقق المتدحرج (يلزم 1000+ شمعة)",
                message_en="Insufficient data for walk-forward validation (1000+ candles required)",
            )

        # ── Run BacktestEngine per window ───────────────────────────────
        window_results: List[WindowResult] = []

        for idx, start in enumerate(starts):
            end = start + self.window_size
            window_candles = candles[start:end]

            try:
                bt: BacktestResult = self._engine.run(
                    symbol=sym,
                    timeframe=tf,
                    candles=window_candles,
                    warmup_bars=self.warmup_bars,
                    fast_mode=fast_mode,
                )
            except Exception:
                # If a window fails, record zero-result and continue
                window_results.append(WindowResult(
                    window_index=idx + 1,
                    date_range=["", ""],
                    total_signals=0,
                    hit_rate_t1=0.0,
                    avg_r=0.0,
                    sample_adequate=False,
                ))
                continue

            window_results.append(WindowResult(
                window_index=idx + 1,
                date_range=[
                    bt.date_range.get("from", ""),
                    bt.date_range.get("to", ""),
                ],
                total_signals=bt.total_signals,
                hit_rate_t1=bt.metrics.hit_rate_t1,
                avg_r=bt.metrics.avg_r_multiple,
                sample_adequate=bt.total_signals >= 30,
            ))

        # ── Aggregate cross-window statistics ───────────────────────────
        adequate_windows = [w for w in window_results if w.sample_adequate]
        n_adequate = len(adequate_windows)

        if n_adequate < self.MIN_WINDOWS:
            return WalkForwardResult(
                symbol=sym,
                timeframe=tf,
                windows=window_results,
                overall={
                    "hit_rate_mean": 0.0,
                    "hit_rate_std": 0.0,
                    "stability_score": 0.0,
                    "walk_forward_efficiency": 0.0,
                    "n_windows": len(window_results),
                    "n_adequate_windows": n_adequate,
                },
                verdict="insufficient_data",
                message_ar=(
                    f"لا تتوفر نوافذ كافية بعينات كافية (كافية: {n_adequate} من {len(window_results)}). "
                    "بيانات غير كافية للتحقق"
                ),
                message_en=(
                    f"Not enough windows with adequate samples ({n_adequate} of {len(window_results)} qualify). "
                    "Insufficient data for validation"
                ),
            )

        hit_rates = [w.hit_rate_t1 for w in adequate_windows]
        mean_hr = round(sum(hit_rates) / len(hit_rates), 4)
        variance = sum((h - mean_hr) ** 2 for h in hit_rates) / max(len(hit_rates) - 1, 1)
        std_hr = round(math.sqrt(variance), 4)
        stability_score = round(1 - (std_hr / mean_hr), 4) if mean_hr > 0 else 0.0
        stability_score = max(0.0, min(1.0, stability_score))

        # Walk-Forward Efficiency: last-window OOS / first-window IS
        # Approximation: later windows represent OOS relative to earlier
        is_rate = adequate_windows[0].hit_rate_t1
        oos_rate = adequate_windows[-1].hit_rate_t1
        wf_efficiency = round(oos_rate / is_rate, 4) if is_rate > 0 else 0.0

        # Verdict
        if stability_score >= self.STABILITY_THRESHOLD and wf_efficiency >= self.WFE_THRESHOLD:
            verdict = "stable"
            msg_ar = (
                f"أداء مستقر عبر {n_adequate} نوافذ زمنية مختلفة "
                f"(تقلب {round(std_hr * 100, 1)}% فقط)"
            )
            msg_en = (
                f"Stable performance across {n_adequate} time windows "
                f"(variance {round(std_hr * 100, 1)}% only)"
            )
        else:
            verdict = "unstable"
            msg_ar = (
                f"أداء غير مستقر عبر النوافذ الزمنية "
                f"(تقلب {round(std_hr * 100, 1)}% — نقاط الثقة منخفضة)"
            )
            msg_en = (
                f"Unstable performance across time windows "
                f"(variance {round(std_hr * 100, 1)}% — low confidence)"
            )

        overall = {
            "hit_rate_mean": mean_hr,
            "hit_rate_std": std_hr,
            "stability_score": stability_score,
            "walk_forward_efficiency": wf_efficiency,
            "n_windows": len(window_results),
            "n_adequate_windows": n_adequate,
        }

        return WalkForwardResult(
            symbol=sym,
            timeframe=tf,
            windows=window_results,
            overall=overall,
            verdict=verdict,
            message_ar=msg_ar,
            message_en=msg_en,
        )
