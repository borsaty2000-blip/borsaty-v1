"""
Unified Analysis Orchestrator Engine (Borsaty).
Runs all 4 analytical engines, detects market regime, and derives unified confluence.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
import time

from engines.hspd import HSPDEngine, global_hspd_engine
from regime.detector import RegimeDetector, global_regime_detector
from elliott.detector import ElliottDetector, global_elliott_detector
from harmonic.detector import HarmonicDetector, global_harmonic_detector
from classical.detector import ClassicalPatternDetector, global_classical_detector
from engines.indicator_engine import IndicatorEngine, global_indicator_engine
from confluence.engine import ConfluenceEngine, global_confluence_engine
from trade_plan.engine import TradePlanEngine, global_trade_plan_engine
from narrator.engine import NarratorEngine, global_narrator_engine


class AnalysisOrchestrator:
    """
    Coordinates all underlying Borsaty engines:
    1. RegimeDetector (detects market volatility & trend regime)
    2. HSPDEngine (derives hierarchical structural pivots)
    3. ElliottDetector (rule-first wave derivation)
    4. HarmonicDetector (Fibonacci-gated XABCD patterns + PRZ)
    5. ClassicalPatternDetector (5-gate chart pattern recognition)
    6. IndicatorEngine (21 multi-category quantitative indicators)
    7. ConfluenceEngine (regime-aware weighted verdict)
    """

    VERSION = "1.0.0"

    def __init__(
        self,
        regime_detector: Optional[RegimeDetector] = None,
        hspd_engine: Optional[HSPDEngine] = None,
        elliott_detector: Optional[ElliottDetector] = None,
        harmonic_detector: Optional[HarmonicDetector] = None,
        classical_detector: Optional[ClassicalPatternDetector] = None,
        indicator_engine: Optional[IndicatorEngine] = None,
        confluence_engine: Optional[ConfluenceEngine] = None,
        trade_plan_engine: Optional[TradePlanEngine] = None,
        narrator_engine: Optional[NarratorEngine] = None,
    ):
        self.regime_det = regime_detector or global_regime_detector
        self.hspd = hspd_engine or global_hspd_engine
        self.elliott = elliott_detector or global_elliott_detector
        self.harmonic = harmonic_detector or global_harmonic_detector
        self.classical = classical_detector or global_classical_detector
        self.indicators = indicator_engine or global_indicator_engine
        self.confluence = confluence_engine or global_confluence_engine
        self.trade_plan = trade_plan_engine or global_trade_plan_engine
        self.narrator = narrator_engine or global_narrator_engine

    def run(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
        min_degree: int = 1,
        fast_mode: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs the end-to-end unified analysis pipeline over candlestick data.
        Returns FullAnalysis dictionary with all sub-results and confluence verdict.
        If fast_mode=True, skips heavy engines (Elliott, Harmonic, Classical, Narrator)
        and runs only core quantitative/HSPD/Indicators/Confluence/TradePlan.
        """
        t0 = time.time()
        sym = symbol.upper()
        tf = timeframe.upper()
        computed_at = datetime.now(timezone.utc).isoformat()

        if not candles or len(candles) < 5:
            return {
                "symbol": sym,
                "timeframe": tf,
                "version": self.VERSION,
                "computed_at": computed_at,
                "status": "unavailable",
                "status_reason": "insufficient_candles",
                "status_message_ar": "البيانات التاريخية غير كافية لتنفيذ التحليل الموحد (الحد الأدنى 5 شموع)",
                "status_message_en": "Insufficient historical candle bars to perform unified analysis (minimum 5 required)",
                "regime": None,
                "pivots": [],
                "elliott": None,
                "harmonic": None,
                "classical": None,
                "indicators": {},
                "confluence": None,
                "trade_plan": None,
                "narrative_ar": None,
                "narrative_en": None,
                "execution_ms": round((time.time() - t0) * 1000.0, 2),
            }

        # 1. Detect Regime (informs weights)
        regime = self.regime_det.detect(sym, tf, candles)

        # 2. Derive HSPD Pivots (foundation for Elliott, Harmonic, Classical, Structure)
        pivots = self.hspd.detect(candles, min_degree=0, max_degree=3)

        # 3. Run Independent Engines (skip heavy engines in fast_mode)
        if fast_mode:
            elliott_res = None
            harmonic_res = None
            classical_res = None
        else:
            elliott_res = self.elliott.detect(sym, tf, pivots, min_degree=min_degree)
            harmonic_res = self.harmonic.detect(sym, tf, pivots, min_degree=min_degree, candles=candles)
            classical_res = self.classical.detect(sym, tf, pivots, candles=candles, min_degree=min_degree)

        indicators_res = self.indicators.compute_all(sym, tf, candles)

        # 4. Compute Regime-Aware Confluence
        engine_outputs = {
            "elliott": elliott_res,
            "harmonic": harmonic_res,
            "classical": classical_res,
            "indicators": indicators_res,
            "hspd": pivots,
        }

        confluence_res = self.confluence.compute(
            symbol=sym,
            timeframe=tf,
            engine_outputs=engine_outputs,
            regime=regime,
            candles=candles,
        )

        # 5. Compute Unified Trade Plan
        trade_plan_full = self.trade_plan.compute(
            symbol=sym,
            timeframe=tf,
            full_analysis={
                "symbol": sym,
                "timeframe": tf,
                "candles": candles,
                "regime": regime,
                "pivots": pivots,
                "elliott": elliott_res,
                "harmonic": harmonic_res,
                "classical": classical_res,
                "indicators": indicators_res,
                "confluence": confluence_res,
            },
            candles=candles,
        )

        trade_plan_summary = {
            "status": trade_plan_full["status"],
            "status_reason": trade_plan_full["status_reason"],
            "direction": trade_plan_full["direction"],
            "entry_zone": trade_plan_full["entry_zone"],
            "stop_loss": trade_plan_full["stop_loss"]["price"],
            "primary_target": trade_plan_full["targets"][0]["price"] if trade_plan_full["targets"] else None,
            "primary_rr": trade_plan_full["risk_reward"]["primary_rr"],
            "targets_count": len(trade_plan_full["targets"]),
        }

        # 6. Generate Dual Original Narratives (Arabic & English) (skip in fast_mode)
        if fast_mode:
            narrative_ar = None
            narrative_en = None
        else:
            narrative_payload = {
                "symbol": sym,
                "timeframe": tf,
                "candles": candles,
                "regime": regime,
                "pivots": pivots,
                "elliott": elliott_res,
                "harmonic": harmonic_res,
                "classical": classical_res,
                "indicators": indicators_res,
                "confluence": confluence_res,
                "trade_plan": trade_plan_full,
            }
            narrative_ar = self.narrator.narrate(narrative_payload, language="ar", style="professional")
            narrative_en = self.narrator.narrate(narrative_payload, language="en", style="professional")

        elapsed_ms = round((time.time() - t0) * 1000.0, 2)

        return {
            "symbol": sym,
            "timeframe": tf,
            "version": self.VERSION,
            "computed_at": computed_at,
            "status": "available",
            "regime": regime,
            "pivots": pivots,
            "elliott": elliott_res,
            "harmonic": harmonic_res,
            "classical": classical_res,
            "indicators": indicators_res,
            "confluence": confluence_res,
            "trade_plan": trade_plan_summary,
            "narrative_ar": narrative_ar,
            "narrative_en": narrative_en,
            "execution_ms": elapsed_ms,
        }


global_orchestrator = AnalysisOrchestrator()
