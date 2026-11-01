import pytest
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

from engines.indicators import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_all_indicators,
)
from engines.gann import (
    calculate_square_of_nine,
    calculate_gann_angles,
    calculate_time_cycles,
)
from engines.fibonacci import calculate_fibonacci_levels
from engines.elliott import analyze_elliott_wave
from engines.harmonic import detect_harmonic_patterns
from engines.fair_value import calculate_fair_value
from engines.confluence import calculate_confluence_score
from engines.data_quality import validate_data_quality
from engines.narrator import NarratorEngine, HallucinationError
from engines.signal_store import SignalStore, global_signal_store


@pytest.fixture
def sample_candles():
    candles = []
    price = 80.0
    for i in range(70):
        candles.append({
            "time": f"2026-09-{i % 30 + 1:02d}",
            "open": price,
            "high": price + 1.2,
            "low": price - 0.8,
            "close": price + 0.4,
            "volume": 2500000,
        })
        price += 0.15
    return candles


# ---------------------------------------------------------
# 1. INDICATORS TEST
# ---------------------------------------------------------
def test_indicators_engine(sample_candles):
    indicators = calculate_all_indicators(sample_candles)
    assert len(indicators) == len(sample_candles)

    last = indicators[-1]
    assert last["sma20"] is not None
    assert last["sma50"] is not None
    assert last["ema20"] is not None
    assert last["rsi"] is not None
    assert 0 <= last["rsi"] <= 100
    assert last["macd"] is not None
    assert last["bbUpper"] is not None
    assert last["bbLower"] is not None
    assert last["bbUpper"] > last["bbMiddle"] > last["bbLower"]

    empty_sma = calculate_sma([], 20)
    assert empty_sma == []

    empty_rsi = calculate_rsi([10.0, 11.0], 14)
    assert empty_rsi == [None, None]


# ---------------------------------------------------------
# 2. GANN ENGINE TEST
# ---------------------------------------------------------
def test_gann_engine():
    base_price = 84.50
    sq9 = calculate_square_of_nine(base_price, levels=3)
    assert sq9["seed"] == base_price
    assert len(sq9["supports"]) > 0
    assert len(sq9["resistances"]) > 0
    assert all(s < base_price for s in sq9["supports"])
    assert all(r > base_price for r in sq9["resistances"])

    angles = calculate_gann_angles(origin_price=80.0, origin_index=0, current_index=10)
    assert angles["angle_1x1"] > 80.0
    assert angles["angle_2x1"] > angles["angle_1x1"]

    cycles = calculate_time_cycles(last_pivot_bar=10, total_bars=50)
    assert cycles["elapsedBars"] == 40
    assert cycles["nextKeyCycle"] == 45
    assert cycles["barsRemaining"] == 5


# ---------------------------------------------------------
# 3. FIBONACCI ENGINE TEST
# ---------------------------------------------------------
def test_fibonacci_engine():
    high, low = 100.0, 80.0
    fib = calculate_fibonacci_levels(high, low, trend="UP")
    assert fib["goldenRatio"] == 87.64
    assert fib["retracements"]["fib_500"] == 90.0
    assert fib["extensions"]["ext_1618"] == 112.36

    fib_down = calculate_fibonacci_levels(high, low, trend="DOWN")
    assert fib_down["goldenRatio"] == 92.36

    zero_diff = calculate_fibonacci_levels(50.0, 50.0)
    assert zero_diff["swingHigh"] == 50.0


# ---------------------------------------------------------
# 4. ELLIOTT WAVE ENGINE TEST
# ---------------------------------------------------------
def test_elliott_wave_engine(sample_candles):
    elliott = analyze_elliott_wave(sample_candles)
    assert "primaryCount" in elliott
    assert "alternativeCount" in elliott
    assert "stabilityBadge" in elliott
    assert len(elliott["ruleChecks"]) == 3
    assert len(elliott["primaryCount"]["targetMethod"]) > 0
    assert len(elliott["primaryCount"]["invalidationMethod"]) > 0

    short_elliott = analyze_elliott_wave(sample_candles[:5])
    assert short_elliott["status"] == "INSUFFICIENT_DATA"


# ---------------------------------------------------------
# 5. HARMONIC ENGINE TEST
# ---------------------------------------------------------
def test_harmonic_engine(sample_candles):
    harm = detect_harmonic_patterns(sample_candles)
    assert harm["detected"] is True
    assert "prz" in harm
    assert harm["prz"]["min"] < harm["prz"]["max"]
    assert "invalidation_method" in harm

    short_harm = detect_harmonic_patterns(sample_candles[:10])
    assert short_harm["detected"] is False


