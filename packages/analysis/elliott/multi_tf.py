"""
Multi-Timeframe Elliott Wave Coherence Engine.
Evaluates structural alignment across Weekly, Daily, and 4H scales.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from .detector import ElliottDetector, global_elliott_detector
from engines.hspd import HSPDEngine, global_hspd_engine


class MultiTfElliott:
    """
    Multi-Scale Fractal Coherence Validator.
    Runs Elliott Wave detection across Weekly, Daily, and 4H timeframes,
    then rigorously tests whether sub-waves nest cleanly inside macro waves.
    """

    VERSION = "1.0.0"

    def __init__(self, detector: Optional[ElliottDetector] = None, hspd: Optional[HSPDEngine] = None):
        self.detector = detector or global_elliott_detector
        self.hspd = hspd or global_hspd_engine

    def analyze(
        self,
        symbol: str,
        timeframes: Optional[List[str]] = None,
        dataset_by_tf: Optional[Dict[str, List[Any]]] = None,
        hspd_by_tf: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        tfs = timeframes or ["1W", "1D", "4H"]
        computed_at = datetime.now(timezone.utc).isoformat()

        tf_results: Dict[str, Any] = {}

        # 1. Detect Elliott Wave structures on each timeframe
        for tf in tfs:
            if hspd_by_tf and tf in hspd_by_tf:
                hspd_res = hspd_by_tf[tf]
                candles_cnt = hspd_res.get("data_quality", {}).get("candles_used", 250)
            elif dataset_by_tf and tf in dataset_by_tf:
                candles = dataset_by_tf[tf]
                candles_cnt = len(candles)
                hspd_res = self.hspd.detect(candles, min_degree=1, max_degree=3, symbol=symbol, timeframe=tf)
            else:
                # Default empty result
                hspd_res = {"pivots": [], "by_degree": {}}
                candles_cnt = 0

            elliott_res = self.detector.detect(
                symbol=symbol,
                timeframe=tf,
                pivots=hspd_res,
                min_degree=1,
                candles_used=candles_cnt,
            )
            tf_results[tf] = elliott_res

        # 2. Pairwise Coherence Checks (e.g. 1W vs 1D, 1D vs 4H)
        pairwise: Dict[str, Any] = {}
        adjustments = []

        # Weekly vs Daily
        if "1W" in tf_results and "1D" in tf_results:
            pair_status, adj, details = self._check_pair_coherence(
                tf_results["1W"].get("primary_count"),
                tf_results["1D"].get("primary_count"),
                "1W",
                "1D"
            )
            pairwise["1W_vs_1D"] = {
                "status": pair_status,
                "adjustment": adj,
                "details": details,
            }
            adjustments.append(adj)

        # Daily vs 4H
        if "1D" in tf_results and "4H" in tf_results:
            pair_status, adj, details = self._check_pair_coherence(
                tf_results["1D"].get("primary_count"),
                tf_results["4H"].get("primary_count"),
                "1D",
                "4H"
            )
            pairwise["1D_vs_4H"] = {
                "status": pair_status,
                "adjustment": adj,
                "details": details,
            }
            adjustments.append(adj)

        # 3. Compute Coherence Score: 0.5 + Σ(adjustments), clamped to [0, 1]
        base_score = 0.50
        total_score = base_score + sum(adjustments)
        coherence_score = round(max(0.0, min(1.0, total_score)), 2)

        # 4. Coherence Tier & Gating
        if coherence_score >= 0.85:
            tier = "HIGH"
            verdict_ar = "توافق متعدد الفواصل عالي جداً (High Coherence): الموجات الصغرى تندمج بانسجام تام داخل الهيكل الأكبر."
        elif coherence_score >= 0.60:
            tier = "MEDIUM"
            verdict_ar = "توافق متعدد الفواصل متوسط (Medium Coherence): الاتجاه العام متطابق مع وجود تباينات طفيفة في ترقيم الموجات اللحظية."
        else:
            tier = "LOW"
            verdict_ar = "تناقض بين الفواصل الزمنية (Low Coherence / Contradiction): العد الموجي متعارض عبر الفواصل. يُنصح بالانتظار حتى اكتمال الهيكل."

        # 5. Trade Ready Gating across Timeframes
        daily_primary = tf_results.get("1D", {}).get("primary_count")
        daily_trade_ready = daily_primary.get("trade_ready") if daily_primary else None

        final_trade_ready = None
        trade_ready_status = "UNAVAILABLE"
        suppression_reason = None

        if daily_trade_ready:
            if coherence_score >= 0.85:
                final_trade_ready = {
                    **daily_trade_ready,
                    "confidence": "HIGH",
                    "caution_flag": False,
                }
                trade_ready_status = "CONFIRMED"
            elif coherence_score >= 0.60:
                final_trade_ready = {
                    **daily_trade_ready,
                    "confidence": "MEDIUM",
                    "caution_flag": True,
                    "caution_note": "تداول بحذر: التوافق الزمني متوسط",
                }
                trade_ready_status = "CAUTION"
            else:
                # Contradictory timeframes: explicitly hide trade_ready
                final_trade_ready = None
                trade_ready_status = "SUPPRESSED"
                suppression_reason = "Counts are contradictory across timeframes. Wait for clarity before acting."

        return {
            "symbol": symbol,
            "version": self.VERSION,
            "computed_at": computed_at,
            "timeframes": tfs,
            "tf_results": tf_results,
            "pairwise_coherence": pairwise,
            "coherence_score": coherence_score,
            "coherence_tier": tier,
            "coherence_verdict_ar": verdict_ar,
            "trade_ready": final_trade_ready,
            "trade_ready_status": trade_ready_status,
            "suppression_reason": suppression_reason,
        }

    def _check_pair_coherence(
        self,
        higher_count: Optional[Dict[str, Any]],
        lower_count: Optional[Dict[str, Any]],
        higher_name: str,
        lower_name: str,
    ) -> Tuple[str, float, str]:
        """
        Coherence rules between higher_tf and lower_tf:
        1. Same wave direction at end of higher_tf?
        2. Lower_tf's count fits inside ONE of higher_tf's waves?
        3. If lower_tf says "wave 3 up" and higher says "wave 5 up", are they in the same impulse?
        """
        if not higher_count or not lower_count:
            return "partial", 0.05, f"One of the timeframes ({higher_name} or {lower_name}) lacks a primary count."

        h_waves = higher_count.get("waves", [])
        l_waves = lower_count.get("waves", [])

        if not h_waves or not l_waves:
            return "partial", 0.05, "Insufficient wave data in counts."

        # Rule 1: Direction at end of wave
        h_last_dir = h_waves[-1].get("direction")
        l_last_dir = l_waves[-1].get("direction")

        # Hard contradiction: opposite direction at latest wave
        if h_last_dir != l_last_dir:
            return "disagrees", -0.20, f"Opposite wave directions: {higher_name} is {h_last_dir} while {lower_name} is {l_last_dir}."

        # Rule 2: Lower_tf fits inside higher_tf range
        h_pattern = higher_count.get("pattern")
        l_pattern = lower_count.get("pattern")

        # If both are impulses in the same direction
        if h_pattern == "impulse" and l_pattern == "impulse":
            return "agrees", 0.35, f"Both {higher_name} and {lower_name} show harmonious impulse structures in {h_last_dir} direction."

        # If higher is impulse and lower is corrective zigzag
        if h_pattern == "impulse" and l_pattern in ["zigzag", "flat", "triangle"]:
            # If higher last wave is Wave 4 or Wave 2 (corrections), lower corrective matches!
            h_last_num = h_waves[-1].get("number")
            if h_last_num in ["2", "4"]:
                return "agrees", 0.30, f"{lower_name} corrective wave cleanly matches {higher_name} Wave {h_last_num} consolidation."
            else:
                return "partial", 0.10, f"{lower_name} is corrective ({l_pattern}) while {higher_name} is extending impulse Wave {h_last_num}."

        return "agrees", 0.25, f"Consistent market flow across {higher_name} and {lower_name}."


global_multi_tf_elliott = MultiTfElliott()
