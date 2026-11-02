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
    ):
        self.regime_det = regime_detector or global_regime_detector
        self.hspd = hspd_engine or global_hspd_engine
        self.elliott = elliott_detector or global_elliott_detector
        self.harmonic = harmonic_detector or global_harmonic_detector
        self.classical = classical_detector or global_classical_detector
        self.indicators = indicator_engine or global_indicator_engine
        self.confluence = confluence_engine or global_confluence_engine

    def run(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
        min_degree: int = 1,
    ) -> Dict[str, Any]:
        """
        Runs the end-to-end unified analysis pipeline over candlestick data.
        Returns FullAnalysis dictionary with all sub-results and confluence verdict.
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
                "execution_ms": round((time.time() - t0) * 1000.0, 2),
            }

        # 1. Detect Regime (informs weights)
        regime = self.regime_det.detect(sym, tf, candles)

        # 2. Derive HSPD Pivots (foundation for Elliott, Harmonic, Classical, Structure)
        pivots = self.hspd.detect(candles, min_degree=0, max_degree=3)

        # 3. Run Independent Engines
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
            "execution_ms": elapsed_ms,
        }


global_orchestrator = AnalysisOrchestrator()
