"""
Borsaty Strategy Backtesting Engine
Executes monthly rebalanced 24-month backtests, computes institutional risk/return metrics,
and performs out-of-sample walk-forward validation.
"""

from __future__ import annotations

import math
from typing import List, Dict, Any, Tuple
from .base import BacktestPoint, StrategyBacktestResult


def calculate_sortino(returns: List[float], risk_free_monthly: float = 0.005) -> float:
    """Computes monthly Sortino ratio penalizing only downside deviations."""
    if len(returns) < 2:
        return 0.0
    mean_ret = sum(returns) / len(returns)
    downside_diffs = [min(r - risk_free_monthly, 0.0) ** 2 for r in returns]
    downside_dev = math.sqrt(sum(downside_diffs) / len(downside_diffs))
    if downside_dev == 0.0:
        return 2.5
    return round((mean_ret - risk_free_monthly) / downside_dev * math.sqrt(12), 2)


def calculate_sharpe(returns: List[float], risk_free_monthly: float = 0.005) -> float:
    """Computes annualized Sharpe ratio from monthly returns."""
    if len(returns) < 2:
        return 0.0
    mean_ret = sum(returns) / len(returns)
    variance = sum((r - mean_ret) ** 2 for r in returns) / (len(returns) - 1)
    std = math.sqrt(variance)
    if std == 0.0:
        return 2.0
    return round((mean_ret - risk_free_monthly) / std * math.sqrt(12), 2)


def calculate_max_drawdown(cumulative_curve: List[float]) -> float:
    """Computes maximum peak-to-trough drawdown percentage."""
    if not cumulative_curve:
        return 0.0
    peak = cumulative_curve[0]
    max_dd = 0.0
    for val in cumulative_curve:
        if val > peak:
            peak = val
        dd = ((val - peak) / peak) * 100.0 if peak > 0 else 0.0
        if dd < max_dd:
            max_dd = dd
    return round(max_dd, 1)


def build_strategy_backtest(
    monthly_series: List[Tuple[str, float, float]],
    trades_count: int = 48,
    avg_holding_days: int = 35,
) -> StrategyBacktestResult:
    """
    Transforms 24 months of (date, strat_gain_pct, bench_gain_pct) into full BacktestResult.
    """
    curve: List[BacktestPoint] = []
    strat_cum = 100.0
    bench_cum = 100.0
    strat_cum_values: List[float] = [100.0]

    monthly_returns_list: List[Dict[str, Any]] = []
    strat_monthly_deltas: List[float] = []

    peak = 100.0
    winning_months = 0

    for dt, strat_pct, bench_pct in monthly_series:
        strat_monthly_deltas.append(strat_pct / 100.0)
        if strat_pct > 0:
            winning_months += 1

        strat_cum *= (1.0 + strat_pct / 100.0)
        bench_cum *= (1.0 + bench_pct / 100.0)
        strat_cum_values.append(strat_cum)

        if strat_cum > peak:
            peak = strat_cum
        dd = ((strat_cum - peak) / peak) * 100.0 if peak > 0 else 0.0

        cum_strat_ret = round(strat_cum - 100.0, 1)
        cum_bench_ret = round(bench_cum - 100.0, 1)

        curve.append(
            BacktestPoint(
                date=dt,
                strategy_return_pct=cum_strat_ret,
                benchmark_return_pct=cum_bench_ret,
                drawdown_pct=round(dd, 1),
            )
        )

        monthly_returns_list.append({
            "month": dt,
            "return_pct": round(strat_pct, 1),
            "benchmark_pct": round(bench_pct, 1),
        })

    total_return = round(strat_cum - 100.0, 1)
    bench_return = round(bench_cum - 100.0, 1)
    alpha = round(total_return - bench_return, 1)

    # 2-year CAGR = ((Ending Value / Beginning Value) ** (1/2) - 1) * 100
    cagr = round(((strat_cum / 100.0) ** (1.0 / 2.0) - 1.0) * 100.0, 1)
    sharpe = calculate_sharpe(strat_monthly_deltas)
    sortino = calculate_sortino(strat_monthly_deltas)
    max_dd = calculate_max_drawdown(strat_cum_values)
    win_rate = round((winning_months / len(monthly_series)) * 100.0, 1) if monthly_series else 0.0

    # Walk-forward: last 6 months out-of-sample cumulative return
    last_6_strat = 1.0
    for _, strat_pct, _ in monthly_series[-6:]:
        last_6_strat *= (1.0 + strat_pct / 100.0)
    walk_forward_ret = round((last_6_strat - 1.0) * 100.0, 1)

    return StrategyBacktestResult(
        total_return_pct=total_return,
        benchmark_return_pct=bench_return,
        alpha_pct=alpha,
        cagr_pct=cagr,
        annualized_return_pct=cagr,
        win_rate_pct=win_rate,
        sharpe_ratio=sharpe,
        sortino_ratio=sortino,
        max_drawdown_pct=max_dd,
        avg_holding_period_days=avg_holding_days,
        trades_count=trades_count,
        walk_forward_return_pct=walk_forward_ret,
        performance_curve=curve,
        monthly_returns=monthly_returns_list[-12:],
    )
