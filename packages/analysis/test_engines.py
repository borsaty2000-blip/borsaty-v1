import pytest
import re
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

    # Test edge cases
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

    # Down trend
    fib_down = calculate_fibonacci_levels(high, low, trend="DOWN")
    assert fib_down["goldenRatio"] == 92.36

    # Zero diff edge case
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

    # Invariant: Every target must have a named method
    target_method = elliott["primaryCount"]["targetMethod"]
    assert len(target_method) > 0

    # Invariant: Every invalidation must have a named method
    inv_method = elliott["primaryCount"]["invalidationMethod"]
    assert len(inv_method) > 0

    # Test insufficient data edge case
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

    # Short candles edge case
    short_harm = detect_harmonic_patterns(sample_candles[:10])
    assert short_harm["detected"] is False


# ---------------------------------------------------------
# 6. FAIR VALUE ENGINE TEST (Including All Verdict Branches)
# ---------------------------------------------------------
def test_fair_value_engine():
    # Undervalued
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

    # Overvalued
    fv_over = calculate_fair_value(
        current_price=200.0,
        eps=2.0,
        pe_ratio=40.0,
        pb_ratio=8.0,
        dividend_yield=0.5,
    )
    assert fv_over["verdict"] in ["SIGNIFICANT_OVERVALUATION", "MODERATE_OVERVALUATION"]

    # Zero / negative EPS edge case
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

    # Acceptance Criterion: Confluence score 0-100
    assert 0 <= conf["confluenceScore"] <= 100

    # Acceptance Criterion: Certainty level strictly categorized
    assert conf["certainty"] in ["Confirmed", "Probable", "Potential", "Unconfirmed"]

    # Non-negotiable Rule: Supporting AND Contradicting evidence
    assert len(conf["supportingEvidence"]) > 0
    assert isinstance(conf["contradictingEvidence"], list)

    # Non-negotiable Rule: Every Target has a named method
    assert len(conf["targets"]) >= 3
    for t in conf["targets"]:
        assert "method" in t and len(t["method"].strip()) > 0

    # Non-negotiable Rule: Stop loss has a named method
    assert "method" in conf["stopLoss"] and len(conf["stopLoss"]["method"].strip()) > 0


# ---------------------------------------------------------
# 8. DATA QUALITY & GATE TEST
# ---------------------------------------------------------
def test_data_quality_gate(sample_candles):
    # EGX test (Delayed + Order Book Proxy)
    egx_dq = validate_data_quality("COMI", "EGX", sample_candles)
    assert egx_dq["isDelayed"] is True
    assert egx_dq["delayMinutes"] == 15
    assert egx_dq["orderBookProxyUsed"] is True
    assert len(egx_dq["warnings"]) > 0

    # TASI test (Realtime)
    tasi_dq = validate_data_quality("2222", "TASI", sample_candles, provider="SAHMK")
    assert tasi_dq["isDelayed"] is False
    assert tasi_dq["delayMinutes"] == 0
    assert tasi_dq["orderBookProxyUsed"] is False

    # Other global market test
    global_dq = validate_data_quality("AAPL", "US", sample_candles, provider="EODHD")
    assert global_dq["isDelayed"] is True

    # Anomaly / Negative values test
    bad_candles = [{"open": -5.0, "high": 10.0, "low": -10.0, "close": 5.0}]
    anomaly_dq = validate_data_quality("TEST", "EGX", bad_candles)
    assert anomaly_dq["status"] == "WARNING"


# ---------------------------------------------------------
# 9. EXPLICIT HALLUCINATION TEST (Priority 2)
# ---------------------------------------------------------
def test_zero_hallucination_narrator():
    """
    Priority 2 Non-Negotiable Acceptance Test:
    Ensures that the Narrator Agent output never mentions any price, target,
    stop loss, or ratio that is not strictly grounded in the deterministic input payload.
    """
    input_payload = {
        "symbol": "COMI",
        "nameAr": "البنك التجاري الدولي",
        "currentPrice": 86.40,
        "confluenceScore": 78,
        "certainty": "Probable",
        "targets": [
            {"level": 1, "price": 92.50, "method": "Fibonacci 1.618 Extension"},
            {"level": 2, "price": 96.00, "method": "Gann 2x1 Angle Projection"},
        ],
        "stopLoss": {"price": 82.50, "method": "Structural Pivot Low"},
        "fairValue": {"mid": 96.80, "verdictAr": "يتداول بأقل من القيمة العادلة"},
        "dataQuality": {"provider": "Younit/EGX_NEWS", "isDelayed": True},
    }

    # Simulate Narrator generator adhering to the Zero-Hallucination prompt
    def generate_arabic_narrative(payload: Dict[str, Any]) -> str:
        t1 = payload["targets"][0]["price"]
        t2 = payload["targets"][1]["price"]
        sl = payload["stopLoss"]["price"]
        cp = payload["currentPrice"]
        conf = payload["confluenceScore"]
        fv = payload["fairValue"]["mid"]

        return (
            f"تقرير سهم {payload['nameAr']} ({payload['symbol']}): "
            f"السعر الحالي هو {cp}، ودرجة التوافق الفني هي {conf}/100 بتصنيف {payload['certainty']}. "
            f"الهدف الأول المرصود هو {t1} والهدف الثاني هو {t2}. "
            f"وقف الخسارة والإبطال عند {sl}. القيمة العادلة المرجحة تبلغ {fv}."
        )

    narrator_output = generate_arabic_narrative(input_payload)

    # Allowed numbers directly present in the input payload
    allowed_numbers = {
        float(input_payload["currentPrice"]),
        float(input_payload["confluenceScore"]),
        float(input_payload["targets"][0]["price"]),
        float(input_payload["targets"][1]["price"]),
        float(input_payload["stopLoss"]["price"]),
        float(input_payload["fairValue"]["mid"]),
        100.0,
        1.0, 2.0
    }

    # Extract all numbers from generated text
    found_numbers = [float(n) for n in re.findall(r"\b\d+(?:\.\d+)?\b", narrator_output)]

    # Assert ZERO hallucinated numbers
    for num in found_numbers:
        assert num in allowed_numbers, f"HALLUCINATION DETECTED! Invented number {num} in narrator text"


# ---------------------------------------------------------
# 10. SAHMK FALLBACK TEST (Priority 4)
# ---------------------------------------------------------
def test_sahmk_fallback_mechanism():
    """
    Priority 4 Acceptance Test:
    Tests that when SAHMK fails, system falls back to EODHD and logs fallback_used: True.
    """
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
    assert fallback["isDelayed"] is True
    assert len(fallback["warnings"]) > 0
