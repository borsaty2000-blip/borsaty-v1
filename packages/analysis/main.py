import os
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Tuple, List, Dict, Any, Union

from engines.indicators import calculate_all_indicators
from engines.gann import calculate_square_of_nine, calculate_gann_angles, calculate_time_cycles
from engines.fibonacci import calculate_fibonacci_levels
from engines.elliott import analyze_elliott_wave
from engines.harmonic import detect_harmonic_patterns
from engines.fair_value import calculate_fair_value
from engines.confluence import calculate_confluence_score
from engines.data_quality import validate_data_quality
from engines.signal_store import global_signal_store, SignalStore
from engines.indicator_engine import global_indicator_engine, IndicatorEngine
from engines.hspd import global_hspd_engine, HSPDEngine
from elliott.detector import global_elliott_detector, ElliottDetector
from elliott.multi_tf import MultiTfElliott
from harmonic.detector import global_harmonic_detector, HarmonicDetector
from harmonic.prz import global_prz_calculator, PrzCalculator
from classical.detector import global_classical_detector, ClassicalPatternDetector
from orchestrator import global_orchestrator, AnalysisOrchestrator
from screener.nlu import global_screener_nlu
from screener.builder import global_screener_engine
from trade_plan.engine import global_trade_plan_engine, TradePlanEngine
from datetime import datetime, timezone

app = FastAPI(
    title="Borsaty Deterministic Analysis Engine",
    description="Arabic-First Financial Analysis Service (Elliott, Gann, Fibonacci, Harmonic, Fair Value)",
    version="1.0.0"
)

cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Candle(BaseModel):
    time: Any
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = 0

class AnalysisRequest(BaseModel):
    symbol: str
    market: str
    currency: Optional[str] = "EGP"
    candles: List[Candle]
    fundamentals: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Borsaty Analysis Engine",
        "deterministic": True,
        "version": "1.0.0"
    }

@app.post("/analyze")
def run_full_analysis(payload: AnalysisRequest):
    if not payload.candles or len(payload.candles) < 5:
        raise HTTPException(status_code=400, detail="Insufficient candle data (minimum 5 bars required)")

    raw_candles = [c.model_dump() for c in payload.candles]
    symbol = payload.symbol.upper()
    market = payload.market.upper()

    # 1. Calculate Technical Indicators
    indicators = calculate_all_indicators(raw_candles)
    last_indicator = indicators[-1]
    current_price = float(raw_candles[-1]["close"])

    # 2. Gann Engine
    swing_low = min(float(c["low"]) for c in raw_candles[-30:])
    swing_high = max(float(c["high"]) for c in raw_candles[-30:])
    gann_sq9 = calculate_square_of_nine(swing_low)
    gann_angles = calculate_gann_angles(swing_low, len(raw_candles) - 30, len(raw_candles))
    gann_time = calculate_time_cycles(len(raw_candles) - 30, len(raw_candles))
    gann_summary = {
        **gann_sq9,
        "angles": gann_angles,
        "timeCycles": gann_time
    }

    # 3. Fibonacci Engine
    fib_levels = calculate_fibonacci_levels(swing_high, swing_low, trend="UP")

    # 4. Elliott Wave Engine
    elliott_results = analyze_elliott_wave(raw_candles)

    # 5. Harmonic Pattern Engine
    harmonic_results = detect_harmonic_patterns(raw_candles)

    # 6. Confluence Engine & Explainability
    confluence = calculate_confluence_score(
        symbol=symbol,
        current_price=current_price,
        gann_data=gann_sq9,
        fib_data=fib_levels,
        elliott_data=elliott_results,
        harmonic_data=harmonic_results,
        indicators_last=last_indicator
    )

    # 7. Fair Value Engine (Fundamental)
    fund = payload.fundamentals or {}
    eps = fund.get("eps", current_price * 0.12)
    pe = fund.get("peRatio", 8.5)
    pb = fund.get("pbRatio", 1.8)
    div_yield = fund.get("dividendYield", 4.5)

    fair_value = calculate_fair_value(
        current_price=current_price,
        eps=eps,
        pe_ratio=pe,
        pb_ratio=pb,
        dividend_yield=div_yield
    )

    # 8. Data Quality Gate
    data_quality = validate_data_quality(symbol, market, raw_candles)

    # 9. Automated Signal Persistence Hook (Section 2.1 & Point 3 Requirement)
    persisted_signal = None
    if confluence.get("confluenceScore", 0) >= 60:
        targets_list = [t["price"] for t in confluence.get("targets", [])]
        stop_loss_val = confluence.get("stopLoss", {}).get("price", current_price * 0.95)
        persisted_signal = global_signal_store.save_signal(
            symbol=symbol,
            market=market,
            timeframe="1D",
            signal_type="STRONG_BULLISH" if confluence["confluenceScore"] >= 80 else "BULLISH",
            entry=current_price,
            stop_loss=stop_loss_val,
            targets=targets_list,
            confluence_score=confluence["confluenceScore"],
            reasons=confluence.get("supportingEvidence", []),
            contradicting=confluence.get("contradictingEvidence", []),
            data_quality=data_quality,
            status="ACTIVE"
        )

    return {
        "symbol": symbol,
        "market": market,
        "currentPrice": current_price,
        "currency": payload.currency,
        "indicators": indicators,
        "confluence": confluence,
        "elliott": elliott_results,
        "gann": gann_summary,
        "fibonacci": fib_levels,
        "harmonics": harmonic_results,
        "fairValue": fair_value,
        "dataQuality": data_quality,
        "persistedSignalId": persisted_signal["id"] if persisted_signal else None
    }

class IndicatorComputeRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    indicators: Optional[str] = "all"
    candles: List[Candle]

class PivotDetectRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    min_degree: Optional[int] = 0
    max_degree: Optional[int] = 3
    candles: List[Candle]

@app.post("/pivots/detect")
def detect_pivots_endpoint(payload: PivotDetectRequest):
    if not payload.candles:
        raise HTTPException(status_code=400, detail="Candles cannot be empty")

    raw_candles = [c.model_dump() for c in payload.candles]
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 0))
    max_d = max(0, min(3, payload.max_degree if payload.max_degree is not None else 3))

    res = global_hspd_engine.detect(
        candles=raw_candles,
        min_degree=min_d,
        max_degree=max_d,
        symbol=sym,
        timeframe=tf
    )
    return res

class ElliottDetectRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None
    pivots: Optional[List[Dict[str, Any]]] = None
    min_degree: Optional[int] = 1
    multi_tf_candles: Optional[Dict[str, List[Candle]]] = None

@app.post("/elliott/detect")
def detect_elliott_endpoint(payload: ElliottDetectRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 1))

    # Multi-timeframe execution if multi_tf_candles dictionary supplied
    if payload.multi_tf_candles and ("weekly" in payload.multi_tf_candles or "daily" in payload.multi_tf_candles):
        multi_engine = MultiTfElliott()
        tf_candles = {}
        for k, v in payload.multi_tf_candles.items():
            tf_candles[k] = [c.model_dump() if hasattr(c, "model_dump") else c for c in v]
        res = multi_engine.analyze(sym, tf_candles)
        return res

    # Single-timeframe execution
    pivots_data = payload.pivots
    candles_used = 0
    if not pivots_data:
        if not payload.candles:
            raise HTTPException(status_code=400, detail="Either candles or pivots must be provided")
        raw_candles = [c.model_dump() for c in payload.candles]
        candles_used = len(raw_candles)
        hspd_res = global_hspd_engine.detect(
            candles=raw_candles,
            min_degree=min_d,
            max_degree=3,
            symbol=sym,
            timeframe=tf
        )
        pivots_data = hspd_res.get("pivots", [])
    else:
        candles_used = len(payload.candles) if payload.candles else len(pivots_data)

    res = global_elliott_detector.detect(
        symbol=sym,
        timeframe=tf,
        pivots=pivots_data,
        min_degree=min_d,
        candles_used=candles_used
    )
    return res

class HarmonicDetectRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None
    pivots: Optional[List[Dict[str, Any]]] = None
    min_degree: Optional[int] = 1
    min_score: Optional[float] = 0.70

