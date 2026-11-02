"""
Facts Extractor for Dual-Authored Narrator (Borsaty).
Extracts authorized facts and computes the whitelist of authorized numbers.
Version 2.0.0
"""

from typing import Optional, Tuple, List, Dict, Any, Union, Set
import re
from narrator.number_formatting import resolve_currency


COMPANY_NAMES = {
    "COMI": {"ar": "البنك التجاري الدولي", "en": "Commercial International Bank (CIB)"},
    "ABUK": {"ar": "أبو قير للأسمدة", "en": "Abu Qir Fertilizers"},
    "ETEL": {"ar": "المصرية للاتصالات", "en": "Telecom Egypt"},
    "SWDY": {"ar": "السويدي إليكتريك", "en": "Elsewedy Electric"},
    "HRHO": {"ar": "إي إف جي القابضة", "en": "EFG Holding"},
    "EAST": {"ar": "الشرقية للدخان", "en": "Eastern Company"},
    "TMGH": {"ar": "مجموعة طلعت مصطفى", "en": "Talaat Moustafa Group"},
    "2222": {"ar": "أرامكو السعودية", "en": "Saudi Aramco"},
    "1120": {"ar": "مصرف الراجحي", "en": "Al Rajhi Bank"},
    "2010": {"ar": "سابك", "en": "SABIC"},
    "1180": {"ar": "البنك الأهلي السعودي", "en": "SNB"},
    "1010": {"ar": "بنك الرياض", "en": "Riyad Bank"},
    "AAPL": {"ar": "أبل", "en": "Apple Inc."},
    "MSFT": {"ar": "مايكروسوفت", "en": "Microsoft Corp."},
    "NVDA": {"ar": "إنفيديا", "en": "NVIDIA Corp."},
    "AMZN": {"ar": "أمازون", "en": "Amazon.com Inc."},
    "GOOGL": {"ar": "ألفابت (جوجل)", "en": "Alphabet Inc."},
    "META": {"ar": "ميتا", "en": "Meta Platforms"},
    "TSLA": {"ar": "تسلا", "en": "Tesla Inc."},
}


