"""
Original Arabic Authoring: Analysis Summary & Context.
Written originally in Arabic financial rhetoric.
Version 2.0.0
"""

from typing import Optional, Tuple, List, Dict, Any, Union
from narrator.number_formatting import format_price
from narrator.templates.ar.fragments import (
    REGIME_DESCRIPTIONS_AR,
    DIRECTION_DESCRIPTIONS_AR,
)


def narrate_analysis_summary_ar(facts: Dict[str, Any], style: str = "professional") -> str:
    """
    Original Arabic narrative for executive market analysis summary.
    """
    name_ar = facts["name_ar"]
    symbol = facts["symbol"]
    currency = facts["currency"]
    price = facts["current_price"]
    price_str = format_price(price, currency, "ar") if price is not None else ""

    conf = facts["confluence"]
    direction = conf["direction"]
    dir_text = DIRECTION_DESCRIPTIONS_AR.get(direction, "مسار متوازن")
    regime = conf["regime"]
    regime_desc = REGIME_DESCRIPTIONS_AR.get(regime, "حالة سوق اعتيادية")
    score_100 = conf["score_100"]

    if style == "brief":
        parts = [
            f"{name_ar} يتداول حالياً عند {price_str} في إطار {dir_text}.",
            f"بيئة السوق تظهر {regime_desc}.",
            f"درجة التوافق الإجمالية تبلغ {score_100} من 100.",
        ]
        return " ".join(parts)

    elif style == "detailed":
        parts = [
            f"يتحرك سهم {name_ar} ({symbol}) حالياً عند مستوى {price_str}، مسجلاً {dir_text} وفق محرك التوافق التحليلي.",
            f"تعكس القراءة الفنية درجة توافق قدرها {score_100} من 100 بين المحركات الحتمية المعتمدة.",
            f"تتزامن هذه الحركة مع بيئة سوق تتسم بـ {regime_desc}، وهو ما يحدد أوزان الأدلة الرقمية واستجابة الأسعار للمستويات الفنية.",
            f"بناءً على هذا البناء الهيكلي، يُظهر الأصل المالي توافقاً اتجاهياً يتطلب متابعة مناطق الدعم والمقاومة بدقة.",
            f"تُشير القراءات الإجمالية إلى استقرار نسبي في مسار الزخم اللحظي مقارنة بالاتجاه العام السائد.",
            f"يُنصح دائماً بربط هذا التقييم الفني بإدارة المخاطر الصارمة والالتزام بنقاط الإلغاء المحددة.",
        ]
        return " ".join(parts)

    else:  # professional (default)
        parts = [
            f"سهم {name_ar} يتحرك حالياً عند {price_str} في إطار {dir_text}، مستنداً إلى درجة توافق تبلغ {score_100} من 100.",
            f"بيئة التداول السائدة تعكس {regime_desc}، مما يعزز مصداقية الإشارات الفنية الحالية.",
            f"بناءً على هذا البناء، تتوافق الأدلة المشتقة بين هيكل السوق والمؤشرات الاتجاهية لتأكيد المسار العام.",
            f"يظل استمرار هذا التوجه مشروطاً بعدم كسر مستويات الدعم الهيكلية ومراعاة إدارة رأس المال.",
        ]
        return " ".join(parts)
