"""
Original Arabic Authoring: Elliott Wave Narrative.
Written in natural Arabic financial idiom without translation.
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from narrator.number_formatting import format_wave_ar


def narrate_elliott_ar(facts: Dict[str, Any], style: str = "professional") -> str:
    el = facts["elliott"]
    if not el["available"]:
        return "لا تتوافر حالياً هياكل موجية مكتملة تستوفي القواعد الحتمية الصارمة لموجات إليوت."

    wave = format_wave_ar(el["wave"])
    score_100 = el["score_100"]
    name_ar = facts["name_ar"]

    if style == "brief":
        return f"{name_ar} يتحرك في الموجة الدافعة {wave}، بدرجة توافق نمط تبلغ {score_100} من 100."

    return (
        f"{name_ar} يتحرك حالياً في الموجة الدافعة {wave}، وهي مرحلة اتجاهية رئيسية في البناء الموجي الخماسي. "
        f"يُظهر العدّ الموجي الحالي توافقاً وثيقاً مع نسب فيبوناتشي الامتدادية، ما يعزز المصداقية للمسار الهيكلي. "
        f"درجة توافق النمط تسجل {score_100} من 100، وهي قراءة نوعية تعكس انضباطاً كاملاً مع القواعد الصارمة لإليوت."
    )
