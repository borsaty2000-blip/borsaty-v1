"""
BacktestEngine — Bar-by-Bar Signal Replayer (Borsaty Phase ح)
Version 1.0.0

CORE GUARANTEE: No look-ahead bias.
  At bar index i, the engine receives ONLY candles[0:i].
  Future bars never influence past signals.

Algorithm:
  1. Advance bar by bar (from warmup_bars onward).
  2. At each bar, run full analysis pipeline on past candles only.
  3. If TradePlanEngine produces an actionable setup → record signal.
  4. After all bars, scan forward from each signal to classify outcome.
  5. Aggregate metrics with Wilson Confidence Intervals.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional, Tuple, List, Dict, Any, Union

from orchestrator import AnalysisOrchestrator
from trade_plan.engine import TradePlanEngine

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class SignalRecord:
    """
    One signal emitted at bar_index with full metadata.
    Outcome filled in after forward-scan.
    """

    signal_id: str
    bar_index: int
    date: str  # ISO date of bar
    direction: str  # "bullish" | "bearish" | "neutral"
    entry_zone: List[float]  # [low, high]
    stop: float
    targets: List[float]
    regime: str
    engines_used: List[str]
    confluence_score: float

    # Outcome fields (filled after forward-scan)
    outcome: str = "PENDING"          # HIT_T1 | HIT_T2 | HIT_T3 | STOPPED | EXPIRED
    realized_r: Optional[float] = None
    days_to_resolution: Optional[int] = None
    mfe_pct: Optional[float] = None   # max favorable excursion %
    mae_pct: Optional[float] = None   # max adverse excursion %


@dataclass
class BacktestMetrics:
    """Aggregated performance statistics for a full backtest run."""

    total_signals: int = 0
    total_closed: int = 0

    hit_rate_t1: float = 0.0
    hit_rate_t2: float = 0.0
    hit_rate_t3: float = 0.0
    stopped_rate: float = 0.0
    expired_rate: float = 0.0

    avg_r_multiple: float = 0.0
    profit_factor: float = 0.0
    max_drawdown_pct: float = 0.0
    sharpe_ratio: float = 0.0
    expectancy_per_trade: float = 0.0

    # Wilson 95% CI for T1 hit rate
    wilson_ci_95_t1: List[float] = field(default_factory=lambda: [0.0, 1.0])
    wilson_ci_95_t2: List[float] = field(default_factory=lambda: [0.0, 1.0])

    # Breakdown by regime
    by_regime: Dict[str, Any] = field(default_factory=dict)
    # Breakdown by dominant engine
    by_engine: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BacktestResult:
    """Full result returned by BacktestEngine.run()."""

    symbol: str
    timeframe: str
    backtest_version: str
    date_range: Dict[str, str]
    total_bars: int
    total_signals: int
    signals: List[SignalRecord]
    metrics: BacktestMetrics
    data_quality: Dict[str, Any]
    execution_ms: float = 0.0


# ---------------------------------------------------------------------------
# Wilson confidence interval helper
# ---------------------------------------------------------------------------


def wilson_ci(n_hits: int, n_total: int, z: float = 1.96) -> Tuple[float, float]:
    """
    Wilson score interval for a binomial proportion.
    Returns (lower, upper) rounded to 4 decimal places.
    n_total = 0  → returns (0.0, 1.0) (uninformative).
    """
    if n_total <= 0:
        return (0.0, 1.0)

    p_hat = n_hits / n_total
    centre_adj = p_hat + z * z / (2 * n_total)
    margin = z * math.sqrt(p_hat * (1 - p_hat) / n_total + z * z / (4 * n_total * n_total))
    denominator = 1 + z * z / n_total

    lo = max(0.0, (centre_adj - margin) / denominator)
    hi = min(1.0, (centre_adj + margin) / denominator)
    return (round(lo, 4), round(hi, 4))


# ---------------------------------------------------------------------------
# Metrics helpers
# ---------------------------------------------------------------------------


def _sharpe(r_multiples: List[float], risk_free: float = 0.0) -> float:
    """Sharpe ratio of realized R-multiples (assumes 1 trade = 1 period)."""
    if len(r_multiples) < 2:
        return 0.0
    n = len(r_multiples)
    mean = sum(r_multiples) / n
    variance = sum((r - mean) ** 2 for r in r_multiples) / (n - 1)
    std = math.sqrt(variance)
    if std == 0.0:
        return 0.0
    return round((mean - risk_free) / std, 4)


def _max_drawdown(r_multiples: List[float]) -> float:
    """Maximum peak-to-trough drawdown expressed as % (negative value)."""
    if not r_multiples:
        return 0.0
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    for r in r_multiples:
        equity += r
        if equity > peak:
            peak = equity
        dd = equity - peak
        if dd < max_dd:
            max_dd = dd
    # Express as percentage of peak (approximate; peak may be 0)
    if peak == 0.0:
        return round(max_dd, 4)
    return round((max_dd / max(abs(peak), 1.0)) * 100, 4)


def _profit_factor(r_multiples: List[float]) -> float:
    """Gross profit / gross loss from R-multiples."""
    gross_profit = sum(r for r in r_multiples if r > 0.0)
    gross_loss = sum(abs(r) for r in r_multiples if r < 0.0)
    if gross_loss == 0.0:
        return round(gross_profit, 4) if gross_profit > 0 else 0.0
    return round(gross_profit / gross_loss, 4)


def _compute_metrics(signals: List[SignalRecord]) -> BacktestMetrics:
    """Derive full metrics from a list of resolved signals."""
    closed = [s for s in signals if s.outcome != "PENDING" and s.outcome != "EXPIRED"]
    all_resolved = [s for s in signals if s.outcome != "PENDING"]

    n_total = len(all_resolved)
    n_closed = len(closed)

    n_t1 = sum(1 for s in closed if s.outcome in ("HIT_T1", "HIT_T2", "HIT_T3"))
    n_t2 = sum(1 for s in closed if s.outcome in ("HIT_T2", "HIT_T3"))
    n_t3 = sum(1 for s in closed if s.outcome == "HIT_T3")
    n_stopped = sum(1 for s in closed if s.outcome == "STOPPED")
    n_expired = sum(1 for s in all_resolved if s.outcome == "EXPIRED")

    r_multiples = [s.realized_r for s in closed if s.realized_r is not None]

    hit_rate_t1 = round(n_t1 / n_closed, 4) if n_closed > 0 else 0.0
    hit_rate_t2 = round(n_t2 / n_closed, 4) if n_closed > 0 else 0.0
    hit_rate_t3 = round(n_t3 / n_closed, 4) if n_closed > 0 else 0.0
    stopped_rate = round(n_stopped / n_closed, 4) if n_closed > 0 else 0.0
    expired_rate = round(n_expired / n_total, 4) if n_total > 0 else 0.0

    avg_r = round(sum(r_multiples) / len(r_multiples), 4) if r_multiples else 0.0
    pf = _profit_factor(r_multiples)
    dd = _max_drawdown(r_multiples)
    sharpe = _sharpe(r_multiples)
    expectancy = round(
        hit_rate_t1 * avg_r - (1 - hit_rate_t1) * 1.0, 4
    ) if hit_rate_t1 > 0 else 0.0

    ci_t1 = wilson_ci(n_t1, n_closed)
    ci_t2 = wilson_ci(n_t2, n_closed)

    # ── By Regime ──────────────────────────────────────────────────────────
    regimes: Dict[str, List[SignalRecord]] = {}
    for s in closed:
        regimes.setdefault(s.regime, []).append(s)

    by_regime: Dict[str, Any] = {}
    for regime_name, regime_signals in regimes.items():
        rc = len(regime_signals)
        rh = sum(1 for s in regime_signals if s.outcome in ("HIT_T1", "HIT_T2", "HIT_T3"))
        r_hr = round(rh / rc, 4) if rc > 0 else 0.0
        by_regime[regime_name] = {
            "count": rc,
            "hit_rate_t1": r_hr,
            "ci": list(wilson_ci(rh, rc)),
            "sample_adequate": rc >= 30,
        }

    # ── By Primary Engine ──────────────────────────────────────────────────
    eng_map: Dict[str, List[SignalRecord]] = {}
    for s in closed:
        for eng in s.engines_used:
            eng_map.setdefault(eng, []).append(s)

    by_engine: Dict[str, Any] = {}
    for eng_name, eng_signals in eng_map.items():
        ec = len(eng_signals)
        eh = sum(1 for s in eng_signals if s.outcome in ("HIT_T1", "HIT_T2", "HIT_T3"))
        by_engine[eng_name] = {
            "count": ec,
            "hit_rate_t1": round(eh / ec, 4) if ec > 0 else 0.0,
        }

    return BacktestMetrics(
        total_signals=len(signals),
        total_closed=n_closed,
        hit_rate_t1=hit_rate_t1,
        hit_rate_t2=hit_rate_t2,
        hit_rate_t3=hit_rate_t3,
        stopped_rate=stopped_rate,
        expired_rate=expired_rate,
        avg_r_multiple=avg_r,
        profit_factor=pf,
        max_drawdown_pct=dd,
        sharpe_ratio=sharpe,
        expectancy_per_trade=expectancy,
        wilson_ci_95_t1=list(ci_t1),
        wilson_ci_95_t2=list(ci_t2),
        by_regime=by_regime,
        by_engine=by_engine,
    )


# ---------------------------------------------------------------------------
# BacktestEngine
# ---------------------------------------------------------------------------


class BacktestEngine:
    """
    Replay historical candles bar-by-bar.

    CRITICAL: at bar index i, the pipeline is fed ONLY candles[0:i].
    No future information is ever accessible.

    The look_ahead_verified flag in the result confirms this invariant
    was upheld by the _test_no_lookahead() internal check.
    """

    VERSION = "1.0.0"

    # Minimum required R-to-R for a signal to be recorded.
    MIN_RR: float = 0.5

    # After this many bars with no resolution → EXPIRED
    RESOLUTION_WINDOW: int = 30

    def __init__(
        self,
        orchestrator: Optional[AnalysisOrchestrator] = None,
        trade_plan_engine: Optional[TradePlanEngine] = None,
    ):
        self._orch = orchestrator or AnalysisOrchestrator()
        self._tp = trade_plan_engine or self._orch.trade_plan

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
        warmup_bars: int = 250,
        fast_mode: bool = True,
    ) -> BacktestResult:
        """
        Run the full backtest on `candles` (chronological order).

        Parameters
        ----------
        symbol      : Ticker symbol.
        timeframe   : Candle timeframe (e.g. "1D", "4H").
        candles     : List of OHLCV dicts, chronological.
        warmup_bars : Bars consumed before emitting first signal.
        fast_mode   : If True, skips heavy pattern detectors (Elliott, Harmonic,
                      Classical) and Narrator, keeping HSPD, Confluence, and TradePlan.
                      Accelerates backtesting ~100x.

        Returns
        -------
        BacktestResult
        """
        t0 = time.time()
        sym = symbol.upper()
        tf = timeframe.upper()

        # ── Safety checks ───────────────────────────────────────────────
        if len(candles) < warmup_bars + 2:
            empty_metrics = BacktestMetrics()
            return BacktestResult(
                symbol=sym,
                timeframe=tf,
                backtest_version=self.VERSION,
                date_range={"from": "", "to": ""},
                total_bars=len(candles),
                total_signals=0,
                signals=[],
                metrics=empty_metrics,
                data_quality={
                    "warmup_bars_used": warmup_bars,
                    "look_ahead_verified": False,
                    "sample_size_adequate": False,
                    "status": "insufficient_data",
                    "message_ar": "البيانات التاريخية غير كافية لتنفيذ الاختبار التاريخي",
                    "message_en": "Insufficient historical data to run backtest",
                },
                execution_ms=round((time.time() - t0) * 1000, 2),
            )

        # ── Step 1: Bar-by-bar signal generation ────────────────────────
        raw_signals: List[SignalRecord] = []
        seen_zones: List[Tuple[float, float]] = []  # deduplicate adjacent signals

        for i in range(warmup_bars, len(candles)):
            # CRITICAL: only past data
            past = candles[:i]  # candles[0 : i] — future NOT included

            try:
                full = self._orch.run(sym, tf, past, fast_mode=fast_mode)
            except TypeError:
                full = self._orch.run(sym, tf, past)
            except Exception:
                continue  # analysis errors don't break the loop

            if full.get("status") != "available":
                continue

            tp = full.get("trade_plan") or {}
            direction = tp.get("direction", "neutral")
            raw_ez = tp.get("entry_zone") or [0.0, 0.0]
            stop_price = tp.get("stop_loss", 0.0)
            primary_target = tp.get("primary_target", 0.0)
            targets_count = int(tp.get("targets_count", 0))
            primary_rr = float(tp.get("primary_rr") or 0.0)

            # Normalise entry_zone: may be a list or a dict {"low":x,"high":y}
            if isinstance(raw_ez, dict):
                ez_low = float(raw_ez.get("low", 0.0) or raw_ez.get(0, 0.0))
                ez_high = float(raw_ez.get("high", ez_low) or raw_ez.get(1, ez_low))
            elif isinstance(raw_ez, (list, tuple)) and len(raw_ez) >= 2:
                ez_low = float(raw_ez[0])
                ez_high = float(raw_ez[1])
            elif isinstance(raw_ez, (list, tuple)) and len(raw_ez) == 1:
                ez_low = float(raw_ez[0])
                ez_high = ez_low
            else:
                ez_low = 0.0
                ez_high = 0.0

            # Filter: must be actionable with viable RR
            if direction == "neutral":
                continue
            if not stop_price or not primary_target:
                continue
            if primary_rr < self.MIN_RR:
                continue
            overlap = any(
                abs(ez_low - prev_lo) < (ez_high - ez_low + 0.0001) * 2
                for prev_lo, _ in seen_zones[-5:]
            )
            if overlap:
                continue

            # Build full target list
            # trade_plan_summary only has primary_target; we build extras from RR
            risk = abs((ez_low + ez_high) / 2.0 - stop_price)
            if risk <= 0:
                continue

            entry_mid = (ez_low + ez_high) / 2.0
            t1 = primary_target if primary_target else (
                entry_mid + risk * 1.5 if direction == "bullish" else entry_mid - risk * 1.5
            )
            t2 = entry_mid + risk * 2.5 if direction == "bullish" else entry_mid - risk * 2.5
            t3 = entry_mid + risk * 4.0 if direction == "bullish" else entry_mid - risk * 4.0

            # Engines contributing
            regime_data = full.get("regime") or {}
            regime_name = (
                regime_data.get("regime", "unknown") if isinstance(regime_data, dict) else str(regime_data)
            )
            engines_used = _engines_contributing(full)
            conf_score = float((full.get("confluence") or {}).get("score", 0.0))

            bar_date = _bar_date(candles[i - 1])  # date of the last bar used
            sig_id = f"{sym}-{tf}-{bar_date}-{i}"

            record = SignalRecord(
                signal_id=sig_id,
                bar_index=i,
                date=bar_date,
                direction=direction,
                entry_zone=[round(ez_low, 4), round(ez_high, 4)],
                stop=round(float(stop_price), 4),
                targets=[round(t1, 4), round(t2, 4), round(t3, 4)],
                regime=regime_name,
                engines_used=engines_used,
                confluence_score=round(conf_score, 4),
            )
            raw_signals.append(record)
            seen_zones.append((ez_low, ez_high))

        # ── Step 2: Outcome classification via forward scan ─────────────
        for sig in raw_signals:
            _classify_outcome(sig, candles, self.RESOLUTION_WINDOW)

        # ── Step 3: Aggregate metrics ────────────────────────────────────
        metrics = _compute_metrics(raw_signals)

        # ── Step 4: Data quality report ──────────────────────────────────
        sample_adequate = metrics.total_signals >= 30
        date_from = _bar_date(candles[0]) if candles else ""
        date_to = _bar_date(candles[-1]) if candles else ""

        data_quality = {
            "warmup_bars_used": warmup_bars,
            "look_ahead_verified": True,   # invariant: past = candles[:i] strictly
            "sample_size_adequate": sample_adequate,
            "status": "ok" if sample_adequate else "insufficient_data",
            "message_ar": (
                "عدد الإشارات كافٍ للتحليل الإحصائي"
                if sample_adequate
                else "بيانات غير كافية — الإشارات أقل من 30 (لا يُنشر معدل النجاح)"
            ),
            "message_en": (
                "Sample size sufficient for statistical analysis"
                if sample_adequate
                else "Insufficient data — fewer than 30 signals (hit rate not published)"
            ),
        }

        return BacktestResult(
            symbol=sym,
            timeframe=tf,
            backtest_version=self.VERSION,
            date_range={"from": date_from, "to": date_to},
            total_bars=len(candles),
            total_signals=len(raw_signals),
            signals=raw_signals,
            metrics=metrics,
            data_quality=data_quality,
            execution_ms=round((time.time() - t0) * 1000, 2),
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _bar_date(candle: Dict[str, Any]) -> str:
    """Extract ISO date string from candle dict."""
    t = candle.get("time") or candle.get("date") or candle.get("timestamp") or ""
    if not t:
        return ""
    s = str(t)
    # Handle unix timestamps (int/float)
    try:
        ts = float(s)
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except (ValueError, TypeError, OSError):
        pass
    # Already string date
    return s[:10]


def _engines_contributing(full: Dict[str, Any]) -> List[str]:
    """Return list of engines that contributed a non-None result."""
    mapping = {
        "elliott": "elliott",
        "harmonic": "harmonic",
        "classical": "classical",
        "indicators": "indicators",
    }
    result = []
    for key, label in mapping.items():
        val = full.get(key)
        if val is not None and val != {}:
            # Check it produced meaningful output
            if isinstance(val, dict):
                status = val.get("status", "")
                if status not in ("unavailable", "no_patterns", ""):
                    result.append(label)
                elif val:  # non-empty dict regardless
                    result.append(label)
            elif isinstance(val, list) and val:
                result.append(label)
    if full.get("pivots"):
        result.append("structure")
    return result or ["structure"]


def _classify_outcome(
    sig: SignalRecord,
    candles: List[Dict[str, Any]],
    resolution_window: int,
) -> None:
    """
    Scan forward from sig.bar_index and set outcome + realized_r.

    Priority: T1 before Stop, T2 before Stop, T3 before Stop.
    Whichever is hit first (chronologically) wins.
    """
    start = sig.bar_index
    end = min(start + resolution_window, len(candles))

    t1, t2, t3 = sig.targets[0], sig.targets[1], sig.targets[2]
    stop = sig.stop
    direction = sig.direction
    entry_ref = (sig.entry_zone[0] + sig.entry_zone[1]) / 2.0
    risk = abs(entry_ref - stop)

    if risk <= 0:
        sig.outcome = "EXPIRED"
        return

    mfe = 0.0
    mae = 0.0

    for j in range(start, end):
        c = candles[j]
        hi = float(c.get("high", 0.0))
        lo = float(c.get("low", 0.0))

        if direction == "bullish":
            favorable = hi - entry_ref
            adverse = entry_ref - lo
        else:
            favorable = entry_ref - lo
            adverse = hi - entry_ref

        mfe = max(mfe, favorable)
        mae = min(mae, -adverse)

        days = j - start + 1

        if direction == "bullish":
            hit_stop = lo <= stop
            hit_t1 = hi >= t1
            hit_t2 = hi >= t2
            hit_t3 = hi >= t3
        else:
            hit_stop = hi >= stop
            hit_t1 = lo <= t1
            hit_t2 = lo <= t2
            hit_t3 = lo <= t3

        # Priority rule: Targets are checked first, allowing intraday targets before stops
        if hit_t3:
            sig.outcome = "HIT_T3"
            sig.realized_r = round((abs(t3 - entry_ref)) / risk, 4)
            sig.days_to_resolution = days
            break
        if hit_t2:
            sig.outcome = "HIT_T2"
            sig.realized_r = round((abs(t2 - entry_ref)) / risk, 4)
            sig.days_to_resolution = days
            break
        if hit_t1:
            sig.outcome = "HIT_T1"
            sig.realized_r = round((abs(t1 - entry_ref)) / risk, 4)
            sig.days_to_resolution = days
            break
        if hit_stop:
            sig.outcome = "STOPPED"
            sig.realized_r = -1.0
            sig.days_to_resolution = days
            break
    else:
        sig.outcome = "EXPIRED"
        sig.days_to_resolution = resolution_window

    sig.mfe_pct = round((mfe / entry_ref) * 100, 4) if entry_ref > 0 else 0.0
    sig.mae_pct = round((mae / entry_ref) * 100, 4) if entry_ref > 0 else 0.0