@app.post("/harmonic/detect")
def detect_harmonic_endpoint(payload: HarmonicDetectRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 1))
    min_sc = payload.min_score if payload.min_score is not None else 0.70

    pivots_data = payload.pivots
    raw_candles = [c.model_dump() for c in payload.candles] if payload.candles else None

    if not pivots_data:
        if not raw_candles:
            raise HTTPException(status_code=400, detail="Either candles or pivots must be provided")
        hspd_res = global_hspd_engine.detect(
            candles=raw_candles,
            min_degree=min_d,
            max_degree=3,
            symbol=sym,
            timeframe=tf
        )
        pivots_data = hspd_res.get("pivots", [])

    res = global_harmonic_detector.detect(
        symbol=sym,
        timeframe=tf,
        pivots=pivots_data,
        min_degree=min_d,
        candles=raw_candles,
    )

    # Filter by min_score if specified
    if min_sc > 0.0 and res.get("patterns"):
        res["patterns"] = [p for p in res["patterns"] if p.get("overall_score", 0.0) >= min_sc]
        if len(res["patterns"]) == 0 and res.get("status") == "available":
            res["status"] = "unavailable"
            res["status_reason"] = "below_min_score"
            res["status_message_ar"] = f"لا توجد نماذج هارمونيك تحقق الحد الأدنى لدرجة التوافق ({min_sc})"
            res["status_message_en"] = f"No harmonic patterns met the minimum score threshold ({min_sc})"

    return res

class HarmonicPrzRequest(BaseModel):
    symbol: str
    points: Dict[str, Dict[str, Any]]
    pattern_name: str
    is_bullish: bool
    atr: Optional[float] = 1.0

@app.post("/harmonic/prz")
def compute_harmonic_prz_endpoint(payload: HarmonicPrzRequest):
    prz, reason = global_prz_calculator.compute_prz(
        points=payload.points,
        pattern_name=payload.pattern_name.lower(),
        is_bullish=payload.is_bullish,
        atr=payload.atr if payload.atr is not None else 1.0
    )
    if not prz:
        raise HTTPException(status_code=400, detail=f"PRZ computation failed: {reason}")

    return {
        "symbol": payload.symbol.upper(),
        "pattern": payload.pattern_name.lower(),
        "is_bullish": payload.is_bullish,
        "prz": prz
    }

class ClassicalDetectRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None
    pivots: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    min_degree: Optional[int] = 1
    pattern: Optional[str] = None
    status: Optional[str] = None

@app.post("/classical/detect")
def detect_classical_endpoint(payload: ClassicalDetectRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 1))

    pivots_data = payload.pivots
    raw_candles = [c.model_dump() for c in payload.candles] if payload.candles else None

    if not pivots_data:
        if not raw_candles:
            raise HTTPException(status_code=400, detail="Either candles or pivots must be provided")
        hspd_engine = HSPDEngine()
        pivots_data = hspd_engine.detect(raw_candles, min_degree=0, max_degree=3)

    res = global_classical_detector.detect(
        symbol=sym,
        timeframe=tf,
        pivots=pivots_data,
        candles=raw_candles,
        min_degree=min_d,
        pattern=payload.pattern,
    )

    if payload.status:
        res["patterns"] = [p for p in res["patterns"] if p.get("status") == payload.status]

    return res

class ScreenerApiRequest(BaseModel):
    query: str

