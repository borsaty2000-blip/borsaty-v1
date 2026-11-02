"""
Harmonic Pattern Definitions and Fibonacci Ratio Scoring.
Pure deterministic. Zero tolerance for unverified ratios.
Version 1.0.0
"""

from typing import Optional, Tuple, List, Dict, Any, Union
import math


HARMONIC_PATTERNS: Dict[str, Dict[str, Any]] = {
    "gartley": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.618, "tolerance": 0.05},
            "C_vs_AB": {"ideal": 0.618, "tolerance": 0.06},
            "D_vs_XA": {"ideal": 0.786, "tolerance": 0.03},
            "CD_vs_BC": {"ideal": 1.272, "tolerance": 0.20, "alt_ideals": [1.414, 1.44, 1.618]},
        },
        "prz_projections": ["0.786*XA", "1.272*BC", "1.618*CD"],
        "specificity": 2,
    },
    "bat": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.44, "tolerance": 0.06},   # 0.382-0.50
            "C_vs_AB": {"ideal": 0.618, "tolerance": 0.15},
            "D_vs_XA": {"ideal": 0.886, "tolerance": 0.03},
            "CD_vs_BC": {"ideal": 1.85, "tolerance": 0.25, "alt_ideals": [1.618, 2.0, 2.24, 2.618]},
        },
        "prz_projections": ["0.886*XA", "2.618*BC"],
        "specificity": 3,
    },
    "butterfly": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.786, "tolerance": 0.03},
            "C_vs_AB": {"ideal": 0.618, "tolerance": 0.15},
            "D_vs_XA": {"ideal": 1.27, "tolerance": 0.10, "alt_ideals": [1.618]},   # 1.27 or 1.618
            "CD_vs_BC": {"ideal": 1.618, "tolerance": 0.20, "alt_ideals": [2.0, 2.24, 2.618]},
        },
        "prz_projections": ["1.27*XA", "1.618*XA", "2.24*BC"],
        "note": "D extends BEYOND X — key distinguishing feature",
        "specificity": 4,
    },
    "crab": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.50, "tolerance": 0.12, "alt_ideals": [0.382, 0.618]},
            "C_vs_AB": {"ideal": 0.618, "tolerance": 0.15, "alt_ideals": [0.382, 0.886]},
            "D_vs_XA": {"ideal": 1.618, "tolerance": 0.08},
            "CD_vs_BC": {"ideal": 2.618, "tolerance": 0.30, "alt_ideals": [3.14, 3.618, 4.236]},
        },
        "prz_projections": ["1.618*XA", "2.618*XA", "3.618*BC"],
        "note": "D extends FAR beyond X — most extreme reversal",
        "specificity": 5,
    },
    "deep_crab": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.886, "tolerance": 0.05},
            "C_vs_AB": {"ideal": 0.618, "tolerance": 0.15},
            "D_vs_XA": {"ideal": 2.618, "tolerance": 0.15, "alt_ideals": [1.618]},
            "CD_vs_BC": {"ideal": 2.618, "tolerance": 0.40, "alt_ideals": [3.14, 3.618, 4.236]},
        },
        "prz_projections": ["2.618*XA", "3.618*BC"],
        "specificity": 6,
    },
    "shark": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 1.27, "tolerance": 0.15, "alt_ideals": [1.13, 1.618]},
            "C_vs_AB": {"ideal": 1.618, "tolerance": 0.20, "alt_ideals": [2.0, 2.24]},
            "D_vs_XA": {"ideal": 0.886, "tolerance": 0.05, "alt_ideals": [1.13]},
        },
        "prz_projections": ["1.13*XA", "0.886*XC"],
        "note": "B extends beyond X — 'shark fin' shape",
        "specificity": 4,
    },
    "cypher": {
        "type": "reversal",
        "direction": "any",
        "ratios": {
            "B_vs_XA": {"ideal": 0.50, "tolerance": 0.10, "alt_ideals": [0.382, 0.618]},
            "C_vs_AB": {"ideal": 1.13, "tolerance": 0.15, "alt_ideals": [1.27, 1.414]},
            "D_vs_XC": {"ideal": 0.786, "tolerance": 0.05},
        },
        "prz_projections": ["0.786*XC"],
        "note": "D measured from X, not A — unique",
        "specificity": 4,
    },
    "abcd": {
        "type": "continuation",
        "direction": "any",
        "ratios": {
            "CD_vs_BC": {"ideal": 1.27, "tolerance": 0.15, "alt_ideals": [1.618]},
            "AD_vs_AB": {"ideal": 0.786, "tolerance": 0.10, "alt_ideals": [1.0, 1.27]},
        },
        "prz_projections": ["1.27*BC"],
        "specificity": 1,
    },
}


def score_ratio(
    measured: float,
    ideal: float,
    tolerance: float,
    alt_ideals: Optional[List[float]] = None,
) -> Tuple[bool, float, str]:
    """
    Scores a measured Fibonacci ratio against its ideal target within tolerance.
    - If min(|measured - target|) > tolerance: (False, 0.0, rejection_reason)
    - If min(|measured - target|) <= tolerance: (True, score in [0.5, 1.0], "")
      where score = 1.0 - 0.5 * (|diff| / tolerance)
    """
    targets = [ideal] + (alt_ideals or [])
    diff = min(abs(measured - t) for t in targets)

    if diff > tolerance + 1e-9:
        excess = diff - tolerance
        return False, 0.0, f"exceeds tolerance {tolerance:.3f} (ideal {ideal:.3f}) by {excess:.3f}"

    score = 1.0 - 0.5 * (diff / max(1e-9, tolerance))
    return True, round(max(0.5, min(1.0, score)), 4), ""


def geometric_mean(scores: List[float]) -> float:
    """Computes the geometric mean of ratio scores."""
    if not scores:
        return 0.0
    valid = [max(0.0001, s) for s in scores]
    prod = math.prod(valid)
    return round(math.pow(prod, 1.0 / len(valid)), 4)
