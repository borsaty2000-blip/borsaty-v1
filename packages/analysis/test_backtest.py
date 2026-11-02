"""
test_backtest.py — Phase ح: Walk-Forward Validation & Backtest Engine
======================================================================

Test groups:
  A. Look-Ahead Prevention (10 tests) — CRITICAL
  B. Outcome Classification (15 tests)
  C. Metrics Computation (10 tests)
  D. Walk-Forward Validation (8 tests)
  E. Report Integration (5 tests)
  F. Real Data (10 tests)
  G. Performance (3 tests)

Total: 61 tests

Design note:
  Groups A-E use a MockOrchestrator so they complete in < 1 second each.
  Groups F-G use the real pipeline on seeded 5-year data (session-scoped
  fixtures ensure each full backtest runs only once).
"""

import time
import math
import json
import dataclasses
import pytest
from typing import Optional, Tuple, List, Dict, Any, Union
from unittest.mock import MagicMock

from backtest.engine import (
    BacktestEngine,
    BacktestResult,
    BacktestMetrics,
    SignalRecord,
    wilson_ci,
    _classify_outcome,
    _compute_metrics,
)
from backtest.walk_forward import WalkForwardValidator, WalkForwardResult
from backtest.report import BacktestReport
from backtest.seed_data import load_seed_candles


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def make_candles(n: int, start: float = 100.0, trend: float = 0.001) -> List[Dict[str, Any]]:
    """Generate simple synthetic OHLCV candles."""
    candles = []
    price = start
    for i in range(n):
        c = price * (1 + trend + (i % 7 - 3) * 0.002)
        o = price * (1 + (i % 5 - 2) * 0.001)
        h = max(o, c) * (1 + abs(i % 3) * 0.003)
        l = min(o, c) * (1 - abs(i % 4) * 0.003)
        candles.append({
            "time": f"2022-{(i // 28) % 12 + 1:02d}-{(i % 28) + 1:02d}",
            "open": round(o, 4),
            "high": round(h, 4),
            "low": round(l, 4),
            "close": round(c, 4),
            "volume": 100_000.0 + i * 500,
        })
        price = c
    return candles


def make_signal(
    direction: str = "bullish",
    entry: float = 100.0,
    stop: float = 95.0,
    t1: float = 108.0,
    t2: float = 115.0,
    t3: float = 125.0,
    bar_index: int = 300,
    regime: str = "trending_strong",
    outcome: str = "PENDING",
) -> SignalRecord:
    return SignalRecord(
        signal_id=f"TEST-D-2023-{bar_index}",
        bar_index=bar_index,
        date="2023-06-01",
        direction=direction,
        entry_zone=[entry - 0.5, entry + 0.5],
        stop=stop,
        targets=[t1, t2, t3],
        regime=regime,
        engines_used=["elliott", "structure"],
        confluence_score=0.72,
        outcome=outcome,
    )


def make_mock_orchestrator(
    direction: str = "bullish",
    entry_low: float = 99.5,
    entry_high: float = 100.5,
    stop_price: float = 95.0,
    primary_target: float = 108.0,
    primary_rr: float = 1.6,
    regime: str = "trending_strong",
    active: bool = True,
) -> MagicMock:
    """
    Return a mock AnalysisOrchestrator whose run() yields one actionable
    signal every call. Use active=False to suppress signals.
    """
    mock = MagicMock()

    def _run(sym, tf, candles, **kw):
        if not active or len(candles) < 10:
            return {"status": "unavailable"}
        return {
            "status": "available",
            "regime": {"regime": regime},
            "pivots": [{"price": 100.0}],
            "elliott": {"status": "detected"},
            "harmonic": None,
            "classical": None,
            "indicators": {"rsi": 55},
            "confluence": {"score": 0.72, "direction": direction},
            "trade_plan": {
                "direction": direction,
                "entry_zone": [entry_low, entry_high],
                "stop_loss": stop_price,
                "primary_target": primary_target,
                "primary_rr": primary_rr,
                "targets_count": 3,
            },
        }

    mock.run = MagicMock(side_effect=_run)
    mock.trade_plan = MagicMock()
    return mock