class FactsExtractor:
    """
    Extracts structured facts from diverse payload types and collects
    all authorized numbers for strict zero-hallucination verification.
    """

    @staticmethod
    def _collect_numbers_from_dict(d: Any, nums: Set[float]):
        """Recursively collect numbers from arbitrary nested structures."""
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    val = float(v)
                    nums.add(val)
                    nums.add(round(val, 2))
                    nums.add(round(val, 1))
                    if 0.0 <= val <= 1.0:
                        nums.add(float(round(val * 100.0)))
                        nums.add(float(round(val * 100.0, 1)))
                elif isinstance(v, (dict, list)):
                    FactsExtractor._collect_numbers_from_dict(v, nums)
        elif isinstance(d, list):
            for item in d:
                if isinstance(item, (int, float)) and not isinstance(item, bool):
                    val = float(item)
                    nums.add(val)
                    nums.add(round(val, 2))
                    nums.add(round(val, 1))
                    if 0.0 <= val <= 1.0:
                        nums.add(float(round(val * 100.0)))
                        nums.add(float(round(val * 100.0, 1)))
                elif isinstance(item, (dict, list)):
                    FactsExtractor._collect_numbers_from_dict(item, nums)

    @classmethod
    def extract(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract standardized facts and compute whitelist of authorized numbers.
        """
        allowed_numbers: Set[float] = set()
        cls._collect_numbers_from_dict(payload, allowed_numbers)

        # Standard numbers always allowed in structural/ratio contexts
        allowed_numbers.update({0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 10.0, 14.0, 20.0, 21.0, 30.0, 50.0, 70.0, 80.0, 90.0, 100.0})

        symbol = str(payload.get("symbol", "ASSET")).upper()
        timeframe = str(payload.get("timeframe", "1D")).upper()
        currency = resolve_currency(symbol)

        names = COMPANY_NAMES.get(symbol, {"ar": symbol, "en": symbol})
        name_ar = names["ar"]
        name_en = names["en"]

        # 1. Current Price
        current_price = payload.get("current_price") or payload.get("currentPrice")
        if current_price is None and "candles" in payload and payload["candles"]:
            current_price = float(payload["candles"][-1]["close"])
        elif current_price is not None:
            current_price = float(current_price)

        if current_price is not None:
            allowed_numbers.add(current_price)
            allowed_numbers.add(round(current_price, 2))

        # 2. Confluence & Regime
        confluence = payload.get("confluence", {})
        direction = confluence.get("direction") or payload.get("direction", "neutral")
        conf_score = float(confluence.get("score") or payload.get("score", 0.0))
        regime = payload.get("regime", {})
        regime_str = regime.get("regime") if isinstance(regime, dict) else str(regime or "ranging")

        # 3. Elliott facts
        elliott = payload.get("elliott", {})
        primary_count = elliott.get("primary_count") or {}
        wave_pattern = primary_count.get("pattern", "none")
        wave_score = float(primary_count.get("pattern_score", 0.0))
        wave_subtype = primary_count.get("subtype", "")
        current_wave = "3" if "impulse" in wave_pattern else "C"

        # 4. Harmonic facts
        harmonic = payload.get("harmonic", {})
        harm_patterns = harmonic.get("patterns", [])
        primary_harmonic = harm_patterns[0] if harm_patterns else None

        # 5. Classical facts
        classical = payload.get("classical", {})
        class_patterns = classical.get("patterns", [])
        primary_classical = class_patterns[0] if class_patterns else None

        # 6. Trade Plan facts
        trade_plan = payload.get("trade_plan") or {}
        tp_status = trade_plan.get("status") if isinstance(trade_plan, dict) else "no_actionable_setup"
        tp_entry = trade_plan.get("entry_zone", {}) if isinstance(trade_plan, dict) else {}
        tp_stop = trade_plan.get("stop_loss", {}) if isinstance(trade_plan, dict) else {}
        tp_targets = trade_plan.get("targets", []) if isinstance(trade_plan, dict) else []
        tp_rr = trade_plan.get("risk_reward", {}) if isinstance(trade_plan, dict) else {}
        tp_warnings = trade_plan.get("warnings", []) if isinstance(trade_plan, dict) else []
        tp_sizing = trade_plan.get("position_sizing") if isinstance(trade_plan, dict) else None

        # Precompute legitimate derived percentages & ratios
        if current_price and tp_stop and isinstance(tp_stop, dict) and "price" in tp_stop:
            sp = float(tp_stop["price"])
            allowed_numbers.add(sp)
            allowed_numbers.add(round(sp, 2))
            stop_risk_pct = round((abs(current_price - sp) / current_price) * 100.0, 1)
            allowed_numbers.add(stop_risk_pct)
            allowed_numbers.add(round(stop_risk_pct))

        for t in tp_targets:
            if isinstance(t, dict) and "price" in t:
                tp_price = float(t["price"])
                allowed_numbers.add(tp_price)
                allowed_numbers.add(round(tp_price, 2))
                if current_price:
                    gain_pct = round((abs(tp_price - current_price) / current_price) * 100.0, 1)
                    allowed_numbers.add(gain_pct)
                    allowed_numbers.add(round(gain_pct))
            if isinstance(t, dict) and "r_multiple" in t:
                r_val = float(t["r_multiple"])
                allowed_numbers.add(r_val)
                allowed_numbers.add(round(r_val, 2))

        # Score conversions (e.g. 0.84 -> 84)
        for s in [conf_score, wave_score]:
            pct_val = round(abs(s) * 100.0)
            allowed_numbers.add(pct_val)
            allowed_numbers.add(float(pct_val))

        return {
            "symbol": symbol,
            "name_ar": name_ar,
            "name_en": name_en,
            "timeframe": timeframe,
            "currency": currency,
            "current_price": current_price,
            "confluence": {
                "direction": direction,
                "score": conf_score,
                "score_100": round(abs(conf_score) * 100.0),
                "regime": regime_str,
            },
            "elliott": {
                "available": elliott.get("status") == "available" and bool(primary_count),
                "pattern": wave_pattern,
                "subtype": wave_subtype,
                "wave": current_wave,
                "score": wave_score,
                "score_100": round(wave_score * 100.0),
            },
            "harmonic": {
                "available": bool(primary_harmonic),
                "pattern": primary_harmonic.get("pattern") if primary_harmonic else None,
                "type": primary_harmonic.get("type") if primary_harmonic else None,
                "score": float(primary_harmonic.get("overall_score", 0.0)) if primary_harmonic else 0.0,
                "score_100": round(float(primary_harmonic.get("overall_score", 0.0)) * 100.0) if primary_harmonic else 0,
                "prz": primary_harmonic.get("prz") if primary_harmonic else None,
            },
            "classical": {
                "available": bool(primary_classical),
                "pattern": primary_classical.get("pattern") if primary_classical else None,
                "type": primary_classical.get("type") if primary_classical else None,
                "score": float(primary_classical.get("pattern_score", 0.0)) if primary_classical else 0.0,
                "score_100": round(float(primary_classical.get("pattern_score", 0.0)) * 100.0) if primary_classical else 0,
                "status": primary_classical.get("status", "confirmed") if primary_classical else None,
            },
            "trade_plan": {
                "status": tp_status,
                "entry_zone": tp_entry,
                "stop_loss": tp_stop,
                "targets": tp_targets,
                "risk_reward": tp_rr,
                "warnings": tp_warnings,
                "position_sizing": tp_sizing,
            },
            "allowed_numbers": allowed_numbers,
        }
