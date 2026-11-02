"""
Elliott Wave Rule-First Detector.
Derives valid wave sequences from HSPD pivots.
Pure deterministic. No LLM. Zero tolerance for hard rule violations.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone

from .patterns import (
    evaluate_impulse_hard_rules,
    score_impulse_candidate,
    evaluate_zigzag_hard_rules,
    score_zigzag_candidate,
    evaluate_flat_hard_rules,
    score_flat_candidate,
    evaluate_triangle_hard_rules,
    score_triangle_candidate,
)


class ElliottDetector:
    """
    Rule-First Elliott Wave Engine.
    Orchestrates candidate generation and validation across modular patterns.
    """

    VERSION = "1.0.0"

    def __init__(self):
        pass

    def _extract_pivots_list(
        self, pivots_data: Union[Dict[str, Any], List[Dict[str, Any]]], min_degree: int = 1
    ) -> List[Dict[str, Any]]:
        raw_list = []
        if isinstance(pivots_data, dict):
            raw_list = pivots_data.get("pivots", [])
        elif isinstance(pivots_data, list):
            raw_list = pivots_data

        filtered = [
            p for p in raw_list
            if p.get("degree", 0) >= min_degree
        ]
        # Sort chronologically by index
        filtered.sort(key=lambda x: (x.get("index", 0), -x.get("degree", 0)))
        return filtered

    # Thin delegation wrappers for backwards-compatibility
    def _evaluate_impulse_hard_rules(self, *args, **kwargs):
        return evaluate_impulse_hard_rules(*args, **kwargs)

    def _score_impulse_candidate(self, *args, **kwargs):
        return score_impulse_candidate(*args, **kwargs)

    def _evaluate_zigzag_hard_rules(self, *args, **kwargs):
        return evaluate_zigzag_hard_rules(*args, **kwargs)

    def _score_zigzag_candidate(self, *args, **kwargs):
        return score_zigzag_candidate(*args, **kwargs)

    def _evaluate_flat_hard_rules(self, *args, **kwargs):
        return evaluate_flat_hard_rules(*args, **kwargs)

    def _score_flat_candidate(self, *args, **kwargs):
        return score_flat_candidate(*args, **kwargs)

    def _evaluate_triangle_hard_rules(self, *args, **kwargs):
        return evaluate_triangle_hard_rules(*args, **kwargs)

    def _score_triangle_candidate(self, *args, **kwargs):
        return score_triangle_candidate(*args, **kwargs)

    def detect(
        self,
        symbol: str,
        timeframe: str,
        pivots: Any,
        min_degree: int = 1,
        candles_used: int = 250,
    ) -> Dict[str, Any]:
        """
        Derives Elliott Wave structures from HSPD pivots.
        """
        computed_at = datetime.now(timezone.utc).isoformat()
        pivots_list = self._extract_pivots_list(pivots, min_degree=min_degree)

        rejected_counts: List[Dict[str, Any]] = []
        valid_candidates: List[Dict[str, Any]] = []

        # Scan sliding window of 6 consecutive pivots for 5-wave impulse sequence
        has_failed_full_impulse = False
        if len(pivots_list) >= 6:
            for i in range(5, len(pivots_list)):
                p0 = pivots_list[i - 5]
                p1 = pivots_list[i - 4]
                p2 = pivots_list[i - 3]
                p3 = pivots_list[i - 2]
                p4 = pivots_list[i - 1]
                p5 = pivots_list[i]

                # 1. Evaluate Impulse Hard Rules
                passed, passed_r, failed_r, reason = evaluate_impulse_hard_rules(p0, p1, p2, p3, p4, p5)
                if not passed:
                    has_failed_full_impulse = True
                    rejected_counts.append({
                        "pattern": "impulse",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index"), p4.get("index"), p5.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    # Score surviving candidate
                    scored_cand = score_impulse_candidate(p0, p1, p2, p3, p4, p5)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 4 consecutive pivots for 3-wave ZigZag sequence (A-B-C)
        allow_sub_zigzag = not (len(pivots_list) == 6 and has_failed_full_impulse and len(valid_candidates) == 0)

        if len(pivots_list) >= 4 and allow_sub_zigzag:
            for i in range(3, len(pivots_list)):
                p0 = pivots_list[i - 3]
                p1 = pivots_list[i - 2]
                p2 = pivots_list[i - 1]
                p3 = pivots_list[i]

                passed, passed_r, failed_r, reason = evaluate_zigzag_hard_rules(p0, p1, p2, p3)
                if not passed:
                    rejected_counts.append({
                        "pattern": "zigzag",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = score_zigzag_candidate(p0, p1, p2, p3)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 4 consecutive pivots for 3-wave Flat sequence (A-B-C)
        if len(pivots_list) >= 4 and allow_sub_zigzag:
            for i in range(3, len(pivots_list)):
                p0 = pivots_list[i - 3]
                p1 = pivots_list[i - 2]
                p2 = pivots_list[i - 1]
                p3 = pivots_list[i]

                passed, passed_r, failed_r, reason = evaluate_flat_hard_rules(p0, p1, p2, p3)
                if not passed:
                    rejected_counts.append({
                        "pattern": "flat",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = score_flat_candidate(p0, p1, p2, p3)
                    valid_candidates.append(scored_cand)

        # Scan sliding window of 6 consecutive pivots for 5-wave Triangle sequence (A-B-C-D-E)
        if len(pivots_list) >= 6:
            for i in range(5, len(pivots_list)):
                p0 = pivots_list[i - 5]
                p1 = pivots_list[i - 4]
                p2 = pivots_list[i - 3]
                p3 = pivots_list[i - 2]
                p4 = pivots_list[i - 1]
                p5 = pivots_list[i]

                passed, passed_r, failed_r, reason = evaluate_triangle_hard_rules(p0, p1, p2, p3, p4, p5)
                if not passed:
                    rejected_counts.append({
                        "pattern": "triangle",
                        "indices": [p0.get("index"), p1.get("index"), p2.get("index"), p3.get("index"), p4.get("index"), p5.get("index")],
                        "reason": reason,
                        "hard_rule_failed": failed_r[0] if failed_r else "unknown",
                    })
                else:
                    scored_cand = score_triangle_candidate(p0, p1, p2, p3, p4, p5)
                    valid_candidates.append(scored_cand)

        # Rank candidates: 5-wave impulses take priority over sub-slices of themselves
        valid_candidates.sort(
            key=lambda x: (
                1 if x.get("pattern") == "impulse" else 0,
                x.get("pattern_score", 0.0)
            ),
            reverse=True
        )

        primary_count = valid_candidates[0] if len(valid_candidates) > 0 else None
        alternative_count = None

        if len(valid_candidates) > 1 and primary_count:
            p_start = primary_count["waves"][0]["start"]["index"]
            for cand in valid_candidates[1:]:
                c_start = cand["waves"][0]["start"]["index"]
                if cand["pattern"] != primary_count["pattern"]:
                    alternative_count = {
                        "pattern": cand["pattern"],
                        "subtype": cand["subtype"],
                        "waves": cand["waves"],
                        "pattern_score": cand["pattern_score"],
                        "reason_for_alternative": f"Alternative count pattern: {cand['pattern']} ({cand['subtype']}) starting at bar {c_start}",
                    }
                    break
                elif p_start != c_start or cand["subtype"] != primary_count["subtype"]:
                    alternative_count = {
                        "pattern": cand["pattern"],
                        "subtype": cand["subtype"],
                        "waves": cand["waves"],
                        "pattern_score": cand["pattern_score"],
                        "reason_for_alternative": f"Distinct wave anchoring starting at bar {c_start} (score {cand['pattern_score']:.2f})",
                    }
                    break

        # Determine status
        if len(pivots_list) < 4:
            status = "unavailable"
            status_reason = "insufficient_pivots"
            status_message_ar = "عدد نقاط التحول غير كافٍ لاشتقاق هياكل موجات إليوت (الحد الأدنى 4 نقاط)"
            status_message_en = "Insufficient validated pivots to derive Elliott wave structures (minimum 4 required)"
        elif primary_count is None:
            status = "unavailable"
            status_reason = "no_valid_pattern"
            status_message_ar = "لا توجد أنماط موجية تطابق القواعد الرياضية الصارمة"
            status_message_en = "No valid Elliott wave pattern satisfied all binary hard rules"
        else:
            status = "available"
            status_reason = None
            status_message_ar = "تم اشتقاق العد الموجي بنجاح وفق القواعد الحتمية"
            status_message_en = "Valid Elliott wave count derived successfully"

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "degree": min_degree,
            "status": status,
            "status_reason": status_reason,
            "status_message_ar": status_message_ar,
            "status_message_en": status_message_en,
            "primary_count": primary_count,
            "alternative_count": alternative_count,
            "rejected_counts": rejected_counts,
            "data_quality": {
                "pivots_used": len(pivots_list),
                "min_degree": min_degree,
                "candles_used": candles_used,
            }
        }


global_elliott_detector = ElliottDetector()
