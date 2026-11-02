import re
from typing import Optional, Tuple, List, Dict, Any, Union, Set

class HallucinationError(Exception):
    """Raised when an engine or narrator attempts to output fabricated numbers."""
    pass

class NarratorEngine:
    """
    Deterministic Arabic Narrator Engine
    Enforces the single source of truth rule:
    - Never mentions any number, target, price, or ratio not provided in input payload
      or legitimately derived via strict deterministic mathematical formulas.
    - Legitimately derived quantities:
      * Target percentage gain: ((target - current_price) / current_price) * 100
      * Stop loss percentage risk: ((current_price - stop_loss) / current_price) * 100
      * Fair value discount/upside: ((fair_value - current_price) / current_price) * 100
    - If a target is missing (e.g. only 1 target provided), it never fabricates Target 2.
    """

    @staticmethod
    def extract_numbers(text: str) -> List[float]:
        tokens = re.findall(r"(?<![a-zA-Z_])[-+]?\b\d+(?:\.\d+)?\b", text)
        return [float(t) for t in tokens]

    def _normalize_targets(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        targets = []
        if "targets" in payload and isinstance(payload["targets"], list):
            for t in payload["targets"]:
                if isinstance(t, dict):
                    targets.append(t)
                else:
                    targets.append({"price": float(t)})
        else:
            for k in ["target_1", "target_2", "target_3", "target1", "target2"]:
                if k in payload and payload[k] is not None:
                    targets.append({"price": float(payload[k])})
        return targets

    def explain(self, payload: Dict[str, Any]) -> str:
        current_price = payload.get("current_price") or payload.get("currentPrice")
        targets = self._normalize_targets(payload)
        stop_loss = payload.get("stop_loss") or payload.get("stopLoss")
        confluence = payload.get("confluence_score") or payload.get("confluenceScore")
        fair_value = payload.get("fair_value") or payload.get("fairValue")
        symbol = payload.get("symbol", "")
        name_ar = payload.get("name_ar", symbol)

        sections = []
        allowed_numbers: Set[float] = set()

        if current_price is not None:
            current_price = float(current_price)
            allowed_numbers.add(current_price)
            if name_ar:
                sections.append(f"سعر سهم {name_ar} يتداول حالياً عند {current_price}.")
            else:
                sections.append(f"السعر الحالي هو {current_price}.")

        if confluence is not None:
            confluence = float(confluence)
            allowed_numbers.add(confluence)
            allowed_numbers.add(100.0)
            sections.append(f"توافق الأدوات الفنية يبلغ {confluence} من 100.")

        # Format Targets and Pre-compute Mathematically Derived Percentages
        if targets and len(targets) > 0:
            target_strs = []
            for idx, t in enumerate(targets, start=1):
                allowed_numbers.add(float(idx))
                t_val = float(t["price"])
                allowed_numbers.add(t_val)

                # Pre-compute legitimate mathematical derivative: percentage change
                pct_str = ""
                if current_price is not None and current_price > 0:
                    pct = ((t_val - current_price) / current_price) * 100.0
                    rounded_1 = round(pct, 1)
                    rounded_2 = round(pct, 2)
                    rounded_int = float(int(round(pct)))

                    allowed_numbers.add(rounded_1)
                    allowed_numbers.add(rounded_2)
                    allowed_numbers.add(rounded_int)
                    allowed_numbers.add(abs(rounded_1))
                    allowed_numbers.add(abs(rounded_2))
                    allowed_numbers.add(abs(rounded_int))

                    pct_str = f" (بارتفاع {rounded_1}%)"

                method_str = f" [{t.get('method')}]" if "method" in t and t["method"] else ""
                if "method" in t and t["method"]:
                    for num in self.extract_numbers(str(t["method"])):
                        allowed_numbers.add(num)

                target_strs.append(f"الهدف {idx}: {t_val}{pct_str}{method_str}")

            sections.append("الأهداف الفنية المحددة: " + "، ".join(target_strs) + ".")
        else:
            sections.append("لا توجد أهداف فنية معلنة في البيانات الحالية.")

        # Format Stop Loss and Derived Risk Percentage
        if stop_loss:
            sl_val = float(stop_loss["price"] if isinstance(stop_loss, dict) else stop_loss)
            allowed_numbers.add(sl_val)

            risk_str = ""
            if current_price is not None and current_price > 0:
                risk_pct = ((current_price - sl_val) / current_price) * 100.0
                r_1 = round(risk_pct, 1)
                r_2 = round(risk_pct, 2)
                r_int = float(int(round(risk_pct)))
                allowed_numbers.add(r_1)
                allowed_numbers.add(r_2)
                allowed_numbers.add(r_int)
                risk_str = f" (بمخاطرة {r_1}%)"

            method_str = f" [{stop_loss.get('method')}]" if isinstance(stop_loss, dict) and "method" in stop_loss else ""
            if isinstance(stop_loss, dict) and "method" in stop_loss:
                for num in self.extract_numbers(str(stop_loss["method"])):
                    allowed_numbers.add(num)

            sections.append(f"مستوى وقف الخسارة والإبطال: {sl_val}{risk_str}{method_str}.")

        # Format Fair Value and Derived Upside Percentage
        if fair_value:
            fv_val = float(fair_value["mid"] if isinstance(fair_value, dict) else fair_value)
            allowed_numbers.add(fv_val)

            fv_str = ""
            if current_price is not None and current_price > 0:
                upside_pct = ((fv_val - current_price) / current_price) * 100.0
                u_1 = round(upside_pct, 1)
                u_2 = round(upside_pct, 2)
                u_int = float(int(round(upside_pct)))
                allowed_numbers.add(u_1)
                allowed_numbers.add(u_2)
                allowed_numbers.add(u_int)
                fv_str = f" (فارق سعري عادل {u_1}%)"

            sections.append(f"القيمة العادلة المرجحة: {fv_val}{fv_str}.")

        response = " ".join(sections)

        # Allowlist Verification Gate
        extracted = self.extract_numbers(response)
        unauthorized = [n for n in extracted if n not in allowed_numbers]
        if unauthorized:
            raise HallucinationError(f"Hallucination Detected! Unauthorized numbers: {unauthorized}")

        return response
