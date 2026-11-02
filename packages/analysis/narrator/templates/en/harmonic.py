"""
Original English Authoring: Harmonic Patterns Narrative.
"""

from typing import Dict, Any
from narrator.templates.en.fragments import HARMONIC_NAMES_EN


def narrate_harmonic_en(facts: Dict[str, Any], style: str = "professional") -> str:
    h = facts["harmonic"]
    if not h["available"]:
        return "No active harmonic patterns currently meet Fibonacci ratio tolerance boundaries."

    pat_key = h["pattern"]
    pat_name = HARMONIC_NAMES_EN.get(pat_key, str(pat_key).title())
    score_100 = h["score_100"]
    direction_en = "Bullish" if h.get("type") == "bullish" else "Bearish"

    if style == "brief":
        return f"Confirmed {direction_en} {pat_name} pattern identified with a quality score of {score_100}/100."

    return (
        f"A confirmed {direction_en} {pat_name} harmonic setup is validated within its Potential Reversal Zone (PRZ). "
        f"All XABCD pivot ratios strictly respect Fibonacci convergence parameters, earning a structural score of {score_100}/100."
    )
