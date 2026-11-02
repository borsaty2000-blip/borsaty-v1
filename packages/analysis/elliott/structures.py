"""
Elliott Wave Structures and Rule Library.
Pure deterministic mathematical definitions of wave patterns.
Version 1.0.0
"""

import math
from typing import Optional, Tuple, List, Dict, Any, Union

# Comprehensive Pattern Definitions
PATTERNS = {
    "impulse": {
        "waves": 5,
        "alternating": True,
        "hard_rules": [
            "wave2_retracement < 1.0",
            "wave3_not_shortest",
            "wave4_no_overlap_wave1",
            "wave1_and_wave3_and_wave5_trending",
        ],
        "soft_rules": [
            "wave3_extension_ratio BETWEEN 1.5 AND 3.0",
            "wave2_retracement BETWEEN 0.45 AND 0.65",
            "wave4_retracement BETWEEN 0.20 AND 0.50",
            "wave5_extension_ratio BETWEEN 0.5 AND 1.5",
        ],
        "subtypes": [
            "regular",
            "extended_third",
            "extended_fifth",
            "ending_diagonal",
            "leading_diagonal"
        ],
    },
    "zigzag": {
        "waves": 3,
        "substructure": "5-3-5",
        "hard_rules": [
            "waveB_retracement < 1.0",
            "waveC_extends_beyond_A",
        ],
        "soft_rules": [
            "waveB_retracement BETWEEN 0.38 AND 0.79",
            "waveC_equals_A_or_1.618_A",
        ],
        "subtypes": ["regular", "extended_c"],
    },
    "flat": {
        "waves": 3,
        "substructure": "3-3-5",
        "hard_rules": [
            "waveB_retraces_at_least_90pct_A",
            "waveC_terminates_near_A_start",
        ],
        "soft_rules": [
            "waveB_retracement BETWEEN 0.90 AND 1.05",
        ],
        "subtypes": ["regular_flat", "expanded_flat", "running_flat"],
    },
    "triangle": {
        "waves": 5,
        "substructure": "3-3-3-3-3",
        "hard_rules": [
            "each_wave_contracts_or_expands_consistently",
            "waveE_inside_waveA_range",
        ],
        "soft_rules": [
            "wave_alternation_score",
        ],
        "subtypes": [
            "contracting",
            "expanding",
            "ascending",
            "descending",
            "symmetrical"
        ],
    },
}

def clamp(val: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, val))

def score_range(val: float, min_val: float, max_val: float, ideal: float, tolerance: float = 0.25) -> float:
    """Scores a measured ratio against an expected range with smooth Gaussian decay outside."""
    if min_val <= val <= max_val:
        # Distance from ideal normalized
        dist = abs(val - ideal)
        span = max(0.0001, (max_val - min_val) / 2.0)
        return clamp(1.0 - 0.2 * (dist / span))
    else:
        # Falloff outside range
        edge = min_val if val < min_val else max_val
        diff = abs(val - edge)
        decay = math.exp(-0.5 * (diff / max(0.05, tolerance)) ** 2)
        return clamp(0.79 * decay)

def geometric_mean(scores: List[float]) -> float:
    """Calculates geometric mean of score list [0.0 - 1.0]."""
    if not scores:
        return 0.0
    prod = 1.0
    for s in scores:
        prod *= max(0.0001, s)
    return round(clamp(prod ** (1.0 / len(scores))), 4)
