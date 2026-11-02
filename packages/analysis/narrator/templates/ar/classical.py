"""
Original Arabic Authoring: Classical Chart Patterns Narrative.
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from narrator.templates.ar.fragments import CLASSICAL_NAMES_AR


def narrate_classical_ar(facts: Dict[str, Any], style: str = "professional") -> str:
    cl = facts["classical"]
    if not cl["available"]:
        return "لا تظهر نماذج فنية كلاسيكية مكتملة مستوفية لبوابات الفحص الحجمية والهندسية الخمس."

    pat_key = cl["pattern"]
    pat_name = CLASSICAL_NAMES_AR.get(pat_key, str(pat_key).title())
    score_100 = cl["score_100"]

    if style == "brief":
        return f"نموذج {pat_name} مكتمل ومؤكد بنجاح بدرجة {score_100} من 100."

    return (
        f"أكد المحرك الكلاسيكي اكتمال نموذج {pat_name} بعد استيفائه بوابات التحقق الخمس الصارمة، بما يشمل انكماش الحجم أثناء التكوين وتأكيد الإغلاق الصريح دون الاعتماد على ذيول الشموع. "
        f"يحظى هذا التكوين الفني بدرجة ثقة تصل إلى {score_100} من 100."
    )
