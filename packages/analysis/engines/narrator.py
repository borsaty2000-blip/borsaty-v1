import re
from typing import Dict, Any, Set, List

class HallucinationError(Exception):
    """Raised when an engine or narrator attempts to output fabricated numbers."""
    pass

class NarratorEngine:
    """
    Deterministic Arabic Narrator Engine
    Enforces the single source of truth rule:
    - Never mentions any number, target, price, or ratio not provided in input payload.
    - If a target is missing (e.g. only 1 target provided), it never fabricates Target 2.
    - Zero Tolerance Negative Verification.
    """

    @staticmethod
    def extract_numbers(text: str) -> List[float]:
        # Matches positive and negative floats/ints, handling Arabic and Western digits
        tokens = re.findall(r"(?<![a-zA-Z_])[-+]?\b\d+(?:\.\d+)?\b", text)
        return [float(t) for t in tokens]

    def explain(self, payload: Dict[str, Any]) -> str:
        current_price = payload.get("current_price") or payload.get("currentPrice")
        targets = payload.get("targets", [])
        stop_loss = payload.get("stop_loss") or payload.get("stopLoss")
        confluence = payload.get("confluence_score") or payload.get("confluenceScore")
        fair_value = payload.get("fair_value") or payload.get("fairValue")
        symbol = payload.get("symbol", "")
        name_ar = payload.get("name_ar", symbol)

        sections = []

        if name_ar and current_price is not None:
            sections.append(f"سعر سهم {name_ar} يتداول حالياً عند {current_price}.")

        if confluence is not None:
            sections.append(f"توافق الأدوات الفنية يبلغ {confluence} من 100.")

        # Strict Target Formatting (Negative Test Enforcement: never mention target 2 if not in payload!)
        if targets and len(targets) > 0:
            target_strs = []
            for idx, t in enumerate(targets, start=1):
                t_val = t["price"] if isinstance(t, dict) else t
                method_str = f" ({t.get('method')})" if isinstance(t, dict) and "method" in t else ""
                target_strs.append(f"الهدف {idx}: {t_val}{method_str}")
            sections.append("الأهداف الفنية المحددة: " + "، ".join(target_strs) + ".")
        else:
            sections.append("لا توجد أهداف فنية معلنة في البيانات الحالية.")

        if stop_loss:
            sl_val = stop_loss["price"] if isinstance(stop_loss, dict) else stop_loss
            method_str = f" ({stop_loss.get('method')})" if isinstance(stop_loss, dict) and "method" in stop_loss else ""
            sections.append(f"مستوى وقف الخسارة والإبطال: {sl_val}{method_str}.")

        if fair_value:
            fv_val = fair_value["mid"] if isinstance(fair_value, dict) else fair_value
            sections.append(f"القيمة العادلة المرجحة: {fv_val}.")

        response = " ".join(sections)

        # Allowlist Verification Gate
        allowed_numbers: Set[float] = set()
        if current_price is not None:
            allowed_numbers.add(float(current_price))
        if confluence is not None:
            allowed_numbers.add(float(confluence))
            allowed_numbers.add(100.0)
        if targets:
            for idx, t in enumerate(targets, start=1):
                allowed_numbers.add(float(idx))
                t_val = t["price"] if isinstance(t, dict) else t
                allowed_numbers.add(float(t_val))
                if isinstance(t, dict) and "method" in t:
                    for num in self.extract_numbers(str(t["method"])):
                        allowed_numbers.add(num)
        if stop_loss:
            sl_val = stop_loss["price"] if isinstance(stop_loss, dict) else stop_loss
            allowed_numbers.add(float(sl_val))
            if isinstance(stop_loss, dict) and "method" in stop_loss:
                for num in self.extract_numbers(str(stop_loss["method"])):
                    allowed_numbers.add(num)
        if fair_value:
            fv_val = fair_value["mid"] if isinstance(fair_value, dict) else fair_value
            allowed_numbers.add(float(fv_val))

        # Check extracted numbers
        extracted = self.extract_numbers(response)
        unauthorized = [n for n in extracted if n not in allowed_numbers]
        if unauthorized:
            raise HallucinationError(f"Hallucination Detected! Unauthorized numbers: {unauthorized}")

        return response
