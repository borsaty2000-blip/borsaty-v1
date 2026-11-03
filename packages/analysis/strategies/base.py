"""
Borsaty ProPicks Strategy Architecture
Base class and data contracts for institutional algorithmic stock selection strategies.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional


@dataclass
class StrategyStock:
    symbol: str
    name_ar: str
    name_en: str
    market: str
    current_price: float
    currency: str
    sector: str = "General"
    pe: float = 0.0
    sector_pe: float = 0.0
    pb: float = 0.0
    roe: float = 0.0
    debt_to_equity: float = 0.0
    dividend_yield: float = 0.0
    revenue_growth: float = 0.0
    technical_score: float = 0.0
    volume_ratio: float = 1.0
    price_above_sma200: bool = True
    rsi: float = 50.0
    harmonic_confidence: float = 0.0
    support_strength: float = 0.0
    fair_value_upside: float = 0.0
    unbroken_div_years: int = 1
    payout_ratio: float = 0.50
    return_1m: float = 0.0
    return_3m: float = 0.0
    return_6m: float = 0.0
    strategy_score: float = 0.0


@dataclass
class StrategyPick:
    symbol: str
    name_ar: str
    name_en: str
    market: str
    current_price: float
    currency: str
    strategy_score: float  # 0 to 100
    rank: int
    key_metric: str
    rationale_ar: str
    rationale_en: str
    sector: str = "General"
    entry_zone: List[float] = field(default_factory=list)
    target_price: float = 0.0
    stop_loss: float = 0.0
    risk_reward: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BacktestPoint:
    date: str
    strategy_return_pct: float
    benchmark_return_pct: float
    drawdown_pct: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StrategyBacktestResult:
    total_return_pct: float
    benchmark_return_pct: float
    alpha_pct: float
    cagr_pct: float
    annualized_return_pct: float
    win_rate_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown_pct: float
    avg_holding_period_days: int
    trades_count: int
    walk_forward_return_pct: float
    performance_curve: List[BacktestPoint] = field(default_factory=list)
    monthly_returns: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseStrategy(ABC):
    """Abstract base class for all Borsaty institutional strategies."""

    id: str
    name_en: str
    name_ar: str
    description_en: str
    description_ar: str
    tagline_en: str
    tagline_ar: str
    category: str
    benchmark: str
    risk_level: str  # "LOW" | "MODERATE" | "HIGH"

    @abstractmethod
    def get_universe(self) -> List[StrategyStock]:
        """Return candidate stock universe with foundational metrics."""
        pass

    @abstractmethod
    def filter_stocks(self, stocks: List[StrategyStock]) -> List[StrategyStock]:
        """Apply initial screening rules (valuation, momentum, balance sheet, or volume)."""
        pass

    @abstractmethod
    def score_stock(self, stock: StrategyStock) -> float:
        """Calculate and return quantitative score (0-100) for a candidate stock."""
        pass

    @abstractmethod
    def select_top_n(self, scored_stocks: List[StrategyStock], n: int = 10) -> List[StrategyPick]:
        """Select top N picks after applying sector concentration and conviction constraints."""
        pass

    def get_metadata(self) -> Dict[str, str]:
        """Return bilingual metadata and narrative descriptions."""
        return {
            "name_en": self.name_en,
            "name_ar": self.name_ar,
            "description_en": self.description_en,
            "description_ar": self.description_ar,
            "tagline_en": self.tagline_en,
            "tagline_ar": self.tagline_ar,
            "category": self.category,
            "benchmark": self.benchmark,
            "risk_level": self.risk_level,
        }

    def get_picks(self) -> List[StrategyPick]:
        """Default execution pipeline: Universe -> Filter -> Score -> Rank."""
        universe = self.get_universe()
        filtered = self.filter_stocks(universe)
        for s in filtered:
            s.strategy_score = self.score_stock(s)
        scored = sorted(filtered, key=lambda x: x.strategy_score, reverse=True)
        return self.select_top_n(scored)

    @abstractmethod
    def backtest_2y(self) -> StrategyBacktestResult:
        """Execute 24-month monthly rebalancing backtest against benchmark."""
        pass

    def to_summary_dict(self) -> Dict[str, Any]:
        picks = self.get_picks()
        backtest = self.backtest_2y()
        return {
            "id": self.id,
            "name_en": self.name_en,
            "name_ar": self.name_ar,
            "description_en": self.description_en,
            "description_ar": self.description_ar,
            "tagline_en": self.tagline_en,
            "tagline_ar": self.tagline_ar,
            "category": self.category,
            "benchmark": self.benchmark,
            "risk_level": self.risk_level,
            "cagr": backtest.cagr_pct,
            "sharpe": backtest.sharpe_ratio,
            "sortino": backtest.sortino_ratio,
            "max_dd": backtest.max_drawdown_pct,
            "win_rate": backtest.win_rate_pct,
            "total_return": backtest.total_return_pct,
            "benchmark_return": backtest.benchmark_return_pct,
            "alpha": backtest.alpha_pct,
            "top_picks": [p.to_dict() for p in picks],
            "top_3_current_picks": [p.to_dict() for p in picks[:3]],
            "backtest": backtest.to_dict(),
        }

    def to_detail_dict(self) -> Dict[str, Any]:
        summary = self.to_summary_dict()
        summary["picks"] = summary["top_picks"]
        return summary
