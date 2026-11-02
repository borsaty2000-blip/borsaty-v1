"""
Dual-Authored Narrator Package (Borsaty).
Original Arabic + Original English Financial Market Narratives.
Zero Translation. Zero Hallucination.
Version 2.0.0
"""

from narrator.engine import NarratorEngine, global_narrator_engine
from narrator.facts_extractor import FactsExtractor
from narrator.verification import NarratorVerification, HallucinationError
from narrator.number_formatting import format_price, format_pct, resolve_currency

__all__ = [
    "NarratorEngine",
    "global_narrator_engine",
    "FactsExtractor",
    "NarratorVerification",
    "HallucinationError",
    "format_price",
    "format_pct",
    "resolve_currency",
]