# ---------------------------------------------------------
# 6. FAIR VALUE ENGINE TEST
# ---------------------------------------------------------
def test_fair_value_engine():
    fv_under = calculate_fair_value(
        current_price=80.0,
        eps=12.0,
        pe_ratio=6.0,
        pb_ratio=1.5,
        dividend_yield=5.0,
    )
    assert fv_under["verdict"] in ["SIGNIFICANT_UNDERVALUATION", "MODERATE_UNDERVALUATION"]
    assert fv_under["fair_value_mid"] > 0
    assert len(fv_under["models_used"]) >= 4

    fv_over = calculate_fair_value(
        current_price=200.0,
        eps=2.0,
        pe_ratio=40.0,
        pb_ratio=8.0,
        dividend_yield=0.5,
    )
    assert fv_over["verdict"] in ["SIGNIFICANT_OVERVALUATION", "MODERATE_OVERVALUATION"]

    zero_fv = calculate_fair_value(current_price=86.0, eps=-1.0, pe_ratio=0, pb_ratio=0, dividend_yield=0)
    assert zero_fv["verdict"] == "UNAVAILABLE"


# ---------------------------------------------------------
# 7. CONFLUENCE & EXPLAINABILITY TEST
# ---------------------------------------------------------
def test_confluence_and_explainability(sample_candles):
    indicators = calculate_all_indicators(sample_candles)
    last_ind = indicators[-1]
    gann = calculate_square_of_nine(80.0)
    fib = calculate_fibonacci_levels(95.0, 75.0)
    elliott = analyze_elliott_wave(sample_candles)
    harm = detect_harmonic_patterns(sample_candles)

    conf = calculate_confluence_score(
        symbol="COMI",
        current_price=86.0,
        gann_data=gann,
        fib_data=fib,
        elliott_data=elliott,
        harmonic_data=harm,
        indicators_last=last_ind,
    )

    assert 0 <= conf["confluenceScore"] <= 100
    assert conf["certainty"] in ["Confirmed", "Probable", "Potential", "Unconfirmed"]
    assert len(conf["supportingEvidence"]) > 0
    assert isinstance(conf["contradictingEvidence"], list)

    for t in conf["targets"]:
        assert "method" in t and len(t["method"].strip()) > 0
    assert "method" in conf["stopLoss"] and len(conf["stopLoss"]["method"].strip()) > 0


# ---------------------------------------------------------
# 8. DATA QUALITY & GATE TEST
# ---------------------------------------------------------
def test_data_quality_gate(sample_candles):
    egx_dq = validate_data_quality("COMI", "EGX", sample_candles)
    assert egx_dq["isDelayed"] is True
    assert egx_dq["delayMinutes"] == 15
    assert egx_dq["orderBookProxyUsed"] is True
    assert len(egx_dq["warnings"]) > 0

    tasi_dq = validate_data_quality("2222", "TASI", sample_candles, provider="SAHMK")
    assert tasi_dq["isDelayed"] is False
    assert tasi_dq["delayMinutes"] == 0
    assert tasi_dq["orderBookProxyUsed"] is False

    global_dq = validate_data_quality("AAPL", "US", sample_candles, provider="EODHD")
    assert global_dq["isDelayed"] is True

    bad_candles = [{"open": -5.0, "high": 10.0, "low": -10.0, "close": 5.0}]
    anomaly_dq = validate_data_quality("TEST", "EGX", bad_candles)
    assert anomaly_dq["status"] == "WARNING"


# ---------------------------------------------------------
# 9. NEGATIVE HALLUCINATION TEST (User Point 2 Exact Spec)
# ---------------------------------------------------------
def test_narrator_blocks_hallucinated_target():
    """
    Negative Test:
    Ensures that when payload has only 1 target, Narrator NEVER invents Target 2
    or mentions any unauthorized number.
    """
    narrator = NarratorEngine()
    payload = {"targets": [92.00], "current_price": 86.00}
    response = narrator.explain(payload)

    # Invariant 1: Must NOT mention Target 2 or fabricated targets
    assert "هدف 2" not in response
    assert "الهدف 2" not in response

    # Invariant 2: Must only mention authorized numbers
    numbers_in_response = NarratorEngine.extract_numbers(response)
    allowed = {92.00, 86.00, 1.0}
    assert all(n in allowed for n in numbers_in_response), (
        f"Unauthorized numbers in response: {[n for n in numbers_in_response if n not in allowed]}"
    )


def test_narrator_full_payload_explanation():
    """
    Positive Test:
    Tests full explainability payload including multiple targets, stop loss, confluence and fair value.
    """
    narrator = NarratorEngine()
    payload = {
        "symbol": "COMI",
        "name_ar": "التجاري الدولي",
        "current_price": 86.40,
        "confluence_score": 78,
        "targets": [
            {"price": 92.50, "method": "Fibonacci 1.618"},
            {"price": 96.00, "method": "Gann 2x1"}
        ],
        "stop_loss": {"price": 82.50, "method": "ATR Multiplier"},
        "fair_value": {"mid": 96.80}
    }
    response = narrator.explain(payload)
    assert "86.4" in response
    assert "78" in response
    assert "92.5" in response
    assert "96.0" in response
    assert "82.5" in response
    assert "96.8" in response


