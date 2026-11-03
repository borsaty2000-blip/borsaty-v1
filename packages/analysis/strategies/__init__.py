from typing import Dict, List, Any
from .base import BaseStrategy, StrategyStock, StrategyPick, StrategyBacktestResult, BacktestPoint
from .value_strategy import ValueStrategy
from .momentum_strategy import MomentumStrategy
from .reversal_strategy import ReversalHunterStrategy
from .dividend_strategy import DividendAristocratStrategy
from .quality_growth_strategy import QualityGrowthStrategy

_STRATEGY_INSTANCES = [
    ValueStrategy(),
    MomentumStrategy(),
    ReversalHunterStrategy(),
    DividendAristocratStrategy(),
    QualityGrowthStrategy(),
]

STRATEGY_REGISTRY: Dict[str, BaseStrategy] = {
    strat.id: strat for strat in _STRATEGY_INSTANCES
}

# Alias resolution mapping
STRATEGY_ALIASES: Dict[str, str] = {
    "value_compounder": "value",
    "momentum_leader": "momentum",
    "reversal_hunter": "reversal",
    "dividend_aristocrat": "dividend",
    "growth": "quality_growth",
}

def get_strategy(strategy_id: str) -> BaseStrategy | None:
    norm = strategy_id.lower().strip()
    resolved_id = STRATEGY_ALIASES.get(norm, norm)
    return STRATEGY_REGISTRY.get(resolved_id)

def list_all_strategies() -> List[Dict[str, Any]]:
    return [strat.to_summary_dict() for strat in _STRATEGY_INSTANCES]

__all__ = [
    "BaseStrategy",
    "StrategyStock",
    "StrategyPick",
    "StrategyBacktestResult",
    "BacktestPoint",
    "ValueStrategy",
    "MomentumStrategy",
    "ReversalHunterStrategy",
    "DividendAristocratStrategy",
    "QualityGrowthStrategy",
    "STRATEGY_REGISTRY",
    "get_strategy",
    "list_all_strategies",
]
