"""
Borsaty ProPicks Strategy Architecture
Base class and data contracts for institutional algorithmic stock selection strategies.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional


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

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StrategyBacktestResult:
    total_return_pct: float
    benchmark_return_pct: float
    alpha_pct: float
    annualized_return_pct: float
    win_rate_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    trades_count: int
    performance_curve: List[BacktestPoint] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseStrategy(ABC):
    """Abstract base class for all Borsaty institutional strategies."""

    id: str
    name_en: str
    name_ar: str
    tagline_en: str
    tagline_ar: str
    category: str
    benchmark: str
    risk_level: str  # "LOW" | "MODERATE" | "HIGH"

    @abstractmethod
    def get_picks(self) -> List[StrategyPick]:
        """Return the ranked stock picks according to this strategy."""
        pass

    @abstractmethod
    def backtest_2y(self) -> StrategyBacktestResult:
        """Return 24-month backtest performance compared to benchmark."""
        pass

    def to_summary_dict(self) -> Dict[str, Any]:
        picks = self.get_picks()
        backtest = self.backtest_2y()
        return {
            "id": self.id,
            "name_en": self.name_en,
            "name_ar": self.name_ar,
            "tagline_en": self.tagline_en,
            "tagline_ar": self.tagline_ar,
            "category": self.category,
            "benchmark": self.benchmark,
            "risk_level": self.risk_level,
            "top_picks": [p.to_dict() for p in picks[:5]],
            "backtest": backtest.to_dict(),
        }
