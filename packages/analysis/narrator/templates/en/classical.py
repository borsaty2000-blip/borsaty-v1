"""
Original English Authoring: Classical Chart Patterns Narrative.
"""

from typing import Dict, Any
from narrator.templates.en.fragments import CLASSICAL_NAMES_EN


def narrate_classical_en(facts: Dict[str, Any], style: str = "professional") -> str:
    cl = facts["classical"]
    if not cl["available"]:
        return "No classical chart patterns currently fulfill the 5-gate geometric and volume validation pipeline."

    pat_key = cl["pattern"]
    pat_name = CLASSICAL_NAMES_EN.get(pat_key, str(pat_key).title())
    score_100 = cl["score_100"]

    if style == "brief":
        return f"Confirmed {pat_name} pattern verified with a structural score of {score_100}/100."

    return (
        f"The classical engine confirms a {pat_name} formation following rigorous 5-gate validation, "
        f"including formative volume contraction and confirmed candle body close rather than intraday wicks. "
        f"This chart formation commands a reliability score of {score_100}/100."
    )
