"""
Zero-Hallucination Gate & Verification Engine (Borsaty).
Enhanced for Dual-Authored Narrator v2.0.0.
Strictly verifies that no unauthorized numbers or forbidden claims exist in narrated text.
"""

from typing import Set, List, Dict, Any
import re


class HallucinationError(Exception):
    """Raised when an engine or narrator attempts to output fabricated numbers or claims."""
    pass


FORBIDDEN_CLAIMS_AR = [
    "مضمون",
    "ربح مؤكد",
    "بدون مخاطر",
    "مؤكد 100%",
    "لا يخسر",
    "ثروة سريعة",
]

FORBIDDEN_CLAIMS_EN = [
    "guaranteed",
    "risk-free",
    "sure profit",
    "100% certain",
    "can never lose",
    "get rich quick",
]


class NarratorVerification:
    """
    Guarantees mathematical integrity and blocks any fabricated level or marketing hyperbole.
    """

    VERSION = "2.0.0"

    @staticmethod
    def extract_numbers(text: str) -> List[float]:
        """
        Extract numerical values from text (integers and floating point).
        Filters out punctuation and word-attached indicators.
        """
        # Find all numbers including decimals and negative signs
        matches = re.findall(r"(?<![a-zA-Z_])[-+]?\b\d+(?:\.\d+)?\b", text)
        result = []
        for m in matches:
            try:
                result.append(float(m))
            except ValueError:
                continue
        return result

    @classmethod
    def verify(
        cls,
        text: str,
        allowed_numbers: Set[float],
        language: str = "ar",
        strict: bool = True
    ) -> Dict[str, Any]:
        """
        Verify text against allowed numbers whitelist and forbidden claim list.
        """
        # 1. Check forbidden claims
        text_lower = text.lower()
        forbidden_list = FORBIDDEN_CLAIMS_AR if language == "ar" else FORBIDDEN_CLAIMS_EN
        for claim in forbidden_list:
            if claim in text_lower:
                raise HallucinationError(
                    f"Forbidden claim detected in {language.upper()} narration: '{claim}'"
                )

        # 2. Extract and check numbers
        extracted_numbers = cls.extract_numbers(text)
        checked_count = len(extracted_numbers)
        authorized_count = 0
        unauthorized_numbers = []

        for num in extracted_numbers:
            # Check if num is close to any allowed number
            is_allowed = any(abs(num - allowed) < 0.05 for allowed in allowed_numbers)
            if is_allowed:
                authorized_count += 1
            else:
                unauthorized_numbers.append(num)

        if unauthorized_numbers and strict:
            raise HallucinationError(
                f"Hallucinated or unauthorized numbers found in {language.upper()} narration: {unauthorized_numbers}"
            )

        return {
            "status": "passed" if not unauthorized_numbers else "warning",
            "numbers_checked": checked_count,
            "numbers_authorized": authorized_count,
            "hallucination_gate": "clear" if not unauthorized_numbers else "flagged",
            "unauthorized_numbers": unauthorized_numbers,
        }