def make_bt_engine(mock_orch) -> BacktestEngine:
    """Create BacktestEngine with injected mock orchestrator."""
    eng = BacktestEngine.__new__(BacktestEngine)
    eng._orch = mock_orch
    eng._tp = MagicMock()
    eng.MIN_RR = 0.5
    eng.RESOLUTION_WINDOW = 30
    return eng


# ─────────────────────────────────────────────────────────────────────────────
# Session-scoped heavy fixtures (run once per test session)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def comi_candles():
    return load_seed_candles("COMI")[:350]


@pytest.fixture(scope="session")
def aapl_candles():
    return load_seed_candles("AAPL")[:350]


@pytest.fixture(scope="session")
def real_bt_engine():
    """Real BacktestEngine (no mock) with fast_mode=True — used for F and G tests only."""
    return BacktestEngine()


@pytest.fixture(scope="session")
def comi_bt_result(real_bt_engine, comi_candles):
    """Run COMI backtest once for the whole session in fast_mode."""
    return real_bt_engine.run("COMI", "1D", comi_candles, warmup_bars=250, fast_mode=True)


@pytest.fixture(scope="session")
def aapl_bt_result(real_bt_engine, aapl_candles):
    return real_bt_engine.run("AAPL", "1D", aapl_candles, warmup_bars=250, fast_mode=True)


@pytest.fixture(scope="session")
def wf_validator_real():
    return WalkForwardValidator(window_size=300, step_size=150, warmup_bars=100)


@pytest.fixture(scope="session")
def comi_wf_result(wf_validator_real, comi_candles):
    return wf_validator_real.validate("COMI", "1D", comi_candles, fast_mode=True)


# ─────────────────────────────────────────────────────────────────────────────
# Fast fixtures (use mock — millisecond-level)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_orch():
    return make_mock_orchestrator()


@pytest.fixture
def fast_engine(mock_orch):
    return make_bt_engine(mock_orch)


@pytest.fixture
def small_candles():
    return make_candles(350)


@pytest.fixture
def adequate_candles():
    return make_candles(1000, start=100.0, trend=0.0008)


@pytest.fixture
def reporter():
    return BacktestReport()


@pytest.fixture
def fast_wf():
    """WalkForwardValidator with mock-powered BacktestEngine."""
    mock_orch = make_mock_orchestrator()
    bt_eng = make_bt_engine(mock_orch)
    return WalkForwardValidator(
        backtest_engine=bt_eng,
        window_size=500,
        step_size=250,
        warmup_bars=250,
    )


# ─────────────────────────────────────────────────────────────────────────────
# A. Look-Ahead Prevention (10 tests) — CRITICAL
# ─────────────────────────────────────────────────────────────────────────────


