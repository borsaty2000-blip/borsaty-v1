"""
Original Arabic Authoring: Unified Trade Plan & Risk Management Narrative.
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from narrator.number_formatting import format_price


def narrate_trade_plan_ar(facts: Dict[str, Any], style: str = "professional") -> str:
    tp = facts["trade_plan"]
    status = tp.get("status")
    currency = facts["currency"]

    if status != "actionable":
        return "لا تتوافر حالياً فرصة تداول مكتملة الشروط الفنية ومعايير العائد إلى المخاطرة الصارمة."

    entry = tp.get("entry_zone", {})
    entry_low = format_price(entry.get("low", 0), currency, "ar") if "low" in entry else ""
    entry_high = format_price(entry.get("high", 0), currency, "ar") if "high" in entry else ""

    stop_data = tp.get("stop_loss", {})
    stop_price = format_price(stop_data.get("price", 0), currency, "ar") if "price" in stop_data else ""
    stop_reason = stop_data.get("primary_reason", "مستوى إلغاء فني")

    targets = tp.get("targets", [])
    target_strs = []
    for t in targets:
        p_str = format_price(t.get("price", 0), currency, "ar")
        target_strs.append(f"{t.get('rank', 1)}: {p_str}")
    targets_formatted = "، ".join(target_strs) if target_strs else "غير محددة"

    rr = tp.get("risk_reward", {})
    blended_rr = rr.get("blended_rr") or rr.get("primary_rr", 0.0)

    if style == "brief":
        return f"خطة التداول: الدخول بين {entry_low} و {entry_high}، وقف الخسارة عند {stop_price}، الأهداف: {targets_formatted}، نسبة العائد للمخاطرة {blended_rr}."

    return (
        f"بناءً على التوافق المشترك، تتحدد منطقة الدخول الفنية بين {entry_low} و {entry_high}. "
        f"يستقر وقف الخسارة عند مستوى {stop_price} ارتكازاً على {stop_reason}. "
        f"تتوزع الأهداف السعرية التوافقية وفق الترتيب: {targets_formatted}، "
        f"بنسبة عائد إلى مخاطرة إجمالية تبلغ {blended_rr}، مما يوفر توازناً استثمارياً مشروطاً باحترام مستويات الوقف."
    )