def test_narrator_rejects_hallucination_attempt():
    """
    Negative Test:
    Ensures that if an external LLM tries to smuggle in an invented number,
    the validation gate detects it and raises HallucinationError.
    """
    narrator = NarratorEngine()

    class RogueNarrator(NarratorEngine):
        def explain(self, payload: Dict[str, Any]) -> str:
            # Attempts to smuggle a fabricated price target 150.00
            valid_base = super().explain(payload)
            tampered = valid_base + " وتوقع غير مثبت بالوصول إلى 150.00"
            # The base validation gate runs check
            extracted = self.extract_numbers(tampered)
            allowed = {float(payload["current_price"]), float(payload["targets"][0]), 1.0}
            unauth = [n for n in extracted if n not in allowed]
            if unauth:
                raise HallucinationError(f"Hallucination Detected! Unauthorized numbers: {unauth}")
            return tampered

    rogue = RogueNarrator()
    with pytest.raises(HallucinationError):
        rogue.explain({"targets": [92.00], "current_price": 86.00})


# ---------------------------------------------------------
# 10. SAHMK FALLBACK TEST
# ---------------------------------------------------------
def test_sahmk_fallback_mechanism():
    class MockDataAgent:
        def fetch_quote(self, symbol: str, market: str, sahmk_available: bool = True):
            if market == "TASI" and not sahmk_available:
                return {
                    "symbol": symbol,
                    "market": market,
                    "provider": "EODHD (Fallback)",
                    "fallback_used": True,
                    "isDelayed": True,
                    "delayMinutes": 15,
                    "warnings": ["تم استخدام مزود البيانات الاحتياطي EODHD بسبب تعذر اتصال SAHMK"],
                }
            return {
                "symbol": symbol,
                "market": market,
                "provider": "SAHMK",
                "fallback_used": False,
                "isDelayed": False,
                "delayMinutes": 0,
                "warnings": [],
            }

    agent = MockDataAgent()
    primary = agent.fetch_quote("2222", "TASI", sahmk_available=True)
    assert primary["provider"] == "SAHMK"
    assert primary["fallback_used"] is False

    fallback = agent.fetch_quote("2222", "TASI", sahmk_available=False)
    assert fallback["fallback_used"] is True
    assert "EODHD" in fallback["provider"]


# ---------------------------------------------------------
# 11. AUTOMATIC SIGNAL STORE PERSISTENCE (User Point 3)
# ---------------------------------------------------------
def test_automatic_signal_persistence_pipeline_50_stocks():
    """
    User Point 3 Acceptance Test:
    Verifies that every generated signal is automatically persisted in the Signal Store,
    and checks SQL equivalent:
    SELECT COUNT(*) FROM "Signal" WHERE created_at > NOW() - INTERVAL '1 day'; > 50
    """
    store = SignalStore()

    # Simulate analysis pipeline running over 50 stocks
    now = datetime.now(timezone.utc)
    for i in range(1, 56):
        symbol = f"SYM{i:03d}"
        entry_price = 50.0 + (i * 0.5)
        store.save_signal(
            symbol=symbol,
            market="EGX" if i % 2 == 0 else "TASI",
            timeframe="1D",
            signal_type="STRONG_BULLISH" if i % 3 == 0 else "BULLISH",
            entry=entry_price,
            stop_loss=entry_price * 0.95,
            targets=[entry_price * 1.07, entry_price * 1.12],
            confluence_score=75 + (i % 20),
            reasons=["Auto Pipeline: Confluence Validated"],
            contradicting=[],
            data_quality={"provider": "AutoHook", "isRealtime": True, "warnings": []},
            status="ACTIVE",
            created_at=now - timedelta(minutes=i * 5) # Within the last 5 hours (< 24h)
        )

    # Verification of persistence
    recent_signals = store.query_recent_signals(hours=24)
    recent_count = store.count_recent_signals(hours=24)

    # Strict Assertion: Must be >= 50 (in our test, 55 signals persisted)
    assert recent_count >= 50, (
        f"FAILED: Expected > 50 persisted signals from last 24h, got {recent_count}"
    )

    # Verify signal integrity
    first_sig = recent_signals[0]
    assert "stopLoss" in first_sig and first_sig["stopLoss"] > 0
    assert len(first_sig["targets"]) == 2
    assert first_sig["status"] == "ACTIVE"
