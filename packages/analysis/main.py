from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

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
