"""
Market Regime Detection Engine (Borsaty).
Classifies deterministic market regimes across 7 states:
trending_strong, trending_weak, ranging, volatile_expansion,
volatile_contraction, breakout, mean_reversion.
"""

from .detector import RegimeDetector, global_regime_detector

__all__ = ["RegimeDetector", "global_regime_detector"]
