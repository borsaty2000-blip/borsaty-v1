"""
Original Arabic Authoring: Harmonic Patterns Narrative.
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from narrator.templates.ar.fragments import HARMONIC_NAMES_AR


def narrate_harmonic_ar(facts: Dict[str, Any], style: str = "professional") -> str:
    h = facts["harmonic"]
    if not h["available"]:
        return "لا توجد نماذج هارمونيك نشطة تطابق نسب فيبوناتشي المحددة ضمن حدود التفاوت المقبولة."

    pat_key = h["pattern"]
    pat_name = HARMONIC_NAMES_AR.get(pat_key, str(pat_key).title())
    score_100 = h["score_100"]
    direction_ar = "صاعد" if h.get("type") == "bullish" else "هابط"

    if style == "brief":
        return f"نموذج {pat_name} {direction_ar} مؤكد، بدرجة تطابق {score_100} من 100."

    return (
        f"تم رصد نموذج {pat_name} {direction_ar} مؤكد رياضياً، محققاً استقراراً كاملاً داخل منطقة الانعكاس المحتملة (PRZ). "
        f"تتوافق أبعاد النموذج ونسب ارتداد النقاط بدقة مع معايير فيبوناتشي الصارمة، محققة درجة جودة قدرها {score_100} من 100."
    )
