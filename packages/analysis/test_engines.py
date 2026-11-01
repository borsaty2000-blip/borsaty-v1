from engines.indicators import calculate_all_indicators
from engines.gann import calculate_square_of_nine
from engines.fibonacci import calculate_fibonacci_levels
from engines.elliott import analyze_elliott_wave
from engines.harmonic import detect_harmonic_patterns
from engines.fair_value import calculate_fair_value
from engines.confluence import calculate_confluence_score
from engines.data_quality import validate_data_quality

def test_engines():
    print("Testing Borsaty Deterministic Engines...")
    
    # Generate test candles
    candles = []
    price = 80.0
    for i in range(60):
        candles.append({
            "time": f"2026-09-{i%30+1:02d}",
            "open": price,
            "high": price + 1.5,
            "low": price - 1.0,
            "close": price + 0.5,
            "volume": 2000000
        })
        price += 0.2

    # 1. Indicators
    indicators = calculate_all_indicators(candles)
    assert len(indicators) == 60
    assert "rsi" in indicators[-1]
    assert "macd" in indicators[-1]
    assert "bbUpper" in indicators[-1]
    print("✓ Indicators Engine: PASS")

    # 2. Gann
    gann = calculate_square_of_nine(80.0)
    assert len(gann["supports"]) > 0
    assert len(gann["resistances"]) > 0
    print("✓ Gann Engine (Square of 9): PASS")

    # 3. Fibonacci
    fib = calculate_fibonacci_levels(95.0, 75.0)
    assert fib["goldenRatio"] == 82.64
    print("✓ Fibonacci Engine: PASS")

    # 4. Elliott
    elliott = analyze_elliott_wave(candles)
    assert "primaryCount" in elliott
    assert "ruleChecks" in elliott
    print("✓ Elliott Wave Engine: PASS")

    # 5. Harmonics
    harm = detect_harmonic_patterns(candles)
    assert "prz" in harm
    print("✓ Harmonic Engine: PASS")

    # 6. Fair Value
    fv = calculate_fair_value(86.0, eps=11.2, pe_ratio=7.5, pb_ratio=1.8, dividend_yield=4.8)
    assert fv["fair_value_mid"] > 0
    assert "disclaimer" in fv
    print("✓ Fair Value Engine (17+ Models): PASS")

    # 7. Data Quality
    dq = validate_data_quality("COMI", "EGX", candles)
    assert dq["orderBookProxyUsed"] is True
    print("✓ Data Quality Gate: PASS")

    # 8. Confluence
    conf = calculate_confluence_score("COMI", 86.0, gann, fib, elliott, harm, indicators[-1])
    assert 0 <= conf["confluenceScore"] <= 100
    assert len(conf["supportingEvidence"]) > 0
    assert len(conf["targets"]) == 3
    for t in conf["targets"]:
        assert "method" in t and len(t["method"]) > 0, "Non-negotiable: Every target must have a named method!"
    assert "method" in conf["stopLoss"] and len(conf["stopLoss"]["method"]) > 0, "Non-negotiable: Every stop must have a named method!"
    print("✓ Confluence & Explainability Engine: PASS")
    print("All deterministic engines verified successfully!")

if __name__ == "__main__":
    test_engines()