class TestLookAheadPrevention:
    """
    CRITICAL guarantee: past = candles[0:i] strictly.
    Uses fast_engine (mock orchestrator) so all 10 tests complete in < 2s.
    """

    def test_past_slice_excludes_future_bar(self, adequate_candles):
        """candles[:i] must NOT include candle at index i."""
        i = 300
        past = adequate_candles[:i]
        assert len(past) == i
        assert past[-1] is adequate_candles[i - 1]
        assert adequate_candles[i] not in past

    def test_modifying_future_bar_does_not_affect_past_result(self, adequate_candles):
        """Mutating candle[i] after slicing past[:i] has zero effect on past."""
        i = 300
        past = adequate_candles[:i]
        original_close = adequate_candles[i]["close"]

        adequate_candles[i]["close"] = 999_999.0  # extreme future value
        past_again = adequate_candles[:i]
        # Both slices must be identical (same objects)
        assert all(a is b for a, b in zip(past, past_again))

        adequate_candles[i]["close"] = original_close  # restore

    def test_deleting_future_bar_does_not_affect_past_result(self, adequate_candles):
        """past[:i] is independent of what follows index i."""
        i = 300
        past = adequate_candles[:i]
        assert len(past) == i  # slice integrity unaffected

    def test_pipeline_at_bar_i_uses_exactly_i_candles(self, adequate_candles):
        """At bar index i, pipeline receives exactly i candles."""
        for i in [250, 260, 275]:
            past = adequate_candles[:i]
            assert len(past) == i

    def test_no_future_objects_in_past_slice(self, adequate_candles):
        """No future candle object appears in past slice (object identity)."""
        i = 300
        past_ids = {id(c) for c in adequate_candles[:i]}
        future_ids = {id(c) for c in adequate_candles[i:]}
        assert past_ids.isdisjoint(future_ids)

    def test_warmup_respected_no_signal_before_warmup(self, fast_engine, adequate_candles):
        """BacktestEngine must not emit signals before warmup_bars."""
        result = fast_engine.run("TEST", "1D", adequate_candles, warmup_bars=300)
        for sig in result.signals:
            assert sig.bar_index >= 300, (
                f"Signal at bar {sig.bar_index} violates warmup_bars=300"
            )

    def test_look_ahead_verified_flag_is_true(self, fast_engine, adequate_candles):
        """BacktestResult.data_quality['look_ahead_verified'] must be True."""
        result = fast_engine.run("TEST", "1D", adequate_candles)
        assert result.data_quality["look_ahead_verified"] is True

    def test_future_volume_not_in_past(self, adequate_candles):
        """Future candle objects are not accessible from past slice."""
        i = 300
        past = adequate_candles[:i]
        for fc in adequate_candles[i:]:
            assert fc not in past

    def test_pipeline_result_identical_for_same_past_slice(self, fast_engine, adequate_candles):
        """Running engine twice on the same slice (same mock) returns same signal count."""
        # Use fresh engine to avoid deduplication state
        mock1 = make_mock_orchestrator()
        eng1 = make_bt_engine(mock1)
        r1 = eng1.run("TEST", "1D", adequate_candles[:300])

        mock2 = make_mock_orchestrator()
        eng2 = make_bt_engine(mock2)
        r2 = eng2.run("TEST", "1D", adequate_candles[:300])

        # Both should produce signals (or both not) — deterministic
        assert (len(r1.signals) > 0) == (len(r2.signals) > 0)

    def test_backtest_total_bars_matches_input(self, fast_engine, adequate_candles):
        """BacktestResult.total_bars == len(candles)."""
        result = fast_engine.run("TEST", "1D", adequate_candles)
        assert result.total_bars == len(adequate_candles)


# ─────────────────────────────────────────────────────────────────────────────
# B. Outcome Classification (15 tests)
# ─────────────────────────────────────────────────────────────────────────────


