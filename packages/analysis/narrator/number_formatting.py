"""
Locale-Aware Number & Currency Formatting for Dual-Authored Narrator (Borsaty).
Version 2.0.0

Style Choice: Western Arabic Numerals (0-9) are used across both Arabic and English.
Modern Arab financial institutions (EGX, TASI, Central Banks) standardly use Western numerals
for financial statements and quote displays.
"""

from typing import Union, Optional

CURRENCY_SYMBOLS_AR = {
    "EGP": "ج.م",
    "SAR": "ر.س",
    "AED": "د.إ",
    "QAR": "ر.ق",
    "KWD": "د.ك",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
}

CURRENCY_SYMBOLS_EN = {
    "EGP": "EGP",
    "SAR": "SAR",
    "AED": "AED",
    "QAR": "QAR",
    "KWD": "KWD",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
}

ORDINAL_WAVES_AR = {
    1: "الأولى",
    2: "الثانية",
    3: "الثالثة",
    4: "الرابعة",
    5: "الخامسة",
    "1": "الأولى",
    "2": "الثانية",
    "3": "الثالثة",
    "4": "الرابعة",
    "5": "الخامسة",
    "A": "A",
    "B": "B",
    "C": "C",
}

ORDINAL_TARGETS_AR = {
    1: "الهدف الأول",
    2: "الهدف الثاني",
    3: "الهدف الثالث",
}


def resolve_currency(symbol: str) -> str:
    """Infer primary currency from ticker symbol prefix/suffix."""
    sym = symbol.upper()
    if sym.endswith(".CA") or sym in ["COMI", "ABUK", "ETEL", "SWDY", "HRHO", "EAST", "TMGH"]:
        return "EGP"
    if sym.endswith(".SR") or sym in ["2222", "1120", "2010", "1180", "1010", "7010", "2380"]:
        return "SAR"
    if sym.endswith(".AE") or sym in ["EMAAR", "DIB", "FAB", "DEWA"]:
        return "AED"
    return "USD"


def format_price(value: Union[float, int], currency_code: str = "USD", language: str = "ar") -> str:
    """
    Format price according to financial locale standards:
    - Arabic: 86.00 ج.م
    - English: EGP 86.00 (or $86.00)
    """
    val_float = float(value)
    formatted_num = f"{val_float:.2f}"

    if language == "ar":
        curr_label = CURRENCY_SYMBOLS_AR.get(currency_code.upper(), currency_code)
        return f"{formatted_num} {curr_label}"
    else:
        curr_label = CURRENCY_SYMBOLS_EN.get(currency_code.upper(), currency_code)
        if curr_label in ["$", "€", "£"]:
            return f"{curr_label}{formatted_num}"
        return f"{curr_label} {formatted_num}"


def format_pct(value: Union[float, int]) -> str:
    """Format percentage: 61% or 4.1%"""
    val = float(value)
    if val.is_integer():
        return f"{int(val)}%"
    return f"{val:.1f}%"


def format_wave_ar(wave: Union[str, int]) -> str:
    """Convert wave identifier to natural Arabic ordinal."""
    return ORDINAL_WAVES_AR.get(wave, str(wave))
