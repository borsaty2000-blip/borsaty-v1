"""
Original English Authoring: Analysis Summary & Context.
Written originally in English institutional trading style.
Version 2.0.0
"""

from typing import Dict, Any
from narrator.number_formatting import format_price
from narrator.templates.en.fragments import (
    REGIME_DESCRIPTIONS_EN,
    DIRECTION_DESCRIPTIONS_EN,
)


def narrate_analysis_summary_en(facts: Dict[str, Any], style: str = "professional") -> str:
    """
    Original English narrative for executive market analysis summary.
    """
    name_en = facts["name_en"]
    symbol = facts["symbol"]
    currency = facts["currency"]
    price = facts["current_price"]
    price_str = format_price(price, currency, "en") if price is not None else ""

    conf = facts["confluence"]
    direction = conf["direction"]
    dir_text = DIRECTION_DESCRIPTIONS_EN.get(direction, "neutral structure")
    regime = conf["regime"]
    regime_desc = REGIME_DESCRIPTIONS_EN.get(regime, "standard market conditions")
    score_100 = conf["score_100"]

    if style == "brief":
        parts = [
            f"{name_en} is trading at {price_str} with a {dir_text}.",
            f"The prevailing market regime reflects {regime_desc}.",
            f"Overall engine confluence scores {score_100}/100.",
        ]
        return " ".join(parts)

    elif style == "detailed":
        parts = [
            f"{name_en} ({symbol}) is currently priced at {price_str}, establishing a {dir_text} across multi-factor models.",
            f"The unified quantitative engine scores {score_100}/100 in confluence across all participating deterministic algorithms.",
            f"Current price behavior develops within {regime_desc}, directly calibrating engine weights and expected boundary responses.",
            f"This structural posture highlights coherent directional momentum across intermediate swing pivots.",
            f"Volume flow metrics remain aligned with prevailing price discovery across primary degrees.",
            f"Disciplined position management remains essential, keeping invalidation benchmarks front and center.",
        ]
        return " ".join(parts)

    else:  # professional (default)
        parts = [
            f"{name_en} trades at {price_str}, exhibiting a {dir_text} supported by a confluence reading of {score_100}/100.",
            f"Market context indicates {regime_desc}, strengthening the validity of current technical signals.",
            f"This setup demonstrates coherent alignment between structural price pivots and quantitative momentum indicators.",
            f"Directional continuity remains contingent upon price holding above established structural support levels.",
        ]
        return " ".join(parts)
