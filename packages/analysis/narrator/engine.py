"""
Dual-Authored Deterministic Narrator Engine (Borsaty).
Authors two distinct native narratives (Arabic and English) from a single deterministic JSON payload.
Zero LLM. Zero Translation. Pure Template + Facts.
Version 2.0.0
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from narrator.facts_extractor import FactsExtractor
from narrator.verification import NarratorVerification, HallucinationError
from narrator.templates.ar.analysis import narrate_analysis_summary_ar
from narrator.templates.en.analysis import narrate_analysis_summary_en
from narrator.templates.ar.elliott import narrate_elliott_ar
from narrator.templates.en.elliott import narrate_elliott_en
from narrator.templates.ar.harmonic import narrate_harmonic_ar
from narrator.templates.en.harmonic import narrate_harmonic_en
from narrator.templates.ar.classical import narrate_classical_ar
from narrator.templates.en.classical import narrate_classical_en
from narrator.templates.ar.trade_plan import narrate_trade_plan_ar
from narrator.templates.en.trade_plan import narrate_trade_plan_en
from narrator.templates.ar.fragments import DISCLAIMER_AR
from narrator.templates.en.fragments import DISCLAIMER_EN


class NarratorEngine:
    """
    Original Arabic and English narrator engine.
    Strictly deterministic, zero-hallucination gated.
    """

    VERSION = "2.0.0"

    def __init__(self):
        self.extractor = FactsExtractor()
        self.verifier = NarratorVerification()

    def narrate(
        self,
        payload: Dict[str, Any],
        language: str = "ar",
        style: str = "professional",
        strict_verification: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate natural language narration for the provided analysis or trade plan payload.
        """
        lang = language.lower() if language else "ar"
        if lang not in ["ar", "en"]:
            lang = "ar"

        style_norm = style.lower() if style else "professional"
        if style_norm not in ["professional", "brief", "detailed"]:
            style_norm = "professional"

        # 1. Extract authorized facts and number whitelist
        facts = self.extractor.extract(payload)
        allowed_numbers = facts["allowed_numbers"]

        # 2. Render each section in the native language
        sections = {}
        if lang == "ar":
            sections["analysis_summary"] = narrate_analysis_summary_ar(facts, style=style_norm)
            sections["elliott"] = narrate_elliott_ar(facts, style=style_norm)
            sections["harmonic"] = narrate_harmonic_ar(facts, style=style_norm)
            sections["classical"] = narrate_classical_ar(facts, style=style_norm)
            sections["trade_plan"] = narrate_trade_plan_ar(facts, style=style_norm)
            raw_warnings = facts["trade_plan"].get("warnings", [])
            sections["warnings"] = raw_warnings if raw_warnings else []
            sections["disclaimer"] = DISCLAIMER_AR
        else:
            sections["analysis_summary"] = narrate_analysis_summary_en(facts, style=style_norm)
            sections["elliott"] = narrate_elliott_en(facts, style=style_norm)
            sections["harmonic"] = narrate_harmonic_en(facts, style=style_norm)
            sections["classical"] = narrate_classical_en(facts, style=style_norm)
            sections["trade_plan"] = narrate_trade_plan_en(facts, style=style_norm)
            raw_warnings = facts["trade_plan"].get("warnings", [])
            sections["warnings"] = raw_warnings if raw_warnings else []
            sections["disclaimer"] = DISCLAIMER_EN

        # 3. Assemble full narrative text
        text_parts = [
            sections["analysis_summary"],
            sections["elliott"],
            sections["harmonic"],
            sections["classical"],
            sections["trade_plan"],
        ]
        if sections["warnings"]:
            prefix = "⚠️ تنبيهات: " if lang == "ar" else "⚠️ Warnings: "
            text_parts.append(prefix + " | ".join(sections["warnings"]))
        text_parts.append(sections["disclaimer"])

        full_text = "\n\n".join(part for part in text_parts if part)

        # 4. Zero-hallucination verification gate
        verification_res = self.verifier.verify(
            text=full_text,
            allowed_numbers=allowed_numbers,
            language=lang,
            strict=strict_verification,
        )

        return {
            "symbol": facts["symbol"],
            "language": lang,
            "style": style_norm,
            "version": self.VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sections": sections,
            "full_text": full_text,
            "verification": verification_res,
        }


global_narrator_engine = NarratorEngine()
