from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union

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
from screener.nlu import global_screener_nlu
from screener.builder import global_screener_engine
from datetime import datetime, timezone

app = FastAPI(
    title="Borsaty Deterministic Analysis Engine",
    description="Arabic-First Financial Analysis Service (Elliott, Gann, Fibonacci, Harmonic, Fair Value)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
