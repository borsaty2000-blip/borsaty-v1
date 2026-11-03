from typing import Dict, List, Any
from .base import BaseStrategy, StrategyPick, StrategyBacktestResult, BacktestPoint
from .value_strategy import ValueStrategy
from .momentum_strategy import MomentumStrategy
from .reversal_strategy import ReversalStrategy
from .dividend_strategy import DividendStrategy

STRATEGY_REGISTRY: Dict[str, BaseStrategy] = {
    "value": ValueStrategy(),
    "momentum": MomentumStrategy(),
    "reversal": ReversalStrategy(),
    "dividend": DividendStrategy(),
}

def get_strategy(strategy_id: str) -> BaseStrategy | None:
    return STRATEGY_REGISTRY.get(strategy_id.lower().strip())

def list_all_strategies() -> List[Dict[str, Any]]:
    return [strat.to_summary_dict() for strat in STRATEGY_REGISTRY.values()]

__all__ = [
    "BaseStrategy",
    "StrategyPick",
    "StrategyBacktestResult",
    "BacktestPoint",
    "ValueStrategy",
    "MomentumStrategy",
    "ReversalStrategy",
    "DividendStrategy",
    "STRATEGY_REGISTRY",
    "get_strategy",
    "list_all_strategies",
]