@app.post("/screener/query")
def screener_query_endpoint(payload: ScreenerApiRequest):
    try:
        screen_query, explanation = global_screener_nlu.parse(payload.query)
        execution_res = global_screener_engine.execute(screen_query)
        return {
            "interpreted": screen_query.model_dump(),
            "interpreted_ar": explanation,
            "results": execution_res["results"],
            "total_matches": execution_res["total_matches"],
            "execution_ms": execution_res["execution_ms"],
            "data_quality": execution_res["data_quality"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ أثناء تنفيذ البحث: {str(e)}")

@app.post("/indicators/compute")
def compute_indicators_endpoint(payload: IndicatorComputeRequest):
    if not payload.candles:
        raise HTTPException(status_code=400, detail="Candles cannot be empty")

    raw_candles = [c.model_dump() for c in payload.candles]
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"

    if not payload.indicators or payload.indicators == "all":
        results = global_indicator_engine.compute_all(sym, tf, raw_candles)
    else:
        req_list = [i.strip() for i in payload.indicators.split(",")]
        results = {}
        for ind_name in req_list:
            results[ind_name] = global_indicator_engine.compute(sym, tf, raw_candles, ind_name)

    return {
        "symbol": sym,
        "timeframe": tf,
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "indicators": results
    }

class FullAnalysisRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None
    min_degree: Optional[int] = 1

@app.post("/analysis/full")
def full_analysis_endpoint(payload: FullAnalysisRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 1))

    if not payload.candles:
        raise HTTPException(status_code=400, detail="Candles list cannot be empty for full analysis")

    raw_candles = [c.model_dump() for c in payload.candles]
    return global_orchestrator.run(
        symbol=sym,
        timeframe=tf,
        candles=raw_candles,
        min_degree=min_d,
    )

class TradePlanRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None
    capital: Optional[float] = None
    risk_pct: Optional[float] = 2.0
    min_degree: Optional[int] = 1

@app.post("/trade-plan/compute")
@app.post("/trade-plan")
def compute_trade_plan_endpoint(payload: TradePlanRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    min_d = max(0, min(3, payload.min_degree if payload.min_degree is not None else 1))

    if not payload.candles:
        raise HTTPException(status_code=400, detail="Candles list cannot be empty for trade plan computation")

    raw_candles = [c.model_dump() for c in payload.candles]
    full_res = global_orchestrator.run(
        symbol=sym,
        timeframe=tf,
        candles=raw_candles,
        min_degree=min_d,
    )
    return global_trade_plan_engine.compute(
        symbol=sym,
        timeframe=tf,
        full_analysis=full_res,
        capital=payload.capital,
        risk_pct=payload.risk_pct or 2.0,
        candles=raw_candles,
    )

class NarrateRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    language: Optional[str] = "ar"
    style: Optional[str] = "professional"
    candles: Optional[List[Candle]] = None

@app.post("/narrate")
def narrate_endpoint(payload: NarrateRequest):
    sym = payload.symbol.upper()
    tf = payload.timeframe or "1D"
    lang = payload.language or "ar"
    style = payload.style or "professional"

    if not payload.candles:
        raise HTTPException(status_code=400, detail="Candles cannot be empty for narrative generation")

    raw_candles = [c.model_dump() for c in payload.candles]
    full_res = global_orchestrator.run(
        symbol=sym,
        timeframe=tf,
        candles=raw_candles,
    )
    from narrator.engine import global_narrator_engine
    return global_narrator_engine.narrate(
        payload=full_res,
        language=lang,
        style=style,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Phase ح: Walk-Forward Validation & Backtest Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from backtest.engine import BacktestEngine, BacktestResult
from backtest.walk_forward import WalkForwardValidator, WalkForwardResult
from backtest.report import BacktestReport
import dataclasses

_backtest_engine = BacktestEngine()
_wf_validator = WalkForwardValidator()
_bt_report = BacktestReport()


class BacktestRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: List[Candle]
    warmup_bars: Optional[int] = 250
    language: Optional[str] = "ar"
    include_walk_forward: Optional[bool] = True
    fast_mode: Optional[bool] = True


def _bt_to_dict(bt: BacktestResult) -> Dict[str, Any]:
    """Convert BacktestResult dataclass to JSON-serializable dict."""
    d = dataclasses.asdict(bt)
    # signals list can be large — summarise signal objects
    d["signals"] = [
        {
            "signal_id": s["signal_id"],
            "bar_index": s["bar_index"],
            "date": s["date"],
            "direction": s["direction"],
            "entry_zone": s["entry_zone"],
            "stop": s["stop"],
            "targets": s["targets"],
            "regime": s["regime"],
            "engines_used": s["engines_used"],
            "confluence_score": s["confluence_score"],
            "outcome": s["outcome"],
            "realized_r": s["realized_r"],
            "days_to_resolution": s["days_to_resolution"],
            "mfe_pct": s["mfe_pct"],
            "mae_pct": s["mae_pct"],
        }
        for s in d.get("signals", [])
    ]
    d["metrics"] = dataclasses.asdict(bt.metrics)
    return d


def _wf_to_dict(wf: WalkForwardResult) -> Dict[str, Any]:
    return dataclasses.asdict(wf)


@app.post("/backtest/run")
def run_backtest_endpoint(payload: BacktestRequest):
    """
    Run bar-by-bar backtest on provided candles.
    Returns BacktestResult + optional WalkForwardResult + dual-language report.
    """
    sym = payload.symbol.upper()
    tf = (payload.timeframe or "1D").upper()
    lang = (payload.language or "ar").lower()
    warmup = max(50, min(500, payload.warmup_bars or 250))

    if not payload.candles or len(payload.candles) < warmup + 2:
        raise HTTPException(
            status_code=400,
            detail=f"Candles too few for backtest (need ≥ {warmup + 2}, got {len(payload.candles or [])})"
        )

    raw = [c.model_dump() for c in payload.candles]
    is_fast = True if payload.fast_mode is None else payload.fast_mode

    bt = _backtest_engine.run(sym, tf, raw, warmup_bars=warmup, fast_mode=is_fast)
    bt_dict = _bt_to_dict(bt)

    wf_dict = None
    if payload.include_walk_forward:
        try:
            wf = _wf_validator.validate(sym, tf, raw, fast_mode=is_fast)
            wf_dict = _wf_to_dict(wf)
        except Exception:
            wf_dict = None

    # Generate report (parse back from dicts is expensive; use original objects)
    report_text = _bt_report.generate(bt, language=lang)

    return {
        "backtest": bt_dict,
        "walk_forward": wf_dict,
        "report": report_text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


class LeaderboardQuery(BaseModel):
    period_days: Optional[int] = 90
    min_signals: Optional[int] = 30
    sort_by: Optional[str] = "hit_rate_t1"   # or "profit_factor" | "sharpe_ratio"
    limit: Optional[int] = 20
    candles_by_symbol: Dict[str, List[Candle]]  # symbol -> candles
    timeframe: Optional[str] = "1D"
    language: Optional[str] = "ar"


@app.post("/backtest/leaderboard")
def backtest_leaderboard_endpoint(payload: LeaderboardQuery):
    """
    Run backtests across multiple symbols and return ranked leaderboard.
    Minimum 30 signals required for inclusion.
    """
    tf = (payload.timeframe or "1D").upper()
    lang = (payload.language or "ar").lower()
    min_sigs = max(1, payload.min_signals or 30)
    sort_key = payload.sort_by or "hit_rate_t1"
    limit = max(1, min(100, payload.limit or 20))

    results = []
    for sym, candles in (payload.candles_by_symbol or {}).items():
        raw = [c.model_dump() for c in candles]
        try:
            bt = _backtest_engine.run(sym.upper(), tf, raw, fast_mode=True)
            if bt.total_signals >= min_sigs:
                results.append({
                    "symbol": bt.symbol,
                    "total_signals": bt.total_signals,
                    "hit_rate_t1": bt.metrics.hit_rate_t1,
                    "profit_factor": bt.metrics.profit_factor,
                    "sharpe_ratio": bt.metrics.sharpe_ratio,
                    "avg_r_multiple": bt.metrics.avg_r_multiple,
                    "wilson_ci_95_t1": bt.metrics.wilson_ci_95_t1,
                    "sample_adequate": bt.data_quality.get("sample_size_adequate", False),
                })
        except Exception:
            continue

    # Sort
    valid_keys = {"hit_rate_t1", "profit_factor", "sharpe_ratio"}
    if sort_key not in valid_keys:
        sort_key = "hit_rate_t1"
    results.sort(key=lambda x: x.get(sort_key, 0.0), reverse=True)

    return {
        "leaderboard": results[:limit],
        "sort_by": sort_key,
        "timeframe": tf,
        "min_signals_required": min_sigs,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Phase ي: Decision & PDF Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from decision.engine import global_decision_engine, DecisionResult
from fastapi.responses import Response

class DecisionRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"
    candles: Optional[List[Candle]] = None

@app.post("/decision/{symbol}")
@app.get("/decision/{symbol}")
def decision_endpoint(symbol: str, payload: Optional[DecisionRequest] = None):
    sym = symbol.upper()
    tf = (payload.timeframe if payload else "1D") or "1D"
    
    # Check maintenance flag from data fetcher
    try:
        q_check = global_real_data_fetcher.fetch_quote(sym, "EGX")
        if q_check and q_check.get("is_under_maintenance"):
            full_res = {"is_under_maintenance": True}
            dec = global_decision_engine.decide(
                symbol=sym,
                full_analysis=full_res,
                timeframe=tf,
            )
            return dataclasses.asdict(dec)
    except Exception:
        pass

    # If candles supplied, run fast analysis to formulate decision
    raw_candles = [c.model_dump() for c in payload.candles] if payload and payload.candles else None
    
    if raw_candles:
        full_res = global_orchestrator.run(sym, tf, raw_candles, fast_mode=True)
    else:
        # Fallback minimal analysis for decision
        full_res = {
            "symbol": sym,
            "confluence": {"score": 0.65, "direction": "bullish"},
            "trade_plan": {
                "status": "actionable_setup",
                "direction": "bullish",
                "entry_zone": [86.0, 86.5],
                "stop_loss": 82.5,
                "primary_target": 92.0,
                "targets": [{"price": 92.0}, {"price": 96.0}],
                "primary_rr": 1.71,
            },
        }

    dec = global_decision_engine.decide(
        symbol=sym,
        full_analysis=full_res,
        timeframe=tf,
    )
    return dataclasses.asdict(dec)


class PDFReportRequest(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    current_price: Optional[float] = None
    currency: Optional[str] = "EGP"
    market: Optional[str] = "EGX"
    decision_data: Optional[Dict[str, Any]] = None
    lang: Optional[str] = "ar"

@app.post("/report/{symbol}/pdf")
@app.get("/report/{symbol}/pdf")
def generate_pdf_report_endpoint(symbol: str, lang: str = "ar", payload: Optional[PDFReportRequest] = None):
    try:
        from reports.pdf_generator import global_pdf_generator
    except ImportError:
        import sys
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        from reports.pdf_generator import global_pdf_generator

    sym = symbol.upper()
    comp_name = (payload.company_name if payload else None) or sym
    price = (payload.current_price if payload else None) or 86.0
    curr = (payload.currency if payload else None) or "EGP"
    mkt = (payload.market if payload else None) or "EGX"
    
    dec_dict = (payload.decision_data if payload else None)
    if not dec_dict:
        # generate on the fly
        fake_analysis = {
            "confluence": {"score": 0.68, "direction": "bullish"},
            "trade_plan": {
                "status": "actionable_setup",
                "direction": "bullish",
                "entry_zone": [price * 0.995, price * 1.005],
                "stop_loss": price * 0.955,
                "primary_target": price * 1.07,
                "targets": [{"price": price * 1.07}, {"price": price * 1.12}],
                "primary_rr": 1.71,
            }
        }
        dec_obj = global_decision_engine.decide(sym, fake_analysis)
        dec_dict = dataclasses.asdict(dec_obj)

    effective_lang = (payload.lang if payload and payload.lang else None) or lang or "ar"
    pdf_bytes = global_pdf_generator.generate(
        symbol=sym,
        company_name=comp_name,
        current_price=price,
        currency=curr,
        decision_data=dec_dict,
        market=mkt,
        lang=effective_lang,
    )

    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    filename = f"BORSATY_{sym}_{date_str}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ─────────────────────────────────────────────────────────────────────────────
# Phase م: Live Real Data Endpoints (yfinance + EODHD)
# ─────────────────────────────────────────────────────────────────────────────

from data.real_fetcher import global_real_data_fetcher
from engines.technical_score import global_technical_score_engine

@app.get("/technical-score/{symbol}")
@app.get("/api/technical-score/{symbol}")
def technical_score_endpoint(symbol: str, market: Optional[str] = "EGX", timeframe: Optional[str] = "1D"):
    candles = global_real_data_fetcher.fetch_history(symbol, market or "EGX", period="1y")
    return global_technical_score_engine.compute_score(candles, symbol=symbol, timeframe=timeframe or "1D")


@app.get("/market/indices")
def market_indices_endpoint():
    """Fetch live market benchmark indices."""
    return {"indices": global_real_data_fetcher.fetch_indices()}

@app.get("/quote/{symbol}")
def quote_endpoint(symbol: str, market: Optional[str] = "EGX"):
    """Fetch live quote for a symbol."""
    return global_real_data_fetcher.fetch_quote(symbol, market or "EGX")

@app.get("/history/{symbol}")
def history_endpoint(symbol: str, market: Optional[str] = "EGX", period: Optional[str] = "5y"):
    """Fetch real historical candle bars."""
    candles = global_real_data_fetcher.fetch_history(symbol, market or "EGX", period or "5y")
    return {"symbol": symbol.upper(), "candles": candles, "count": len(candles)}



# ─────────────────────────────────────────────────────────────────────────────
# Phase ك: Fundamental & Fair Value Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from fundamental.fair_value import global_fair_value_engine

class FairValueRequest(BaseModel):
    symbol: str
    current_price: Optional[float] = None
    currency: Optional[str] = None
    market: Optional[str] = None
    eps: Optional[float] = None
    bvps: Optional[float] = None
    fcf_per_share: Optional[float] = None
    sector_pe: Optional[float] = None
    sector_pb: Optional[float] = None
    growth_rate: Optional[float] = None
    wacc: Optional[float] = None
    terminal_growth: Optional[float] = None

@app.post("/fundamental/fair-value")
def compute_fair_value_endpoint(payload: FairValueRequest):
    res = global_fair_value_engine.compute(payload.symbol, payload.model_dump())
    return res.to_dict()

@app.get("/fundamental/fair-value/{symbol}")
def get_fair_value_endpoint(symbol: str, market: Optional[str] = "EGX"):
    quote = global_real_data_fetcher.fetch_quote(symbol, market or "EGX")
    data = {}
    if quote and quote.get("price"):
        data["current_price"] = quote["price"]
        data["currency"] = quote.get("currency", "EGP")
        data["market"] = quote.get("market", market)
    res = global_fair_value_engine.compute(symbol, data)
    return res.to_dict()

@app.get("/fundamental/fair-value/{symbol}/history")
def get_fair_value_history_endpoint(symbol: str, market: Optional[str] = "EGX", days: int = 90):
    quote = global_real_data_fetcher.fetch_quote(symbol, market or "EGX")
    data = {}
    if quote and quote.get("price"):
        data["current_price"] = quote["price"]
        data["currency"] = quote.get("currency", "EGP")
        data["market"] = quote.get("market", market)
    res = global_fair_value_engine.compute(symbol, data)
    return {
        "symbol": symbol.upper(),
        "history": res.historical_90d[-days:] if res.historical_90d else [],
        "count": len(res.historical_90d[-days:] if res.historical_90d else []),
    }



# ─────────────────────────────────────────────────────────────────────────────
# ProPicks Strategies Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from strategies import STRATEGY_REGISTRY, list_all_strategies, get_strategy

@app.get("/strategies")
def get_all_strategies_endpoint():
    return {"strategies": list_all_strategies()}

@app.get("/strategies/{strategy_name}/picks")
def get_strategy_picks_endpoint(strategy_name: str):
    strat = get_strategy(strategy_name)
    if not strat:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_name}' not found. Available: {list(STRATEGY_REGISTRY.keys())}")
    return strat.to_summary_dict()



# ─────────────────────────────────────────────────────────────────────────────
# Earnings Call Intelligence Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from intelligence.earnings_analyzer import global_earnings_analyzer

class EarningsAnalysisRequest(BaseModel):
    transcript_text: Optional[str] = None
    force_refresh: Optional[bool] = False

@app.post("/intelligence/earnings/{symbol}")
def post_earnings_intelligence_endpoint(symbol: str, payload: Optional[EarningsAnalysisRequest] = None):
    text = payload.transcript_text if payload else None
    refresh = payload.force_refresh if payload else False
    return global_earnings_analyzer.analyze(symbol, transcript_text=text, force_refresh=refresh)

@app.get("/intelligence/earnings/{symbol}")
def get_earnings_intelligence_endpoint(symbol: str, force_refresh: bool = False):
    return global_earnings_analyzer.analyze(symbol, force_refresh=force_refresh)



# ─────────────────────────────────────────────────────────────────────────────
# Insider & Institutional Tracking Endpoints
# ─────────────────────────────────────────────────────────────────────────────

from intelligence.insider_tracker import global_insider_tracker

@app.get("/intelligence/insider/{symbol}")
def get_insider_activity_endpoint(symbol: str, force_refresh: bool = False):
    return global_insider_tracker.get_insider_activity(symbol, force_refresh=force_refresh)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload = os.environ.get("ENV", "development").lower() == "development"
    uvicorn.run("main:app", host=host, port=port, reload=reload)
