"""
Original English Authoring: Unified Trade Plan & Risk Management Narrative.
"""

from typing import Dict, Any
from narrator.number_formatting import format_price


def narrate_trade_plan_en(facts: Dict[str, Any], style: str = "professional") -> str:
    tp = facts["trade_plan"]
    status = tp.get("status")
    currency = facts["currency"]

    if status != "actionable":
        return "No actionable trading setup is currently qualified under strict risk-to-reward parameters."

    entry = tp.get("entry_zone", {})
    entry_low = format_price(entry.get("low", 0), currency, "en") if "low" in entry else ""
    entry_high = format_price(entry.get("high", 0), currency, "en") if "high" in entry else ""

    stop_data = tp.get("stop_loss", {})
    stop_price = format_price(stop_data.get("price", 0), currency, "en") if "price" in stop_data else ""
    stop_reason = stop_data.get("primary_reason", "structural invalidation")

    targets = tp.get("targets", [])
    target_strs = []
    for t in targets:
        p_str = format_price(t.get("price", 0), currency, "en")
        target_strs.append(f"T{t.get('rank', 1)} at {p_str}")
    targets_formatted = ", ".join(target_strs) if target_strs else "None defined"

    rr = tp.get("risk_reward", {})
    blended_rr = rr.get("blended_rr") or rr.get("primary_rr", 0.0)

    if style == "brief":
        return f"Trade Plan: Entry between {entry_low} and {entry_high}, stop loss at {stop_price}, targets: {targets_formatted}, blended RR: {blended_rr}."

    return (
        f"The unified plan establishes an execution entry zone between {entry_low} and {entry_high}. "
        f"The primary stop loss is anchored at {stop_price} ({stop_reason}). "
        f"Consensus profit targets are mapped as: {targets_formatted}. "
        f"This setup delivers a blended risk-reward ratio of {blended_rr}, securing structural asymmetry across projected milestones."
    )
