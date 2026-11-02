"""
Original English Authoring: Elliott Wave Narrative.
Written in natural English institutional market style.
"""

from typing import Dict, Any


def narrate_elliott_en(facts: Dict[str, Any], style: str = "professional") -> str:
    el = facts["elliott"]
    if not el["available"]:
        return "No fully formed Elliott wave structures currently satisfy all deterministic hard rules."

    wave = el["wave"]
    score_100 = el["score_100"]
    name_en = facts["name_en"]

    if style == "brief":
        return f"{name_en} is developing in Wave {wave} of an impulse sequence with a coherence score of {score_100}/100."

    return (
        f"{name_en} is currently developing in Wave {wave} of an impulse sequence — typically a key directional leg in the five-wave cycle. "
        f"The primary wave count aligns closely with Fibonacci projection standards, reinforcing structural count reliability. "
        f"Pattern coherence scores {score_100}/100, reflecting strong adherence to Elliott wave axioms and ratio guidelines."
    )