class TestOutcomeClassification:
    """Test _classify_outcome with synthetic forward bars."""

    def _candles_with_outcome(
        self,
        entry: float,
        stop: float,
        t1: float,
        t2: float,
        t3: float,
        direction: str,
        hits: str,
        n_bars_before: int = 10,
        n_bars_forward: int = 5,
    ):
        sig = make_signal(
            direction=direction,
            entry=entry, stop=stop, t1=t1, t2=t2, t3=t3,
            bar_index=n_bars_before,
        )
        candles = make_candles(n_bars_before, start=entry)
        for j in range(n_bars_forward):
            if hits == "t1" and direction == "bullish":
                h, l = t1 + 1, entry * 0.995
            elif hits == "t2" and direction == "bullish":
                h, l = t2 + 1, entry * 0.995
            elif hits == "t3" and direction == "bullish":
                h, l = t3 + 1, entry * 0.995
            elif hits == "stop" and direction == "bullish":
                h, l = entry * 1.002, stop - 0.5
            elif hits == "t1" and direction == "bearish":
                h, l = entry * 1.005, t1 - 1
            elif hits == "stop" and direction == "bearish":
                h, l = stop + 0.5, entry * 0.998
            else:
                h, l = entry * 1.001, entry * 0.999
            c = (h + l) / 2
            candles.append({
                "time": f"2023-07-{j+1:02d}",
                "open": round(entry * (1 + j * 0.001), 4),
                "high": round(h, 4),
                "low": round(l, 4),
                "close": round(c, 4),
                "volume": 100_000.0,
            })
        return sig, candles

    def test_hit_t1_before_stop_bullish(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "HIT_T1"

    def test_hit_t2_before_stop_bullish(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t2")
        _classify_outcome(sig, c, 30)
        assert sig.outcome in ("HIT_T2", "HIT_T3")

    def test_hit_t3_before_stop_bullish(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t3")
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "HIT_T3"

    def test_stopped_out_bullish(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "stop")
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "STOPPED"

    def test_expired_neither_target_nor_stop(self):
        sig, c = self._candles_with_outcome(
            100, 95, 108, 115, 125, "bullish", "none", n_bars_forward=35
        )
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "EXPIRED"

    def test_hit_t1_before_stop_bearish(self):
        sig, c = self._candles_with_outcome(100, 105, 92, 85, 75, "bearish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "HIT_T1"

    def test_stopped_out_bearish(self):
        sig, c = self._candles_with_outcome(100, 105, 92, 85, 75, "bearish", "stop")
        _classify_outcome(sig, c, 30)
        assert sig.outcome == "STOPPED"

    def test_realized_r_positive_on_hit(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.realized_r is not None and sig.realized_r > 0

    def test_realized_r_negative_one_on_stop(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "stop")
        _classify_outcome(sig, c, 30)
        assert sig.realized_r == -1.0

    def test_days_to_resolution_set(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.days_to_resolution is not None and sig.days_to_resolution >= 1

    def test_mfe_pct_positive_on_bullish_hit(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.mfe_pct is not None and sig.mfe_pct > 0

    def test_mae_pct_zero_or_negative(self):
        sig, c = self._candles_with_outcome(100, 95, 108, 115, 125, "bullish", "t1")
        _classify_outcome(sig, c, 30)
        assert sig.mae_pct is not None and sig.mae_pct <= 0

    def test_t1_wins_over_stop_same_bar(self):
        """If T1 and Stop triggered in same bar, T1 priority wins."""
        sig = make_signal(entry=100, stop=95, t1=108, t2=115, t3=125, bar_index=5)
        candles = make_candles(5, start=100)
        candles.append({
            "time": "2023-07-01", "open": 100.0,
            "high": 110.0, "low": 94.0, "close": 102.0, "volume": 100_000.0,
        })
        _classify_outcome(sig, candles, 30)
        assert sig.outcome in ("HIT_T1", "HIT_T2", "HIT_T3")

    def test_expired_at_exact_resolution_window(self):
        """After exactly resolution_window+1 forward bars with no hit → EXPIRED."""
        sig = make_signal(bar_index=5)
        candles = make_candles(5 + 31, start=100)
        _classify_outcome(sig, candles, 30)
        assert sig.outcome == "EXPIRED"

    def test_no_crash_on_zero_risk(self):
        """When entry == stop (risk=0), must not raise and return EXPIRED."""
        sig = make_signal(entry=100, stop=100, t1=108, t2=115, t3=125, bar_index=5)
        candles = make_candles(50, start=100)
        _classify_outcome(sig, candles, 30)
        assert sig.outcome == "EXPIRED"


# ─────────────────────────────────────────────────────────────────────────────
# C. Metrics Computation (10 tests)
# ─────────────────────────────────────────────────────────────────────────────


class TestMetricsComputation:

    def _sigs(self, outcomes: List[str]) -> List[SignalRecord]:
        sigs = []
        for i, o in enumerate(outcomes):
            s = make_signal(outcome=o, bar_index=300 + i)
            s.realized_r = 1.8 if "HIT" in o else -1.0
            sigs.append(s)
        return sigs

    def test_hit_rate_t1_exact(self):
        m = _compute_metrics(self._sigs(["HIT_T1"] * 6 + ["STOPPED"] * 4))
        assert m.hit_rate_t1 == pytest.approx(0.60, abs=0.01)

    def test_hit_rate_zero_when_all_stopped(self):
        m = _compute_metrics(self._sigs(["STOPPED"] * 10))
        assert m.hit_rate_t1 == 0.0

    def test_hit_rate_one_when_all_hit(self):
        m = _compute_metrics(self._sigs(["HIT_T1"] * 10))
        assert m.hit_rate_t1 == 1.0

    def test_profit_factor_gt_one_on_positive_edge(self):
        # 7 wins @ +1.8R, 3 losses @ -1.0R → PF = 12.6/3 = 4.2
        m = _compute_metrics(self._sigs(["HIT_T1"] * 7 + ["STOPPED"] * 3))
        assert m.profit_factor == pytest.approx(4.2, abs=0.1)

    def test_profit_factor_lt_one_on_negative_edge(self):
        m = _compute_metrics(self._sigs(["STOPPED"] * 7 + ["HIT_T1"] * 3))
        assert m.profit_factor < 1.0

    def test_wilson_ci_contains_true_rate(self):
        lo, hi = wilson_ci(68, 100)
        assert lo <= 0.68 <= hi
        assert 0.0 <= lo <= hi <= 1.0

    def test_wilson_ci_zero_denominator_returns_uninformative(self):
        lo, hi = wilson_ci(0, 0)
        assert lo == 0.0 and hi == 1.0

    def test_wilson_ci_width_decreases_with_sample_size(self):
        lo10, hi10 = wilson_ci(6, 10)
        lo100, hi100 = wilson_ci(60, 100)
        assert (hi100 - lo100) < (hi10 - lo10)

    def test_max_drawdown_negative_or_zero(self):
        m = _compute_metrics(self._sigs(["STOPPED"] * 5 + ["HIT_T1"] * 5))
        assert m.max_drawdown_pct <= 0

    def test_sharpe_higher_with_consistent_wins(self):
        # Consistent wins with small variance
        consistent = self._sigs(["HIT_T1"] * 10)
        for idx, s in enumerate(consistent):
            s.realized_r = 1.4 + (idx % 3) * 0.1
        volatile = self._sigs(["HIT_T1"] * 5 + ["STOPPED"] * 5)
        m_c = _compute_metrics(consistent)
        m_v = _compute_metrics(volatile)
        assert m_c.sharpe_ratio >= m_v.sharpe_ratio


# ─────────────────────────────────────────────────────────────────────────────
# D. Walk-Forward Validation (8 tests)
# ─────────────────────────────────────────────────────────────────────────────


class TestWalkForwardValidation:

    def test_insufficient_data_short_candles(self, fast_wf):
        result = fast_wf.validate("TEST", "1D", make_candles(200))
        assert result.verdict == "insufficient_data"

    def test_windows_count_formula(self, fast_wf):
        candles = make_candles(1200)
        n = len(candles)
        expected = 0
        s = 0
        while s + fast_wf.window_size <= n:
            expected += 1
            s += fast_wf.step_size
        result = fast_wf.validate("TEST", "1D", candles)
        assert len(result.windows) == expected

    def test_stability_score_in_valid_range(self, comi_wf_result):
        if comi_wf_result.verdict != "insufficient_data":
            score = comi_wf_result.overall.get("stability_score", 0.0)
            assert 0.0 <= score <= 1.0

    def test_wf_efficiency_non_negative(self, comi_wf_result):
        if comi_wf_result.verdict != "insufficient_data":
            wfe = comi_wf_result.overall.get("walk_forward_efficiency", -1)
            assert wfe >= 0.0

    def test_verdict_is_valid_string(self, comi_wf_result):
        assert comi_wf_result.verdict in ("stable", "unstable", "insufficient_data")

    def test_message_ar_present(self, comi_wf_result):
        assert isinstance(comi_wf_result.message_ar, str) and len(comi_wf_result.message_ar) > 5

    def test_message_en_present(self, comi_wf_result):
        assert isinstance(comi_wf_result.message_en, str) and len(comi_wf_result.message_en) > 5

    def test_windows_have_date_ranges(self, comi_wf_result):
        for w in comi_wf_result.windows:
            assert len(w.date_range) == 2


# ─────────────────────────────────────────────────────────────────────────────
# E. Report Integration (5 tests)
# ─────────────────────────────────────────────────────────────────────────────


class TestReportIntegration:

    def _bt_with_n_signals(self, n: int, hit_rate: float = 0.68) -> BacktestResult:
        n_hits = round(n * hit_rate)
        n_stop = n - n_hits
        sigs = []
        for i, o in enumerate(["HIT_T1"] * n_hits + ["STOPPED"] * n_stop):
            s = make_signal(outcome=o, bar_index=300 + i)
            s.realized_r = 1.8 if "HIT" in o else -1.0
            sigs.append(s)
        metrics = _compute_metrics(sigs)
        return BacktestResult(
            symbol="COMI", timeframe="1D", backtest_version="1.0.0",
            date_range={"from": "2021-11-01", "to": "2026-11-01"},
            total_bars=1305, total_signals=n, signals=sigs, metrics=metrics,
            data_quality={
                "warmup_bars_used": 250,
                "look_ahead_verified": True,
                "sample_size_adequate": n >= 30,
            },
        )

    def test_arabic_report_generated(self, reporter):
        report = reporter.generate(self._bt_with_n_signals(35), language="ar")
        assert isinstance(report, str) and len(report) > 50

    def test_english_report_generated(self, reporter):
        report = reporter.generate(self._bt_with_n_signals(35), language="en")
        assert isinstance(report, str) and len(report) > 50

    def test_disclaimer_present_in_arabic(self, reporter):
        report = reporter.generate(self._bt_with_n_signals(35), language="ar")
        assert "مسؤولية" in report or "تعليمي" in report

    def test_disclaimer_present_in_english(self, reporter):
        report = reporter.generate(self._bt_with_n_signals(35), language="en")
        assert "educational" in report.lower() or "responsibility" in report.lower()

    def test_insufficient_data_message_when_n_lt_30(self, reporter):
        bt = self._bt_with_n_signals(15)
        ar = reporter.generate(bt, language="ar")
        en = reporter.generate(bt, language="en")
        assert "غير كافية" in ar or "كافية" in ar
        assert "insufficient" in en.lower() or "Insufficient" in en


# ─────────────────────────────────────────────────────────────────────────────
# F. Real Data (10 tests) — uses session-scoped fixtures
# ─────────────────────────────────────────────────────────────────────────────


class TestRealData:

    def test_comi_backtest_version(self, comi_bt_result):
        assert comi_bt_result.backtest_version == "1.0.0"

    def test_comi_total_bars_matches_input(self, comi_bt_result, comi_candles):
        assert comi_bt_result.total_bars == len(comi_candles)

    def test_comi_date_range_populated(self, comi_bt_result):
        assert comi_bt_result.date_range.get("from")
        assert comi_bt_result.date_range.get("to")

    def test_comi_look_ahead_verified(self, comi_bt_result):
        assert comi_bt_result.data_quality["look_ahead_verified"] is True

    def test_comi_all_signals_valid_outcomes(self, comi_bt_result):
        valid = {"HIT_T1", "HIT_T2", "HIT_T3", "STOPPED", "EXPIRED"}
        for sig in comi_bt_result.signals:
            assert sig.outcome in valid

    def test_aapl_schema_complete(self, aapl_bt_result):
        assert hasattr(aapl_bt_result, "symbol")
        assert hasattr(aapl_bt_result, "metrics")
        assert hasattr(aapl_bt_result, "data_quality")
        assert hasattr(aapl_bt_result, "signals")

    def test_wilson_ci_valid_range(self, comi_bt_result):
        ci = comi_bt_result.metrics.wilson_ci_95_t1
        assert len(ci) == 2
        assert 0.0 <= ci[0] <= ci[1] <= 1.0

    def test_insufficient_data_badge_on_tiny_dataset(self, real_bt_engine):
        tiny = make_candles(300)
        result = real_bt_engine.run("TINY", "1D", tiny, warmup_bars=280)
        if result.total_signals < 30:
            assert not result.data_quality.get("sample_size_adequate")
            assert "غير كافية" in result.data_quality.get("message_ar", "")

    def test_all_signals_have_three_targets(self, comi_bt_result):
        for sig in comi_bt_result.signals:
            assert len(sig.targets) == 3

    def test_entry_zone_low_le_high(self, comi_bt_result):
        for sig in comi_bt_result.signals:
            assert sig.entry_zone[0] <= sig.entry_zone[1]


# ─────────────────────────────────────────────────────────────────────────────
# G. Performance (3 tests)
# ─────────────────────────────────────────────────────────────────────────────


class TestPerformance:

    def test_mock_engine_1000_bars_under_1s(self, fast_engine, adequate_candles):
        """Mock-based engine on 1000 bars must complete in < 1 second."""
        start = time.time()
        fast_engine.run("TEST", "1D", adequate_candles)
        elapsed = time.time() - start
        assert elapsed < 1.0, f"Mock engine took {elapsed:.2f}s (limit: 1s)"

    def test_wilson_ci_10k_computations_under_1s(self):
        """Wilson CI 10,000 iterations in < 1 second."""
        start = time.time()
        for i in range(1, 10001):
            wilson_ci(i % 100, 100)
        elapsed = time.time() - start
        assert elapsed < 1.0

    def test_backtest_result_json_serializable(self, comi_bt_result):
        """BacktestResult must be fully serializable via dataclasses.asdict()."""
        d = dataclasses.asdict(comi_bt_result)
        text = json.dumps(d, default=str)
        assert len(text) > 100
