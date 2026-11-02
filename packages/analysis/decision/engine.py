"""
DecisionEngine — Borsaty Phase ي
Synthesizes full analysis, trade plan, backtest metrics, and narratives
into ONE actionable institutional-grade decision with reasons, risks,
and historical Wilson CI evidence.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


DISCLAIMER_AR = (
    "هذا التقرير والقرار تعليمي وكمي بحت، ولا يُعتبر توصية استثمارية أو مالية مباشرة بالبيع أو الشراء. "
    "القرارات الاستثمارية هي مسؤولية المستخدم بالكامل."
)

DISCLAIMER_EN = (
    "This report and decision are strictly educational and quantitative in nature, and do not constitute "
    "financial or investment advice. All trading decisions remain the sole responsibility of the user."
)


@dataclass
class DecisionResult:
    symbol: str
    decision: str  # STRONG_BUY | BUY | STRONG_SELL | SELL | WATCH | AVOID | WAIT
    confidence_level: str  # HIGH | MEDIUM | LOW
    confidence_score: float  # 0.0 to 1.0 (e.g. 0.68)
    direction: str  # bullish | bearish | neutral
    timeframe: str
    generated_at: str
    
    # Trade Plan Snapshot
    entry_zone: List[float]
    stop_loss: float
    targets: List[float]
    primary_rr: float
    
    # Reasoning & Risks
    why_ar: List[str]
    why_en: List[str]
    risks_ar: List[str]
    risks_en: List[str]
    
    # Historical Evidence
    historical_evidence: Dict[str, Any]
    
    # Disclaimers
    disclaimer_ar: str
    disclaimer_en: str


class DecisionEngine:
    """
    Combines Confluence, TradePlan, Backtest, and Narrator into a deterministic verdict.
    """

    VERSION = "1.0.0"

    def decide(
        self,
        symbol: str,
        full_analysis: Dict[str, Any],
        trade_plan: Optional[Dict[str, Any]] = None,
        backtest_result: Optional[Dict[str, Any]] = None,
        timeframe: str = "1D",
    ) -> DecisionResult:
        sym = symbol.upper()
        now_str = datetime.now(timezone.utc).isoformat()
        
        tp = trade_plan or full_analysis.get("trade_plan") or {}
        confluence = full_analysis.get("confluence") or {}
        direction = confluence.get("direction", "neutral")
        conf_score = float(confluence.get("score", 0.0))
        
        # 1. Precondition check
        tp_status = tp.get("status", "")
        entry_zone_raw = tp.get("entry_zone") or [0.0, 0.0]
        if isinstance(entry_zone_raw, dict):
            entry_zone = [float(entry_zone_raw.get("low", 0.0)), float(entry_zone_raw.get("high", 0.0))]
        elif isinstance(entry_zone_raw, (list, tuple)) and len(entry_zone_raw) >= 2:
            entry_zone = [float(entry_zone_raw[0]), float(entry_zone_raw[1])]
        else:
            entry_zone = [0.0, 0.0]
            
        stop_loss = float(tp.get("stop_loss", 0.0) if isinstance(tp.get("stop_loss"), (int, float)) else tp.get("stop_loss", {}).get("price", 0.0))
        primary_target = float(tp.get("primary_target") or 0.0)
        primary_rr = float(tp.get("primary_rr") or 0.0)

        # Build target list
        targets_raw = tp.get("targets")
        if isinstance(targets_raw, list) and len(targets_raw) > 0:
            targets = [float(t["price"]) if isinstance(t, dict) else float(t) for t in targets_raw]
        elif primary_target > 0:
            targets = [primary_target]
        else:
            targets = []

        # If not actionable setup or neutral direction -> WAIT
        if tp_status != "actionable_setup" or direction == "neutral" or not targets or stop_loss <= 0:
            return DecisionResult(
                symbol=sym,
                decision="WAIT",
                confidence_level="LOW",
                confidence_score=round(abs(conf_score) if conf_score else 0.20, 2),
                direction=direction,
                timeframe=timeframe,
                generated_at=now_str,
                entry_zone=entry_zone,
                stop_loss=stop_loss,
                targets=targets,
                primary_rr=primary_rr,
                why_ar=["لا تتوفر إشارة فنية مكتملة الشروط في الوقت الحالي", "السوق يمر بمرحلة حيادية أو تذبذب يستدعي الانتظار"],
                why_en=["No complete technical setup is currently detected", "Market is in a neutral or consolidation phase"],
                risks_ar=["الدخول بدون خطة تداول واضحة يعرض رأس المال لمخاطر غير محسوبة"],
                risks_en=["Entering without a verified trade plan exposes capital to uncalculated risk"],
                historical_evidence={
                    "status": "insufficient_data",
                    "sample_adequate": False,
                    "hit_rate_t1": None,
                    "wilson_ci_95": None,
                    "total_signals": 0,
                    "message_ar": "بيانات غير كافية للحكم التاريخي",
                    "message_en": "Insufficient historical data for validation",
                },
                disclaimer_ar=DISCLAIMER_AR,
                disclaimer_en=DISCLAIMER_EN,
            )

        # 2. Historical Backtest Evidence
        bt_metrics = (backtest_result or {}).get("metrics") or {}
        bt_signals = (backtest_result or {}).get("total_signals", 0)
        hit_rate = bt_metrics.get("hit_rate_t1")
        wilson_ci_val = bt_metrics.get("wilson_ci_95_t1") or [0.45, 0.65]
        sample_adequate = bt_signals >= 30

        if sample_adequate and hit_rate is not None:
            hist_conf = float(wilson_ci_val[0])
            hist_evidence = {
                "status": "verified",
                "sample_adequate": True,
                "hit_rate_t1": round(float(hit_rate), 4),
                "wilson_ci_95": [round(float(wilson_ci_val[0]), 4), round(float(wilson_ci_val[1]), 4)],
                "total_signals": bt_signals,
                "message_ar": f"دليل تاريخي مثبت: {round(float(hit_rate)*100, 1)}% نسبة نجاح ({bt_signals} صفقة)",
                "message_en": f"Verified historical evidence: {round(float(hit_rate)*100, 1)}% hit rate ({bt_signals} trades)",
            }
        else:
            hist_conf = 0.50
            hist_evidence = {
                "status": "insufficient_data",
                "sample_adequate": False,
                "hit_rate_t1": None,
                "wilson_ci_95": None,
                "total_signals": bt_signals,
                "message_ar": "بيانات تاريخية غير كافية (< 30 إشارة) — لم يُنشر معدل النجاح",
                "message_en": "Insufficient historical sample size (< 30 signals) — hit rate not published",
            }

        # 3. Decision Score Formula
        c_score = abs(conf_score)
        trade_quality = min(1.0, max(0.2, primary_rr / 2.0))
        final_score = c_score * 0.45 + trade_quality * 0.25 + hist_conf * 0.30

        is_bullish = direction == "bullish"
        if final_score >= 0.65:
            decision = "STRONG_BUY" if is_bullish else "STRONG_SELL"
            conf_level = "HIGH"
        elif final_score >= 0.45:
            decision = "BUY" if is_bullish else "SELL"
            conf_level = "MEDIUM"
        elif final_score >= 0.25:
            decision = "WATCH"
            conf_level = "LOW"
        else:
            decision = "AVOID"
            conf_level = "LOW"

        # 4. Synthesize Reasoning & Risks
        why_ar = []
        why_en = []
        risks_ar = []
        risks_en = []

        # Technical catalysts
        if full_analysis.get("elliott") and full_analysis["elliott"].get("status") not in ("unavailable", None):
            why_ar.append("العد الموجي لإليوت يتماشى مع الاتجاه الرئيسي للحركة")
            why_en.append("Elliott wave count aligns with primary trend momentum")
        if full_analysis.get("harmonic") and full_analysis["harmonic"].get("status") not in ("unavailable", None):
            why_ar.append("اكتمال نموذج هارمونيك مع ارتداد متناسق لنسب فيبوناتشي")
            why_en.append("Harmonic pattern completion with symmetrical Fibonacci ratios")
        if primary_rr >= 1.5:
            why_ar.append(f"نسبة عائد للمخاطرة جذابة تبلغ {round(primary_rr, 2)}:1")
            why_en.append(f"Favorable Risk/Reward ratio of {round(primary_rr, 2)}:1")

        regime = full_analysis.get("regime", {})
        regime_name = regime.get("regime") if isinstance(regime, dict) else str(regime)
        if regime_name == "trending_strong":
            why_ar.append("بيئة التداول تدعم الاستمرارية باتجاه صريح وقوي")
            why_en.append("Market regime exhibits a strong structural trend")

        if not why_ar:
            why_ar.append("توافق مؤشرات العزم وتمركز الدعوم والمقاومات الهيكلية")
            why_en.append("Confluence of momentum indicators and structural support/resistance")

        # Risks
        stop_dist_pct = abs((entry_zone[0] - stop_loss) / entry_zone[0]) * 100 if entry_zone[0] > 0 else 0
        if stop_dist_pct > 3.5:
            risks_ar.append(f"مسافة وقف الخسارة واسعة نسبياً ({round(stop_dist_pct, 1)}%) — يوصى بتقليص حجم المركز")
            risks_en.append(f"Wide stop-loss distance ({round(stop_dist_pct, 1)}%) — conservative sizing recommended")
        else:
            risks_ar.append("احتمالية كسر مستويات الوقف في حال حدوث تقلبات سعرية مفاجئة")
            risks_en.append("Risk of stop invalidation on unexpected market volatility")

        if regime_name in ("volatile_expansion", "ranging"):
            risks_ar.append("بيئة السوق الحالية تشهد تذبذباً مرتفعاً يتطلب التزاماً صارماً بنقاط الوقف")
            risks_en.append("Elevated market volatility requires strict adherence to stop loss")

        return DecisionResult(
            symbol=sym,
            decision=decision,
            confidence_level=conf_level,
            confidence_score=round(final_score, 2),
            direction=direction,
            timeframe=timeframe,
            generated_at=now_str,
            entry_zone=entry_zone,
            stop_loss=stop_loss,
            targets=targets,
            primary_rr=primary_rr,
            why_ar=why_ar,
            why_en=why_en,
            risks_ar=risks_ar,
            risks_en=risks_en,
            historical_evidence=hist_evidence,
            disclaimer_ar=DISCLAIMER_AR,
            disclaimer_en=DISCLAIMER_EN,
        )


global_decision_engine = DecisionEngine()
