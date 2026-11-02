"""
Classical Chart Pattern Detection Engine (Borsaty).
5-Gate Deterministic Pattern Recognition: Shape, Volume, Time, Breakout, Retest.
"""

from .structures import CLASSICAL_PATTERNS
from .validators import VolumeValidator, BreakoutValidator, global_volume_validator, global_breakout_validator
from .detector import ClassicalPatternDetector, global_classical_detector

__all__ = [
    "CLASSICAL_PATTERNS",
    "VolumeValidator",
    "BreakoutValidator",
    "global_volume_validator",
    "global_breakout_validator",
    "ClassicalPatternDetector",
    "global_classical_detector",
]
