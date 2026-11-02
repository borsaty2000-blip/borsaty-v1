"""
Confluence Analysis Engine (Borsaty).
Weighted, Regime-Aware, Transparent Aggregation of All Analytical Engines.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timezone
import math


class ConfluenceEngine:
    """
    Weighted aggregation of all analytical engine outputs.
    Regime-aware. Transparent. Contradiction-exposing.
    """

    VERSION = "1.0.0"

    # Regime-specific weights across 6 analytical components (must sum to 1.0)
    WEIGHTS: Dict[str, Dict[str, float]] = {
        "trending_strong": {
            "elliott": 0.25,
            "classical": 0.20,
            "indicators": 0.20,
            "harmonic": 0.10,
            "structure": 0.15,
            "volume": 0.10,
        },
        "trending_weak": {
            "elliott": 0.20,
            "classical": 0.20,
            "indicators": 0.20,
            "harmonic": 0.15,
            "structure": 0.15,
            "volume": 0.10,
        },
        "ranging": {
            "harmonic": 0.25,
            "classical": 0.25,
            "indicators": 0.15,
            "elliott": 0.10,
            "structure": 0.15,
            "volume": 0.10,
        },
        "volatile_expansion": {
            "structure": 0.20,
            "volume": 0.20,
            "indicators": 0.20,
            "elliott": 0.15,
            "classical": 0.15,
            "harmonic": 0.10,
        },
        "volatile_contraction": {
            "harmonic": 0.25,
            "classical": 0.25,
            "indicators": 0.15,
            "structure": 0.20,
            "elliott": 0.10,
            "volume": 0.05,
        },
        "breakout": {
            "volume": 0.25,
            "structure": 0.20,
            "classical": 0.20,
            "indicators": 0.15,
            "elliott": 0.10,
            "harmonic": 0.10,
        },
        "mean_reversion": {
            "harmonic": 0.25,
            "indicators": 0.25,
            "classical": 0.20,
            "structure": 0.15,
            "elliott": 0.10,
            "volume": 0.05,
        },
    }

    def _evaluate_elliott(self, elliott_res: Optional[Dict[str, Any]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        if not elliott_res or elliott_res.get("status") == "unavailable":
            return 0.0, 0.50, "لا يوجد عد موجي معتمد حالياً", "No confirmed wave count available", False

        primary = elliott_res.get("primary_count")
        if not primary:
            return 0.0, 0.50, "لا يوجد عد موجي أولي مؤكد", "No primary wave count confirmed", False

        score = float(primary.get("pattern_score", 0.75))
        pattern_name = primary.get("pattern", "impulse")
        waves = primary.get("waves", [])

        # Direction from first wave or waves trend
        direction_str = "up"
        if waves:
            direction_str = waves[0].get("direction", "up")

        is_bullish = direction_str in ["up", "bullish"]
        raw_score = score if is_bullish else -score

        ar_dir = "صاعدة" if is_bullish else "هابطة"
        en_dir = "bullish" if is_bullish else "bearish"
        ar = f"موجة {pattern_name} {ar_dir}، النتيجة {score:.2f}"
        en = f"{en_dir.capitalize()} {pattern_name} wave, score {score:.2f}"

        return round(raw_score, 3), score, ar, en, True

    def _evaluate_harmonic(self, harmonic_res: Optional[Dict[str, Any]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        if not harmonic_res or harmonic_res.get("status") == "unavailable":
            return 0.0, 0.50, "لا تتوفر نماذج هارمونية مؤكدة", "No confirmed harmonic patterns", False

        patterns = harmonic_res.get("patterns", [])
        if not patterns:
            return 0.0, 0.50, "لا توجد نماذج هارمونية محققة", "No harmonic patterns met criteria", False

        best_pat = patterns[0]
        score = float(best_pat.get("overall_score", 0.85))
        pat_name = best_pat.get("pattern", "harmonic")
        is_bullish = (best_pat.get("direction") == "bullish")

        raw_score = score if is_bullish else -score
        ar_dir = "صاعد" if is_bullish else "هابط"
        en_dir = "bullish" if is_bullish else "bearish"
        ar = f"نمط {pat_name} {ar_dir} مؤكد، درجة {score:.2f}"
        en = f"Confirmed {en_dir} {pat_name}, score {score:.2f}"

        return round(raw_score, 3), score, ar, en, True

    def _evaluate_classical(self, classical_res: Optional[Dict[str, Any]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        if not classical_res or classical_res.get("status") == "unavailable":
            return 0.0, 0.50, "لا نمط كلاسيكي مؤكد", "No confirmed classical pattern", False

        patterns = classical_res.get("patterns", [])
        confirmed_pats = [p for p in patterns if p.get("status") == "confirmed"]

        if not confirmed_pats:
            forming_pats = [p for p in patterns if p.get("status") == "forming"]
            if forming_pats:
                return 0.0, 0.50, "نمط كلاسيكي قيد التكوين لم يكتمل كسره", "Classical pattern forming without breakout", False
            return 0.0, 0.50, "لا نمط كلاسيكي مؤكد", "No confirmed classical pattern", False

        best_pat = confirmed_pats[0]
        score = float(best_pat.get("pattern_score", 0.85))
        pat_name = best_pat.get("pattern", "classical")
        direction = best_pat.get("direction", "bullish")
        is_bullish = direction in ["bullish", "continuation"]

        raw_score = score if is_bullish else -score
        ar_dir = "صاعد" if is_bullish else "هابط"
        en_dir = "bullish" if is_bullish else "bearish"
        ar = f"نموذج {pat_name} {ar_dir} مؤكد، النتيجة {score:.2f}"
        en = f"Confirmed {en_dir} {pat_name}, score {score:.2f}"

        return round(raw_score, 3), score, ar, en, True

    def _evaluate_indicators(self, ind_res: Optional[Dict[str, Any]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        if not ind_res:
            return 0.0, 0.50, "المؤشرات غير متاحة", "Indicators unavailable", False

        # Support both direct dictionary of indicators or nested under 'indicators'
        inds = ind_res.get("indicators", ind_res)
        if not isinstance(inds, dict):
            return 0.0, 0.50, "المؤشرات غير متاحة", "Indicators unavailable", False

        signals = []
        parts_ar = []
        parts_en = []

        # RSI
        rsi_val = inds.get("rsi")
        if isinstance(rsi_val, dict):
            rsi_val = rsi_val.get("value")
        if isinstance(rsi_val, (int, float)):
            if rsi_val < 30.0:
                signals.append(0.9)
                parts_ar.append(f"RSI تشبع بيعي ({rsi_val:.0f})")
                parts_en.append(f"RSI oversold ({rsi_val:.0f})")
            elif rsi_val > 70.0:
                signals.append(-0.9)
                parts_ar.append(f"RSI تشبع شرائي ({rsi_val:.0f})")
                parts_en.append(f"RSI overbought ({rsi_val:.0f})")
            elif rsi_val > 52.0:
                signals.append(0.6)
                parts_ar.append(f"RSI إيجابي ({rsi_val:.0f})")
                parts_en.append(f"RSI bullish ({rsi_val:.0f})")
            elif rsi_val < 48.0:
                signals.append(-0.6)
                parts_ar.append(f"RSI سلبي ({rsi_val:.0f})")
                parts_en.append(f"RSI bearish ({rsi_val:.0f})")
            else:
                signals.append(0.0)

        # MACD
        macd_val = inds.get("macd")
        if isinstance(macd_val, dict):
            hist = macd_val.get("histogram") or macd_val.get("hist")
            if hist is not None:
                if hist > 0:
                    signals.append(0.8)
                    parts_ar.append("MACD صاعد")
                    parts_en.append("MACD bullish")
                elif hist < 0:
                    signals.append(-0.8)
                    parts_ar.append("MACD هابط")
                    parts_en.append("MACD bearish")

        # Supertrend
        st_val = inds.get("supertrend")
        if isinstance(st_val, dict):
            st_dir = st_val.get("direction")
            if st_dir == 1 or st_dir == "bullish":
                signals.append(0.85)
                parts_ar.append("Supertrend صاعد")
                parts_en.append("Supertrend up")
            elif st_dir == -1 or st_dir == "bearish":
                signals.append(-0.85)
                parts_ar.append("Supertrend هابط")
                parts_en.append("Supertrend down")

        # Fallback / Default
        if not signals:
            return 0.0, 0.50, "بيانات المؤشرات غير كافية", "Insufficient indicator data", False

        raw_score = sum(signals) / len(signals)
        conf = 0.75 + min(0.15, len(signals) * 0.05)
        ar = " + ".join(parts_ar)
        en = " + ".join(parts_en)

        return round(raw_score, 3), conf, ar, en, True

    def _evaluate_structure(self, hspd_res: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        pivots = []
        if isinstance(hspd_res, dict):
            pivots = hspd_res.get("pivots", [])
        elif isinstance(hspd_res, list):
            pivots = hspd_res

        if len(pivots) < 4:
            return 0.0, 0.50, "نقاط تحول غير كافية لتحليل الهيكل", "Insufficient pivots for structure analysis", False

        # Filter peaks and troughs
        peaks = [p for p in pivots if p.get("type") == "peak"]
        troughs = [p for p in pivots if p.get("type") == "trough"]

        if len(peaks) >= 2 and len(troughs) >= 2:
            last_pk, prev_pk = peaks[-1]["price"], peaks[-2]["price"]
            last_tr, prev_tr = troughs[-1]["price"], troughs[-2]["price"]

            if last_pk > prev_pk and last_tr > prev_tr:
                return 0.88, 0.88, "قمم وقيعان صاعدة، هيكل اتجاه صاعد (BOS)", "Higher highs and higher lows, BOS confirmed", True
            elif last_pk < prev_pk and last_tr < prev_tr:
                return -0.88, 0.88, "قمم وقيعان هابطة، هيكل اتجاه هابط (BOS)", "Lower highs and lower lows, BOS confirmed", True
            else:
                return 0.0, 0.60, "هيكل سعري متداخل / اتجاه عرضي", "Mixed structural pivots / range-bound", True

        return 0.0, 0.50, "هيكل سعري غير محدد", "Undefined price structure", False

    def _evaluate_volume(self, candles: Optional[List[Dict[str, Any]]]) -> Tuple[float, float, str, str, bool]:
        """Returns: (raw_score, confidence, rationale_ar, rationale_en, is_available)"""
        if not candles or len(candles) < 5:
            return 0.0, 0.50, "بيانات الحجم غير كافية", "Insufficient volume data", False

        n = len(candles)
        last_c = candles[-1]
        prev_c = candles[-2]

        last_close = float(last_c.get("close", 0.0))
        prev_close = float(prev_c.get("close", 0.0))
        last_vol = float(last_c.get("volume", 0.0))

        start_w = max(0, n - 21)
        prior_vols = [float(candles[i].get("volume", 0.0)) for i in range(start_w, n - 1)]
        sma_vol = sum(prior_vols) / len(prior_vols) if prior_vols else 1.0

        rel_vol = round(last_vol / max(1.0, sma_vol), 2)
        price_delta = last_close - prev_close

        if rel_vol >= 1.2:
            if price_delta > 0:
                return 0.70, 0.75, f"صعود سعري مدعوم بحجم {rel_vol:.1f}x المتوسط", f"Price advance confirmed by {rel_vol:.1f}x volume", True
            elif price_delta < 0:
                return -0.70, 0.75, f"هبوط سعري بحجم مرتفع {rel_vol:.1f}x المتوسط", f"Price decline with elevated {rel_vol:.1f}x volume", True
        elif rel_vol < 0.8:
            return 0.0, 0.60, f"تداول بأحجام منخفضة ({rel_vol:.1f}x)", f"Trading on light volume ({rel_vol:.1f}x)", True

        return 0.20 if price_delta > 0 else -0.20, 0.55, f"حجم طبيعي ({rel_vol:.1f}x)", f"Normal volume ({rel_vol:.1f}x)", True

    def compute(
        self,
        symbol: str,
        timeframe: str,
        engine_outputs: Dict[str, Any],
        regime: Union[Dict[str, Any], str],
        candles: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Computes regime-weighted confluence across all engines.
        """
        regime_str = regime.get("regime", "ranging") if isinstance(regime, dict) else str(regime)
        if regime_str not in self.WEIGHTS:
            regime_str = "ranging"

        weights = self.WEIGHTS[regime_str]
        computed_at = datetime.now(timezone.utc).isoformat()

        # Step 1: Evaluate raw scores and confidences
        c_candles = candles or engine_outputs.get("candles")

        e_raw, e_conf, e_ar, e_en, e_avail = self._evaluate_elliott(engine_outputs.get("elliott"))
        h_raw, h_conf, h_ar, h_en, h_avail = self._evaluate_harmonic(engine_outputs.get("harmonic"))
        cl_raw, cl_conf, cl_ar, cl_en, cl_avail = self._evaluate_classical(engine_outputs.get("classical"))
        ind_raw, ind_conf, ind_ar, ind_en, ind_avail = self._evaluate_indicators(engine_outputs.get("indicators"))
        st_raw, st_conf, st_ar, st_en, st_avail = self._evaluate_structure(engine_outputs.get("hspd", engine_outputs.get("pivots")))
        vol_raw, vol_conf, vol_ar, vol_en, vol_avail = self._evaluate_volume(c_candles)

        evals = {
            "elliott": (e_raw, e_conf, e_ar, e_en, e_avail),
            "harmonic": (h_raw, h_conf, h_ar, h_en, h_avail),
            "classical": (cl_raw, cl_conf, cl_ar, cl_en, cl_avail),
            "indicators": (ind_raw, ind_conf, ind_ar, ind_en, ind_avail),
            "structure": (st_raw, st_conf, st_ar, st_en, st_avail),
            "volume": (vol_raw, vol_conf, vol_ar, vol_en, vol_avail),
        }

        # Step 2: Calculate contributions
        engines_dict = {}
        total_score = 0.0
        missing_engines = []

        sigma_weighted_sq_sum = 0.0

        for key, w in weights.items():
            raw, conf, ar, en, avail = evals[key]
            contrib = round(raw * w, 4)
            total_score += contrib

            engines_dict[key] = {
                "raw_score": raw,
                "weight": w,
                "contribution": contrib,
                "rationale_ar": ar,
                "rationale_en": en,
            }

            if not avail or raw == 0.0:
                missing_engines.append(key)

            # Error propagation
            sigma_i = max(0.05, 1.0 - conf)
            sigma_weighted_sq_sum += (sigma_i * w) ** 2

        total_score = round(sum(e["contribution"] for e in engines_dict.values()), 4)
        final_score = min(1.0, max(-1.0, round(total_score, 3)))

        # Step 3: Confidence Interval
        sigma_total = math.sqrt(sigma_weighted_sq_sum)
        ci_half = 1.96 * sigma_total
        ci_lower = round(max(-1.0, final_score - ci_half), 2)
        ci_upper = round(min(1.0, final_score + ci_half), 2)

        # Step 4: Classification
        abs_score = abs(final_score)
        if abs_score < 0.15:
            strength = "neutral"
            direction = "neutral"
        elif abs_score < 0.40:
            strength = "weak"
            direction = "bullish" if final_score > 0 else "bearish"
        elif abs_score < 0.65:
            strength = "moderate"
            direction = "bullish" if final_score > 0 else "bearish"
        else:
            strength = "strong"
            direction = "bullish" if final_score > 0 else "bearish"

        # Step 5: Contradiction Detection
        contradictions = []
        if direction in ["bullish", "bearish"]:
            opposing_engines = []
            opposing_sum = 0.0
            for k, data in engines_dict.items():
                contrib = data["contribution"]
                if direction == "bullish" and contrib < -0.01:
                    opposing_engines.append(k)
                    opposing_sum += abs(contrib)
                elif direction == "bearish" and contrib > 0.01:
                    opposing_engines.append(k)
                    opposing_sum += abs(contrib)

            if len(opposing_engines) >= 2 and opposing_sum > 0.15:
                opp_dir_ar = "هابطة" if direction == "bullish" else "صاعدة"
                opp_dir_en = "bearish" if direction == "bullish" else "bullish"
                contradictions.append({
                    "type": "major_contradiction",
                    "opposing_engines": opposing_engines,
                    "opposing_sum": round(opposing_sum, 3),
                    "description_ar": f"تعارض جوهري: {len(opposing_engines)} محركات ({', '.join(opposing_engines)}) تشير إلى إشارات {opp_dir_ar} تعاكس الاتجاه العام",
                    "description_en": f"Major contradiction: {len(opposing_engines)} engines ({', '.join(opposing_engines)}) indicate opposing {opp_dir_en} pressure",
                })

        available_count = 6 - len(missing_engines)
        coverage_pct = round((available_count / 6.0) * 100)

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "version": self.VERSION,
            "computed_at": computed_at,
            "regime": regime if isinstance(regime, dict) else {"regime": regime_str},
            "direction": direction,
            "strength": strength,
            "score": final_score,
            "confidence_interval": [ci_lower, ci_upper],
            "engines": engines_dict,
            "total_score": total_score,
            "contradictions": contradictions,
            "missing_engines": missing_engines,
            "data_quality": {
                "engines_available": available_count,
                "engines_unavailable": len(missing_engines),
                "coverage_pct": coverage_pct,
            },
        }


global_confluence_engine = ConfluenceEngine()
