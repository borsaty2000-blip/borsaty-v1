import re
import os
import json
from typing import Dict, Any, Tuple
from .dsl import ScreenQuery, Condition, ALLOWLIST_FIELDS, ALLOWLIST_OPERATORS

class ScreenerNLU:
    """
    Arabic Natural Language Understanding Layer for Financial Screener.
    Converts Arabic user requests into strictly validated DSL ScreenQuery objects.
    """

    ADVERSARIAL_PATTERNS = [
        r"drop\s+table",
        r"delete\s+from",
        r"insert\s+into",
        r"update\s+\w+\s+set",
        r"union\s+select",
        r"truncate\s+table",
        r"exec\s*\(",
        r"execute\s*\(",
        r"--",
        r";\s*$",
        r"ignore\s+(previous|all)\s+instructions",
        r"system\s*prompt",
        r"reveal\s+secret",
        r"bypass\s+security",
    ]

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")

    def check_adversarial(self, query_ar: str) -> None:
        low = query_ar.lower().strip()
        for pat in self.ADVERSARIAL_PATTERNS:
            if re.search(pat, low, re.IGNORECASE):
                raise ValueError("تم رفض الطلب: الاستعلام يحتوي على كلمات أو أوامر غير مسموح بها أمنياً")

    def parse(self, query_ar: str) -> Tuple[ScreenQuery, str]:
        if not query_ar or not query_ar.strip():
            raise ValueError("يرجى كتابة استعلام بحث لتصفية الأسهم")

        clean_query = query_ar.strip()
        self.check_adversarial(clean_query)

        # 1. Deterministic Rule & Idiom Parser (Accurate, Instantaneous, Zero-latency)
        dsl_dict, explanation = self._parse_deterministic(clean_query)

        # 2. Validate against DSL schema (Allowlist enforcement)
        try:
            screen_query = ScreenQuery(**dsl_dict)
        except Exception as e:
            raise ValueError(f"تعذر بناء مصفاة الأسهم: {str(e)}")

        return screen_query, explanation

    def _parse_deterministic(self, q: str) -> Tuple[Dict[str, Any], str]:
        # Normalize Arabic characters and lowercase for universal case-insensitivity
        q_norm = q.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي").lower()
        q_lower = q_norm

        universe = "ALL"
        asset_class = None
        sector = None
        conditions = []
        explanation_parts = []

        # 1. Asset Class detection (Check CRYPTO first to avoid collision with 'عملات' in FOREX)
        if any(w in q_norm for w in ["كريبتو", "عملات رقميه", "عملات مشفره", "مشفرة", "crypto", "بيتكوين"]):
            asset_class = "CRYPTO"
            explanation_parts.append("فئة العملات المشفرة (Crypto)")
        elif any(w in q_norm for w in ["فوركس", "عملات اجنبيه", "forex", "ازواج العملات"]):
            asset_class = "FOREX"
            explanation_parts.append("أزواج العملات (Forex)")
        elif any(w in q_norm for w in ["سلع", "نفط", "ذهب", "معادن"]):
            asset_class = "COMMODITY"
            explanation_parts.append("السلع والمعادن")

        # 2. Universe detection (Use word boundaries for 'مصر' to avoid false match on 'مصرف' / 'مصرفي')
        if any(w in q_norm for w in ["سعوديه", "تاسي", "السعوديه", "tasi"]):
            universe = "TASI"
            explanation_parts.append("الأسهم السعودية (TASI)")
        elif any(w in q_norm for w in ["دبي", "سوق دبي", "dfm"]):
            universe = "DFM"
            explanation_parts.append("سوق دبي (DFM)")
        elif any(w in q_norm for w in ["ابوظبي", "سوق ابوظبي", "adx"]):
            universe = "ADX"
            explanation_parts.append("سوق أبوظبي (ADX)")
        elif any(w in q_norm for w in ["قطر", "بورصه قطر", "qe"]):
            universe = "QE"
            explanation_parts.append("بورصة قطر (QE)")
        elif any(w in q_norm for w in ["كويت", "بورصه الكويت", "kw"]):
            universe = "KW"
            explanation_parts.append("بورصة الكويت (KW)")
        elif any(w in q_norm for w in ["امريكيه", "امريكا", "وول ستريت", "ناسداك"]) or re.search(r"\bus\b", q_lower):
            universe = "US"
            explanation_parts.append("الأسهم الأمريكية (US)")
        elif any(w in q_norm for w in ["مصريه", "البورصه المصريه", "ايجي اكس", "egx"]) or re.search(r"\bمصر\b", q_norm):
            universe = "EGX"
            explanation_parts.append("الأسهم المصرية (EGX)")

        # 3. Sector detection
        if any(w in q_norm for w in ["بنوك", "البنوك", "المصارف", "بنكي", "البنكي", "مصرفي", "المصرفي"]):
            sector = "بنوك"
            explanation_parts.append("قطاع البنوك")
        elif any(w in q_norm for w in ["عقارات", "العقارات", "عقاري", "العقاري", "عقار", "العقار"]):
            sector = "عقارات"
            explanation_parts.append("قطاع العقارات")
        elif any(w in q_norm for w in ["تكنولوجيا", "تقنيه", "اتصالات"]):
            sector = "تكنولوجيا"
            explanation_parts.append("قطاع التكنولوجيا والاتصالات")
        elif any(w in q_norm for w in ["طاقه", "نفط", "غاز", "بترول"]):
            sector = "طاقة"
            explanation_parts.append("قطاع الطاقة")

        # 4. Condition: Idiom "فوق 200" or "فوق 200 يوم" / "أعلى من متوسط 200" / "اعلى من SMA200"
        if re.search(r"(فوق|اعلي من|تجاوز|اكبر من)\s*(200\s*يوم|200|متوسط\s*200|sma\s*200|sma200)", q_norm):
            conditions.append({
                "field": "close",
                "operator": ">",
                "value": "SMA_200"
            })
            explanation_parts.append("السعر فوق متوسط 200 يوم (close > SMA_200)")

        # 5. Condition: Idiom "تحت 50" or "أقل من متوسط 50" / "دون متوسط 50"
        if re.search(r"(تحت|اقل من|ادني من|دون)\s*(50\s*يوم|50|متوسط\s*50|sma\s*50|sma50)", q_norm):
            conditions.append({
                "field": "close",
                "operator": "<",
                "value": "SMA_50"
            })
            explanation_parts.append("السعر تحت متوسط 50 يوم (close < SMA_50)")

        # 6. Condition: RSI under threshold (default 30 or custom number or oversold idiom)
        if re.search(r"(?:بـ\s*)?(rsi|ار اس اي|القوه النسبيه|مؤشر القوه)\s*(تحت|اقل من|<|ادني من|دون)\s*(\d+)", q_norm):
            m = re.search(r"(?:بـ\s*)?(rsi|ار اس اي|القوه النسبيه|مؤشر القوه)\s*(تحت|اقل من|<|ادني من|دون)\s*(\d+)", q_norm)
            val = float(m.group(2)) if m.group(2).isdigit() else float(m.group(3))
            conditions.append({
                "field": "RSI_14",
                "operator": "<",
                "value": val
            })
            explanation_parts.append(f"مؤشر القوة النسبية تحت {val} (RSI_14 < {val})")
        elif any(w in q_norm for w in ["تشبع بيعي", "تشبع بيع"]) or re.search(r"(?:بـ\s*)?(rsi|ار اس اي)\s*(<|تحت|اقل من|دون)\s*30", q_norm) or re.search(r"\brsi\s*<\s*30\b", q_lower):
            conditions.append({
                "field": "RSI_14",
                "operator": "<",
                "value": 30.0
            })
            explanation_parts.append("RSI_14 < 30 (منطقة تشبع بيعي)")
        elif re.search(r"\b(تحت|دون|اقل من)\s*30\b", q_norm) and not any(w in q_norm for w in ["سعر", "سهم"]):
            conditions.append({
                "field": "RSI_14",
                "operator": "<",
                "value": 30.0
            })
            explanation_parts.append("RSI_14 < 30 (منطقة تشبع بيعي)")

        # 7. Condition: RSI above threshold (overbought)
        if re.search(r"(?:بـ\s*)?(rsi|ار اس اي|القوه النسبيه|مؤشر القوه)\s*(فوق|اعلي من|>|اكبر من)\s*(\d+)", q_norm):
            m = re.search(r"(?:بـ\s*)?(rsi|ار اس اي|القوه النسبيه|مؤشر القوه)\s*(فوق|اعلي من|>|اكبر من)\s*(\d+)", q_norm)
            val = float(m.group(3))
            conditions.append({
                "field": "RSI_14",
                "operator": ">",
                "value": val
            })
            explanation_parts.append(f"مؤشر القوة النسبية فوق {val} (RSI_14 > {val})")
        elif any(w in q_norm for w in ["تشبع شرائي", "تشبع شراء"]):
            conditions.append({
                "field": "RSI_14",
                "operator": ">",
                "value": 70.0
            })
            explanation_parts.append("RSI_14 > 70 (منطقة تشبع شرائي)")

        # 8. Condition: High volume (volume_ratio_20d > 1.5)
        if any(phrase in q_norm for phrase in [
            "حجم عالي", "حجم تداول مرتفع", "سيوله عاليه", "سيوله غير عاديه",
            "احجام تداول قويه", "حجم تداول عالي", "حجم تداول غير عادي", "فوليوم عالي",
            "فوليوم مرتفع"
        ]) or re.search(r"volume\s*(مرتفع|عالي|قوي)", q_lower):
            conditions.append({
                "field": "volume_ratio_20d",
                "operator": ">",
                "value": 1.5
            })
            explanation_parts.append("حجم تداول أعلى من المتوسط بـ 50% (volume_ratio_20d > 1.5)")

        # 9. Condition: Supertrend Bullish
        if any(w in q_norm for w in ["سوبر ترند", "سوبرترند", "سوبر تريند", "سوبرتريند", "supertrend"]):
            conditions.append({
                "field": "Supertrend",
                "operator": "=",
                "value": "BULLISH"
            })
            explanation_parts.append("مؤشر سوبر ترند في مسار صاعد (Supertrend = BULLISH)")

        # 10. Condition: MACD Histogram positive
        if any(w in q_norm for w in ["ماكدي", "ماكد", "macd"]):
            conditions.append({
                "field": "MACD_hist",
                "operator": ">",
                "value": 0.0
            })
            explanation_parts.append("تقاطع ماكد إيجابي (MACD_hist > 0)")

        # 11. Condition: P/E Ratio under threshold
        pe_match = re.search(r"(مكرر ارباح|مكرر ربحيه|مكرر ربحية|مكرر|pe)\s*(تحت|اقل من|<|دون)\s*(\d+)", q_norm)
        if pe_match:
            val = float(pe_match.group(3))
            conditions.append({
                "field": "pe_ratio",
                "operator": "<",
                "value": val
            })
            explanation_parts.append(f"مكرر الأرباح أقل من {val} (pe_ratio < {val})")

        # Format explanation
        if not explanation_parts:
            explanation_parts.append("جميع الأسهم النشطة")
        final_explanation = "فهمت طلبك كـ: " + " + ".join(explanation_parts)

        return {
            "universe": universe,
            "assetClass": asset_class,
            "sector": sector,
            "conditions": conditions,
            "logic": "AND",
            "limit": 20
        }, final_explanation

global_screener_nlu = ScreenerNLU()
