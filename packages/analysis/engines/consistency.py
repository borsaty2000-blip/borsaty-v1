"""
Cross-Engine Structural Consistency Verifier.
Validates structural alignment between Elliott Wave derivations and Harmonic Pattern completions.
"""

from typing import Dict, Any, List, Optional


def check_elliott_harmonic_consistency(
    elliott_result: Dict[str, Any],
    harmonic_result: Dict[str, Any],
    max_bar_diff: int = 3,
) -> Dict[str, Any]:
    """
    Checks if Elliott Wave 4 endpoint ≈ Harmonic D point (within ±max_bar_diff bars).
    Returns consistency report dict. If disagreement, details are documented in consistency_report
    without failing silently.
    """
    symbol = elliott_result.get("symbol") or harmonic_result.get("symbol", "UNKNOWN")
    timeframe = elliott_result.get("timeframe") or harmonic_result.get("timeframe", "1D")

    # Extract Wave 4 end index if present
    primary_count = elliott_result.get("primary_count")
    wave4_index = None
    wave4_price = None
    if primary_count and "waves" in primary_count:
        for w in primary_count["waves"]:
            if str(w.get("number")) == "4":
                wave4_index = w.get("end", {}).get("index")
                wave4_price = w.get("end", {}).get("price")
                break

    # Extract Harmonic D points
    harmonic_patterns = harmonic_result.get("patterns", [])

    comparisons = []
    has_disagreement = False
    has_match = False

    if wave4_index is not None and harmonic_patterns:
        for pat in harmonic_patterns:
            d_point = pat.get("points", {}).get("D", {})
            d_index = d_point.get("index")
            d_price = d_point.get("price")

            if d_index is not None:
                diff = abs(wave4_index - d_index)
                matches = diff <= max_bar_diff
                if matches:
                    has_match = True
                else:
                    has_disagreement = True

                comparisons.append({
                    "pattern": pat.get("pattern"),
                    "direction": pat.get("direction"),
                    "harmonic_d_index": d_index,
                    "harmonic_d_price": d_price,
                    "elliott_wave_4_index": wave4_index,
                    "elliott_wave_4_price": wave4_price,
                    "bar_difference": diff,
                    "within_tolerance": matches,
                    "status": "consistent" if matches else "divergent",
                })

    status = "not_applicable"
    summary_ar = "لا تتوفر هياكل كافية من المحركين للمقارنة"
    summary_en = "Insufficient structures from both engines for comparison"

    if comparisons:
        if has_match and not has_disagreement:
            status = "consistent"
            summary_ar = "توافق تام بين نهاية الموجة الرابعة لإليوت ونقطة D الهارمونية"
            summary_en = f"Complete consistency between Elliott Wave 4 endpoint and Harmonic D point (within ±{max_bar_diff} bars)"
        elif has_match and has_disagreement:
            status = "partial_consistency"
            summary_ar = "توافق جزئي مع بعض نماذج الهارمونيك وتعارض مع أخرى"
            summary_en = "Partial consistency: aligns with some harmonic patterns but diverges with others"
        else:
            status = "divergent"
            summary_ar = "تعارض هيكلي: نقطة D ونهاية الموجة الرابعة تفصلهما مسافة تتجاوز الحد المسموح"
            summary_en = f"Structural divergence: Wave 4 endpoint and Harmonic D point differ by > {max_bar_diff} bars"
    elif wave4_index is not None and not harmonic_patterns:
        status = "elliott_only"
        summary_ar = "تم اشتقاق موجات إليوت دون وجود نماذج هارمونية موازية"
        summary_en = "Elliott waves derived without corresponding harmonic patterns"
    elif wave4_index is None and harmonic_patterns:
        status = "harmonic_only"
        summary_ar = "تم اكتشاف نماذج هارمونية دون اشتقاق موجة رابعة لإليوت"
        summary_en = "Harmonic patterns detected without corresponding Elliott Wave 4"

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "status": status,
        "is_consistent": (status == "consistent"),
        "has_disagreement": has_disagreement,
        "max_bar_tolerance": max_bar_diff,
        "elliott_wave_4": {
            "index": wave4_index,
            "price": wave4_price,
        } if wave4_index is not None else None,
        "comparisons": comparisons,
        "summary_ar": summary_ar,
        "summary_en": summary_en,
    }
