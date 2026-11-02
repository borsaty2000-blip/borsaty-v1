"""
Unified Trade Plan Engine (Borsaty).
Synthesizes target and stop proposals across 5 engines into one actionable plan.
Axiomatic clustering, ranking, validation, and risk management.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone
import math

from trade_plan.proposals import (
    TradeProposal,
    extract_all_trade_proposals,
    calculate_atr14,
)
from trade_plan.sizing import PositionSizer, global_position_sizer


REGIME_TARGET_WEIGHTS: Dict[str, Dict[str, float]] = {
    "trending_strong": {
        "elliott": 0.25,
        "classical": 0.20,
        "indicators": 0.20,
        "structure": 0.15,
        "harmonic": 0.10,
        "fibonacci": 0.10,
    },
    "trending_weak": {
        "elliott": 0.20,
        "classical": 0.20,
        "indicators": 0.20,
        "structure": 0.15,
        "harmonic": 0.15,
        "fibonacci": 0.10,
    },
    "ranging": {
        "harmonic": 0.25,
        "classical": 0.25,
        "indicators": 0.15,
        "structure": 0.15,
        "elliott": 0.10,
        "fibonacci": 0.10,
    },
    "volatile_expansion": {
        "structure": 0.20,
        "indicators": 0.20,
        "elliott": 0.15,
        "classical": 0.15,
        "harmonic": 0.10,
        "fibonacci": 0.20,
    },
    "volatile_contraction": {
        "harmonic": 0.25,
        "classical": 0.25,
        "structure": 0.20,
        "indicators": 0.15,
        "elliott": 0.10,
        "fibonacci": 0.05,
    },
    "breakout": {
        "classical": 0.20,
        "structure": 0.20,
        "indicators": 0.15,
        "fibonacci": 0.25,
        "elliott": 0.10,
        "harmonic": 0.10,
    },
    "mean_reversion": {
        "indicators": 0.25,
        "harmonic": 0.25,
        "classical": 0.20,
        "structure": 0.15,
        "elliott": 0.10,
        "fibonacci": 0.05,
    },
}


class TradePlanEngine:
    """
    Aggregate targets/stops from all engines.
    Cluster by price. Rank by confluence. Return unified plan.
    """

    VERSION = "1.0.0"

    def __init__(self, sizer: Optional[PositionSizer] = None):
        self.sizer = sizer or global_position_sizer

    def compute(
        self,
        symbol: str,
        timeframe: str,
        full_analysis: Dict[str, Any],
        capital: Optional[float] = None,
        risk_pct: float = 2.0,
        candles: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Derive unified trade plan from full analysis payload.
        """
        computed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Resolve candles & current price
        candles_list = candles or full_analysis.get("candles") or []
        if candles_list:
            current_price = float(candles_list[-1]["close"])
            atr = calculate_atr14(candles_list)
        else:
            # Fallback current price
            current_price = 100.0
            atr = 2.0

        atr = max(0.001, atr)

        # 2. Extract Confluence & Regime context
        confluence = full_analysis.get("confluence", {})
        confluence_dir = confluence.get("direction", "neutral")
        confluence_score = float(confluence.get("score", 0.0))
        regime_data = full_analysis.get("regime", {})
        regime_name = regime_data.get("regime", "ranging") if isinstance(regime_data, dict) else str(regime_data)

        # Identify agreeing and disagreeing engines from confluence
        engines_agreeing = []
        engines_disagreeing = []
        if isinstance(confluence.get("engines"), dict):
            for eng_k, eng_v in confluence["engines"].items():
                c_score = eng_v.get("raw_score", 0.0)
                if confluence_dir == "bullish":
                    if c_score > 0.1:
                        engines_agreeing.append(eng_k)
                    elif c_score < -0.1:
                        engines_disagreeing.append(eng_k)
                elif confluence_dir == "bearish":
                    if c_score < -0.1:
                        engines_agreeing.append(eng_k)
                    elif c_score > 0.1:
                        engines_disagreeing.append(eng_k)

        # STEP 1: Collect all proposals
        all_proposals = extract_all_trade_proposals(full_analysis, candles_list, current_price)

        # Entry zone candidates
        entry_proposals = [p for p in all_proposals if p.type == "entry_zone"]
        if entry_proposals:
            lows = []
            highs = []
            for ep in entry_proposals:
                if "low" in ep.metadata and "high" in ep.metadata:
                    lows.append(ep.metadata["low"])
                    highs.append(ep.metadata["high"])
                else:
                    lows.append(ep.price * 0.995)
                    highs.append(ep.price * 1.005)
            entry_low = round(min(lows), 2)
            entry_high = round(max(highs), 2)
        else:
            entry_low = round(current_price - 0.25 * atr, 2)
            entry_high = round(current_price + 0.25 * atr, 2)

        entry_ref = (entry_low + entry_high) / 2.0

        # Filter targets and stops by direction
        target_proposals: List[TradeProposal] = []
        stop_proposals: List[TradeProposal] = []

        if confluence_dir == "bullish":
            target_proposals = [p for p in all_proposals if p.type == "target" and p.price > current_price]
            stop_proposals = [p for p in all_proposals if p.type == "stop_loss" and p.price < current_price]
        elif confluence_dir == "bearish":
            target_proposals = [p for p in all_proposals if p.type == "target" and p.price < current_price]
            stop_proposals = [p for p in all_proposals if p.type == "stop_loss" and p.price > current_price]
        else:
            # neutral direction -> collect raw for reporting
            target_proposals = [p for p in all_proposals if p.type == "target"]
            stop_proposals = [p for p in all_proposals if p.type == "stop_loss"]

        # STEP 2: Cluster targets by price proximity (Tolerance = 1.0 * ATR)
        tolerance = 1.0 * atr
        # Sort targets by distance from current_price
        target_proposals.sort(key=lambda x: abs(x.price - current_price))

        raw_clusters: List[Dict[str, Any]] = []
        for prop in target_proposals:
            assigned = False
            for cluster in raw_clusters:
                if abs(prop.price - cluster["centroid"]) <= tolerance:
                    cluster["members"].append(prop)
                    # Recompute centroid
                    cluster["centroid"] = sum(m.price for m in cluster["members"]) / len(cluster["members"])
                    assigned = True
                    break
            if not assigned:
                raw_clusters.append({
                    "centroid": prop.price,
                    "members": [prop],
                })

        # Process clusters
        processed_clusters: List[Dict[str, Any]] = []
        for c in raw_clusters:
            m_list = c["members"]
            centroid_price = round(c["centroid"], 2)
            distinct_engines = sorted(list(set(m.engine.split("_")[0] for m in m_list)))
            method_diversity = len(distinct_engines)
            sum_score = round(sum(m.score for m in m_list), 2)
            count = len(m_list)
            quality_avg = sum_score / count if count > 0 else 0.0

            # Find dominant engine
            eng_counts: Dict[str, int] = {}
            for m in m_list:
                base_eng = m.engine.split("_")[0]
                eng_counts[base_eng] = eng_counts.get(base_eng, 0) + 1
            dominant_engine = max(eng_counts.items(), key=lambda x: x[1])[0] if eng_counts else "structure"

            processed_clusters.append({
                "centroid": centroid_price,
                "members": m_list,
                "count": count,
                "sum_score": sum_score,
                "quality_avg": quality_avg,
                "distinct_engines": distinct_engines,
                "method_diversity": method_diversity,
                "dominant_engine": dominant_engine,
            })

        # STEP 3: Rank clusters
        for cluster in processed_clusters:
            diversity_norm = min(1.0, cluster["method_diversity"] / 5.0)
            quality_norm = min(1.0, cluster["quality_avg"])
            dist_ratio = abs(cluster["centroid"] - current_price) / current_price
            distance_factor = max(0.0, 1.0 - (dist_ratio / 0.15))
            regime_weight = REGIME_TARGET_WEIGHTS.get(regime_name, {}).get(cluster["dominant_engine"], 0.15)

            rank_score = (
                diversity_norm * 0.35 +
                quality_norm * 0.30 +
                distance_factor * 0.20 +
                regime_weight * 0.15
            )
            cluster["rank_score"] = round(rank_score, 4)

        # Sort clusters: Confluent clusters (>= 2 methods) prioritized for primary target (Target 1)
        confluent_clusters = [c for c in processed_clusters if c["method_diversity"] >= 2]
        confluent_clusters.sort(key=lambda x: x["rank_score"], reverse=True)

        top_clusters = []
        if confluent_clusters:
            primary_confluent = confluent_clusters[0]
            if confluence_dir == "bullish":
                further_clusters = [c for c in processed_clusters if c["centroid"] > primary_confluent["centroid"]]
                further_clusters.sort(key=lambda x: x["centroid"])
            elif confluence_dir == "bearish":
                further_clusters = [c for c in processed_clusters if c["centroid"] < primary_confluent["centroid"]]
                further_clusters.sort(key=lambda x: x["centroid"], reverse=True)
            else:
                further_clusters = [c for c in processed_clusters if c != primary_confluent]
                further_clusters.sort(key=lambda x: x["centroid"])

            top_clusters = [primary_confluent] + further_clusters[:2]
        else:
            processed_clusters.sort(key=lambda x: x["rank_score"], reverse=True)
            top_clusters = processed_clusters[:3]
            if confluence_dir == "bullish":
                top_clusters.sort(key=lambda x: x["centroid"])
            elif confluence_dir == "bearish":
                top_clusters.sort(key=lambda x: x["centroid"], reverse=True)
            else:
                top_clusters.sort(key=lambda x: x["centroid"])

        # STEP 4: Primary Stop Selection
        chosen_stop_price = None
        stop_methods = []
        primary_stop_reason = "Structure stop"
        stop_confidence = "medium"

        if stop_proposals:
            if confluence_dir == "bullish":
                # Most conservative stop = closest to current price (highest stop)
                sorted_stops = sorted(stop_proposals, key=lambda x: x.price, reverse=True)
            else:
                # Most conservative stop = closest to current price (lowest stop)
                sorted_stops = sorted(stop_proposals, key=lambda x: x.price)

            candidate_stop = sorted_stops[0]
            candidate_price = candidate_stop.price

            # Check how many distinct engines agree within 1 ATR
            agreeing_stops = [
                sp for sp in stop_proposals
                if abs(sp.price - candidate_price) <= (1.0 * atr)
            ]
            agreeing_engines = set(sp.engine.split("_")[0] for sp in agreeing_stops)

            if len(agreeing_engines) >= 2:
                chosen_stop_price = candidate_price
                stop_methods = [
                    {"engine": sp.engine.split("_")[0], "reason": sp.reason or sp.method}
                    for sp in agreeing_stops
                ]
                primary_stop_reason = candidate_stop.reason or candidate_stop.method
                stop_confidence = "high" if len(agreeing_engines) >= 3 else "medium"
            else:
                # Fallback to Structure stop
                struct_stops = [sp for sp in stop_proposals if sp.engine == "structure"]
                if struct_stops:
                    chosen_stop_price = struct_stops[0].price
                    primary_stop_reason = struct_stops[0].reason or struct_stops[0].method
                    stop_methods = [{"engine": "structure", "reason": primary_stop_reason}]
                    stop_confidence = "medium"
                else:
                    chosen_stop_price = candidate_price
                    primary_stop_reason = candidate_stop.reason or candidate_stop.method
                    stop_methods = [{"engine": candidate_stop.engine.split("_")[0], "reason": primary_stop_reason}]
                    stop_confidence = "low"
        else:
            # Fallback default stop based on 2x ATR
            if confluence_dir == "bullish":
                chosen_stop_price = round(current_price - 2.0 * atr, 2)
            else:
                chosen_stop_price = round(current_price + 2.0 * atr, 2)
            primary_stop_reason = f"Volatility stop ({2.0}x ATR)"
            stop_methods = [{"engine": "volatility", "reason": primary_stop_reason}]
            stop_confidence = "low"

        stop_distance = abs(entry_ref - chosen_stop_price)
        stop_distance_pct = round((stop_distance / entry_ref) * 100.0, 2)
        atr_multiple = round(stop_distance / atr, 2)

        stop_loss_dict = {
            "price": round(chosen_stop_price, 2),
            "distance_pct": stop_distance_pct,
            "atr_multiple": atr_multiple,
            "methods": stop_methods,
            "primary_reason": primary_stop_reason,
            "confidence": stop_confidence,
        }

        # Build formatted Targets list
        targets_list: List[Dict[str, Any]] = []
        for idx, cl in enumerate(top_clusters):
            p = cl["centroid"]
            t_distance_pct = round((abs(p - entry_ref) / entry_ref) * 100.0, 2)
            r_multiple = round(abs(p - entry_ref) / stop_distance, 2) if stop_distance > 0 else 0.0

            formatted_methods = []
            for m in cl["members"]:
                formatted_methods.append({
                    "engine": m.engine.split("_")[0],
                    "method": m.method,
                    "score": round(m.score, 2),
                })

            conf_str = "high" if cl["method_diversity"] >= 3 else ("medium" if cl["method_diversity"] >= 2 else "low")

            targets_list.append({
                "rank": idx + 1,
                "price": p,
                "distance_pct": t_distance_pct,
                "r_multiple": r_multiple,
                "methods": formatted_methods,
                "method_diversity": cl["method_diversity"],
                "cluster_sum_score": cl["sum_score"],
                "confidence": conf_str,
            })

        # Calculate risk reward
        r1 = targets_list[0]["r_multiple"] if len(targets_list) > 0 else 0.0
        r2 = targets_list[1]["r_multiple"] if len(targets_list) > 1 else 0.0
        r3 = targets_list[2]["r_multiple"] if len(targets_list) > 2 else 0.0
        if targets_list:
            rank_weights = [1.0 / t["rank"] for t in targets_list]
            sum_w = sum(rank_weights)
            blended_rr = round(sum(t["r_multiple"] * w for t, w in zip(targets_list, rank_weights)) / sum_w, 2)
        else:
            blended_rr = 0.0

        risk_reward_dict = {
            "target_1_rr": r1,
            "target_2_rr": r2,
            "target_3_rr": r3,
            "blended_rr": blended_rr,
            "primary_rr": r1,
        }

        # STEP 5: Trade Validation (5 criteria for "actionable")
        status = "actionable"
        status_reason = None
        warnings = []

        if confluence_dir == "neutral":
            status = "no_actionable_setup"
            status_reason = "neutral_direction"
        elif not targets_list:
            status = "no_actionable_setup"
            status_reason = "no_targets_found"
        elif targets_list[0]["method_diversity"] < 2:
            status = "no_actionable_setup"
            status_reason = "insufficient_target_confluence"
        elif r1 < 1.5:
            status = "no_actionable_setup"
            status_reason = "r_multiple_too_low"
        elif atr_multiple < 1.5 or stop_distance_pct < 1.5:
            status = "no_actionable_setup"
            status_reason = "stop_too_tight"

        # Warnings (not rejection)
        if stop_distance_pct > 7.0:
            warnings.append(f"Stop distance {stop_distance_pct}% > 7% — wide risk, position size scaled down")
        if len(targets_list) >= 3 and targets_list[2]["method_diversity"] == 1:
            warnings.append("Target 3 has only 1 method — highest risk")

        # STEP 6: Position Sizing
        if capital is None or capital <= 0:
            position_sizing_dict = None
            note_ar = "أدخل رأس مالك لحساب حجم المركز"
            note_en = "Provide capital to compute position size"
        else:
            sizing_fixed = self.sizer.compute(
                capital=capital,
                entry=entry_ref,
                stop=chosen_stop_price,
                risk_tolerance_pct=risk_pct,
                method="fixed_fractional",
            )
            sizing_atr = self.sizer.compute(
                capital=capital,
                entry=entry_ref,
                stop=chosen_stop_price,
                risk_tolerance_pct=risk_pct,
                method="atr_based",
                atr=atr,
            )

            position_sizing_dict = {
                "risk_per_trade_pct": risk_pct,
                "fixed_fractional": {
                    "units_per_1000_capital": sizing_fixed["whole_units"],
                    "max_capital_risk": sizing_fixed["max_loss"],
                    "units": sizing_fixed["units"],
                    "position_value": sizing_fixed["position_value"],
                },
                "atr_based": {
                    "units_per_1000_capital": sizing_atr["whole_units"],
                    "units": sizing_atr["units"],
                    "position_value": sizing_atr["position_value"],
                },
                "note": "User must confirm capital and risk tolerance",
            }
            note_ar = "تم احتساب حجم المركز بناءً على رأس المال المدخل ونسبة المخاطرة"
            note_en = "Position size calculated based on provided capital and risk tolerance"

        invalidation_dict = {
            "price": round(chosen_stop_price, 2),
            "condition": "close below" if confluence_dir == "bullish" else "close above",
            "reason": primary_stop_reason,
        }

        confluence_snapshot = {
            "direction": confluence_dir,
            "score": confluence_score,
            "regime": regime_name,
            "engines_agreeing": engines_agreeing,
            "engines_disagreeing": engines_disagreeing,
        }

        missing_engines = confluence.get("missing_engines", [])
        engines_used_count = 5 - len(missing_engines)

        data_quality_dict = {
            "engines_used": max(1, engines_used_count),
            "engines_unavailable": missing_engines,
            "targets_proposed": len(target_proposals),
            "clusters_formed": len(raw_clusters),
            "clusters_returned": len(targets_list),
        }

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "status": status,
            "status_reason": status_reason,
            "direction": confluence_dir,
            "current_price": round(current_price, 2),
            "entry_zone": {"low": entry_low, "high": entry_high},
            "stop_loss": stop_loss_dict,
            "targets": targets_list,
            "risk_reward": risk_reward_dict,
            "position_sizing": position_sizing_dict,
            "position_sizing_note_ar": note_ar,
            "position_sizing_note_en": note_en,
            "invalidation": invalidation_dict,
            "confluence_snapshot": confluence_snapshot,
            "warnings": warnings,
            "data_quality": data_quality_dict,
        }


global_trade_plan_engine = TradePlanEngine()
