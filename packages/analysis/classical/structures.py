"""
Classical Pattern Definitions and Specifications.
Deterministic structural rules, logic gates, time constraints, and projection targets.
"""

from typing import Dict, Any, List


CLASSICAL_PATTERNS: Dict[str, Dict[str, Any]] = {
    "head_and_shoulders": {
        "name_ar": "الرأس والكتفان",
        "name_en": "Head and Shoulders",
        "type": "reversal",
        "direction": "bearish",
        "shape_rules": [
            "3_peaks_identified",
            "head_higher_than_both",
            "shoulders_near_equal",
            "neckline_defined",
        ],
        "logic_rules": [
            "volume_head > volume_LS",
            "volume_RS < volume_head",
            "breakout_volume_ratio > 1.3",
            "confirmed_close_below",
            "retest_after_breakout",
        ],
        "time_rules": [
            "duration_between_shoulders >= 20 bars",
            "symmetry_score >= 0.6",
        ],
        "confirmation": "close below neckline",
        "invalidation": "close back above neckline",
        "breakout_volume_threshold": 1.3,
        "shoulder_tolerance": 0.10,
        "min_shoulder_duration": 20,
        "min_symmetry_score": 0.60,
    },
    "inverse_head_and_shoulders": {
        "name_ar": "الرأس والكتفان المعكوس",
        "name_en": "Inverse Head and Shoulders",
        "type": "reversal",
        "direction": "bullish",
        "shape_rules": [
            "3_troughs_identified",
            "head_lower_than_both",
            "shoulders_near_equal",
            "neckline_defined",
        ],
        "logic_rules": [
            "volume_head > volume_LS",
            "volume_RS < volume_head",
            "breakout_volume_ratio > 1.3",
            "confirmed_close_above",
            "retest_after_breakout",
        ],
        "time_rules": [
            "duration_between_shoulders >= 20 bars",
            "symmetry_score >= 0.6",
        ],
        "confirmation": "close above neckline",
        "invalidation": "close back below neckline",
        "breakout_volume_threshold": 1.3,
        "shoulder_tolerance": 0.10,
        "min_shoulder_duration": 20,
        "min_symmetry_score": 0.60,
    },
    "double_top": {
        "name_ar": "القمة المزدوجة",
        "name_en": "Double Top",
        "type": "reversal",
        "direction": "bearish",
        "shape_rules": [
            "2_peaks_identified",
            "peaks_within_3pct",
            "valley_between",
            "valley_decline_min_3pct",
        ],
        "logic_rules": [
            "volume_peak2 <= volume_peak1",
            "volume_at_valley_low",
            "breakout_below_valley",
            "breakout_volume_ratio > 1.2",
        ],
        "time_rules": [
            "peaks_within_30_bars",
            "valley_duration >= 5 bars",
        ],
        "confirmation": "close below valley low",
        "invalidation": "close back above peak",
        "breakout_volume_threshold": 1.2,
        "peak_tolerance": 0.03,
        "min_valley_decline": 0.03,
        "max_peak_spacing": 30,
        "min_valley_duration": 5,
    },
    "double_bottom": {
        "name_ar": "القاع المزدوج",
        "name_en": "Double Bottom",
        "type": "reversal",
        "direction": "bullish",
        "shape_rules": [
            "2_troughs_identified",
            "troughs_within_3pct",
            "peak_between",
            "peak_rally_min_3pct",
        ],
        "logic_rules": [
            "volume_trough2 <= volume_trough1",
            "breakout_above_peak",
            "breakout_volume_ratio > 1.2",
        ],
        "time_rules": [
            "troughs_within_30_bars",
            "peak_duration >= 5 bars",
        ],
        "confirmation": "close above peak high",
        "invalidation": "close back below trough",
        "breakout_volume_threshold": 1.2,
        "trough_tolerance": 0.03,
        "min_peak_rally": 0.03,
        "max_trough_spacing": 30,
        "min_peak_duration": 5,
    },
}
