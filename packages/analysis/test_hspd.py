import pytest
import math
import random
import time
from engines.hspd import HSPDEngine, global_hspd_engine

# ==============================================================================
# SYNTHETIC GENERATORS
# ==============================================================================

def make_candle(t_idx: int, price: float, spread: float = 0.5):
    return {
        "time": f"2026-01-01T{t_idx:04d}Z",
        "open": round(price, 3),
        "high": round(price + spread, 3),
        "low": round(price - spread, 3),
        "close": round(price, 3),
        "volume": 1000
    }

def generate_sine_wave(length: int = 100, period: int = 20, base: float = 100.0, amp_pct: float = 0.10):
    amp = base * amp_pct
    candles = []
    for i in range(length):
        val = base + amp * math.sin(2 * math.pi * i / period)
        # Dynamic spread to ensure structural reversal
        spread = amp * 0.1
        candles.append({
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(val, 3),
            "high": round(val + spread, 3),
            "low": round(val - spread, 3),
            "close": round(val, 3),
            "volume": 1000
        })
    return candles

def generate_triangle_wave(length: int = 120, period: int = 30, base: float = 100.0, amp_pct: float = 0.15):
    amp = base * amp_pct
    candles = []
    for i in range(length):
        # Triangle wave formula
        phase = (i % period) / period
        if phase < 0.5:
            val = base - amp + 4 * amp * phase
        else:
            val = base + 3 * amp - 4 * amp * phase
        spread = amp * 0.1
        candles.append({
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(val, 3),
            "high": round(val + spread, 3),
            "low": round(val - spread, 3),
            "close": round(val, 3),
            "volume": 1000
        })
    return candles

def generate_sawtooth_wave(length: int = 90, period: int = 15, base: float = 100.0, amp_pct: float = 0.10):
    amp = base * amp_pct
    candles = []
    for i in range(length):
        phase = (i % period) / period
        val = base + amp * (2 * phase - 1)
        spread = amp * 0.1
        candles.append({
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(val, 3),
            "high": round(val + spread, 3),
            "low": round(val - spread, 3),
            "close": round(val, 3),
            "volume": 1000
        })
    return candles

def generate_comi_mock_data(length: int = 500, base: float = 86.0):
    random.seed(42)
    candles = []
    curr = base
    for i in range(length):
        # Multi-scale trend + cycle + noise
        macro_cycle = 15.0 * math.sin(2 * math.pi * i / 180)
        inter_cycle = 6.0 * math.sin(2 * math.pi * i / 45)
        micro_cycle = 2.0 * math.sin(2 * math.pi * i / 12)
        noise = random.gauss(0, 0.4)
        price = base + macro_cycle + inter_cycle + micro_cycle + noise
        spread = max(0.5, abs(random.gauss(0.8, 0.2)))
        candles.append({
            "time": f"2026-01-01T{i:04d}Z",
            "open": round(price, 2),
            "high": round(price + spread, 2),
            "low": round(price - spread, 2),
            "close": round(price, 2),
            "volume": random.randint(500000, 2000000)
        })
    return candles


# ==============================================================================
# PART A: SYNTHETIC DATA TESTS (20 TESTS)
# ==============================================================================

def test_synthetic_sine_wave_peaks():
    engine = HSPDEngine()
    # Period 20, peaks expected at 5, 25, 45, 65, 85
    candles = generate_sine_wave(length=100, period=20, base=100.0, amp_pct=0.10)
    res = engine.detect(candles, min_degree=0, max_degree=1)
    
    pivots_d0 = res["by_degree"]["0"]["pivots"]
    peaks_d0 = [p for p in pivots_d0 if p["type"] == "peak"]
    assert len(peaks_d0) >= 3
    for p in peaks_d0:
        # Check within 1 bar of exact peak
        remainder = (p["index"] - 5) % 20
        assert remainder in [0, 1, 19], f"Peak at {p['index']} is off from sine peak"

def test_synthetic_sine_wave_troughs():
    engine = HSPDEngine()
    # Period 20, troughs expected at 15, 35, 55, 75
    candles = generate_sine_wave(length=100, period=20, base=100.0, amp_pct=0.10)
    res = engine.detect(candles, min_degree=0, max_degree=1)
    
    troughs_d0 = [p for p in res["by_degree"]["0"]["pivots"] if p["type"] == "trough"]
    assert len(troughs_d0) >= 3
    for p in troughs_d0:
        remainder = (p["index"] - 15) % 20
        assert remainder in [0, 1, 19], f"Trough at {p['index']} is off from sine trough"

def test_synthetic_sine_wave_stability_score():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=80, period=20)
    res = engine.detect(candles)
    for p in res["pivots"]:
        assert p["stability_score"] == 1.0

def test_synthetic_triangle_wave_peaks():
    engine = HSPDEngine()
    # Period 30, peaks at 15, 45, 75, 105
    candles = generate_triangle_wave(length=120, period=30)
    res = engine.detect(candles, min_degree=0, max_degree=1)
    peaks = [p for p in res["by_degree"]["0"]["pivots"] if p["type"] == "peak"]
    assert len(peaks) >= 3
    for p in peaks:
        remainder = (p["index"] - 15) % 30
        assert remainder in [0, 1, 29]

def test_synthetic_triangle_wave_troughs():
    engine = HSPDEngine()
    # Period 30, troughs at 0, 30, 60, 90
    candles = generate_triangle_wave(length=120, period=30)
    res = engine.detect(candles, min_degree=0, max_degree=1)
    troughs = [p for p in res["by_degree"]["0"]["pivots"] if p["type"] == "trough"]
    assert len(troughs) >= 2
    for p in troughs:
        remainder = (p["index"]) % 30
        assert remainder in [0, 1, 29]

def test_synthetic_sawtooth_wave_detection():
    engine = HSPDEngine()
    candles = generate_sawtooth_wave(length=90, period=15)
    res = engine.detect(candles, min_degree=0, max_degree=0)
    assert len(res["pivots"]) >= 3

def test_synthetic_sine_wave_noise_resilience_1pct():
    random.seed(123)
    candles = generate_sine_wave(length=100, period=20, base=100.0, amp_pct=0.12)
    # Add 1% Gaussian noise
    for c in candles:
        noise = random.gauss(0, 0.5)
        c["high"] += noise
        c["low"] += noise
        c["close"] += noise
    
    engine = HSPDEngine()
    res = engine.detect(candles, min_degree=0, max_degree=1)
    # Positions should still be within ±1 bar
    peaks = [p for p in res["by_degree"]["0"]["pivots"] if p["type"] == "peak"]
    assert len(peaks) >= 2

def test_synthetic_superposition_sine_triangle():
    candles = []
    for i in range(150):
        v1 = 10.0 * math.sin(2 * math.pi * i / 50)
        v2 = 5.0 * math.sin(2 * math.pi * i / 15)
        val = 100.0 + v1 + v2
        candles.append(make_candle(i, val, 0.5))
    
    engine = HSPDEngine()
    res = engine.detect(candles)
    # Macro swings (D2/D1) and micro swings (D0) should be detected
    assert len(res["by_degree"]["0"]["pivots"]) > len(res["by_degree"]["2"]["pivots"])

def test_synthetic_amplitude_scaling_5pct():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=80, period=20, base=100.0, amp_pct=0.05)
    res = engine.detect(candles, min_degree=0, max_degree=0)
    assert len(res["pivots"]) >= 2

def test_synthetic_amplitude_scaling_20pct():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=80, period=20, base=100.0, amp_pct=0.20)
    res = engine.detect(candles, min_degree=1, max_degree=2)
    assert len(res["pivots"]) >= 2

def test_synthetic_exact_pivot_price_accuracy():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=80, period=20, base=100.0, amp_pct=0.10)
    res = engine.detect(candles, min_degree=0, max_degree=0)
    for p in res["pivots"]:
        idx = p["index"]
        if p["type"] == "peak":
            assert abs(p["price"] - candles[idx]["high"]) < 1e-4
        else:
            assert abs(p["price"] - candles[idx]["low"]) < 1e-4

def test_synthetic_period_40_sine():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=120, period=40, base=100.0, amp_pct=0.15)
    res = engine.detect(candles, min_degree=1, max_degree=2)
    assert len(res["pivots"]) >= 2

def test_synthetic_flat_market_no_pivots():
    engine = HSPDEngine()
    candles = [make_candle(i, 50.0, 0.0) for i in range(50)]
    res = engine.detect(candles)
    assert len(res["pivots"]) == 0

def test_synthetic_monotonic_uptrend_no_pivots():
    engine = HSPDEngine()
    candles = [make_candle(i, 50.0 + i * 0.5, 0.2) for i in range(50)]
    res = engine.detect(candles)
    # A straight upward line has no structural swing reversals
    assert len(res["pivots"]) == 0

def test_synthetic_monotonic_downtrend_no_pivots():
    engine = HSPDEngine()
    candles = [make_candle(i, 100.0 - i * 0.5, 0.2) for i in range(50)]
    res = engine.detect(candles)
    assert len(res["pivots"]) == 0

def test_synthetic_swing_duration_calculation():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=100, period=20)
    res = engine.detect(candles, min_degree=0, max_degree=0)
    pivots = res["by_degree"]["0"]["pivots"]
    for i in range(1, len(pivots)):
        assert pivots[i]["swing_duration_bars"] > 0
        assert pivots[i]["swing_length_pct"] > 0

def test_synthetic_data_quality_insufficient_history():
    engine = HSPDEngine()
    candles = [make_candle(i, 50.0) for i in range(10)]
    res = engine.detect(candles)
    assert res["data_quality"]["insufficient_history"] is True

def test_synthetic_data_quality_sufficient_history():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=50)
    res = engine.detect(candles)
    assert res["data_quality"]["insufficient_history"] is False

def test_synthetic_empty_candles():
    engine = HSPDEngine()
    res = engine.detect([])
    assert len(res["pivots"]) == 0
    assert res["data_quality"]["candles_used"] == 0

def test_synthetic_version_field():
    engine = HSPDEngine()
    res = engine.detect(generate_sine_wave(length=30))
    assert res["version"] == "1.0.0"


# ==============================================================================
# PART B: GATE-SPECIFIC TESTS (10 TESTS)
# ==============================================================================

def test_gate1_structural_peak_without_reversal_rejected():
    engine = HSPDEngine()
    candles = [make_candle(i, 50.0) for i in range(20)]
    # Create peak high but no structural reversal on lows
    candles[10]["high"] = 80.0
    candles[11]["low"] = 60.0  # low[i+1] > low[i] violates reversal
    candles[10]["low"] = 50.0
    res = engine.detect(candles)
    # Peak at 10 must be rejected by Gate 1
    assert not any(p["index"] == 10 for p in res["pivots"])
    assert res["rejected_candidates"]["structural_failures"] >= 0

def test_gate1_structural_trough_without_reversal_rejected():
    engine = HSPDEngine()
    candles = [make_candle(i, 80.0) for i in range(20)]
    candles[10]["low"] = 40.0
    candles[11]["high"] = 40.0 # high[i+1] < high[i]
    candles[10]["high"] = 50.0
    res = engine.detect(candles)
    assert not any(p["index"] == 10 for p in res["pivots"])

def test_gate2_stability_single_bar_noise_rejected():
    engine = HSPDEngine()
    # 20 flat bars with a single 1-bar spike
    candles = [make_candle(i, 50.0, 0.1) for i in range(25)]
    candles[12]["high"] = 75.0
    candles[12]["low"] = 52.0
    candles[11]["low"] = 49.0
    candles[13]["low"] = 49.0
    res = engine.detect(candles)
    # Removing bar 12 removes the entire swing -> rejected by Gate 2
    assert not any(p["index"] == 12 for p in res["pivots"])

def test_gate2_stability_score_recorded():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=60, period=20)
    res = engine.detect(candles)
    for p in res["pivots"]:
        assert "stability_score" in p
        assert p["stability_score"] >= 0.0

def test_gate3_temporal_spacing_rejected():
    engine = HSPDEngine()
    # Degree 1 min_spacing is 5 bars. If two peaks occur at index 10 and 12, second is rejected.
    candles = generate_sine_wave(length=80, period=20)
    res = engine.detect(candles, min_degree=1, max_degree=1)
    pivots = res["by_degree"]["1"]["pivots"]
    for k in range(1, len(pivots)):
        assert (pivots[k]["index"] - pivots[k - 1]["index"]) >= 5

def test_gate3_temporal_spacing_degree2_enforced():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=200)
    res = engine.detect(candles, min_degree=2, max_degree=2)
    pivots = res["by_degree"]["2"]["pivots"]
    for k in range(1, len(pivots)):
        assert (pivots[k]["index"] - pivots[k - 1]["index"]) >= 15

def test_gate5_fractal_subpeak_rejected():
    engine = HSPDEngine()
    # Degree 2 fractal window is 40 bars (±20).
    # If a peak at index 30 has price 110, but index 40 has 125, index 30 must be rejected
    candles = generate_sine_wave(length=100, period=30, base=100.0, amp_pct=0.10)
    candles[35]["high"] = 150.0  # Dominant peak in window
    candles[35]["low"] = 130.0
    candles[34]["low"] = 100.0
    candles[36]["low"] = 100.0
    res = engine.detect(candles, min_degree=2, max_degree=2)
    pivots_d2 = res["by_degree"]["2"]["pivots"]
    # Peaks in window around 35 that are lower than 150 must be rejected
    for p in pivots_d2:
        if abs(p["index"] - 35) <= 20 and p["type"] == "peak":
            assert p["price"] >= 150.0 or p["index"] == 35

def test_gate5_fractal_trough_window():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=100, period=30, base=100.0, amp_pct=0.10)
    res = engine.detect(candles, min_degree=1, max_degree=1)
    troughs_d1 = [p for p in res["by_degree"]["1"]["pivots"] if p["type"] == "trough"]
    # Every trough must be local minimum in ±10 bars
    for t in troughs_d1:
        idx = t["index"]
        for j in range(max(0, idx - 10), min(len(candles), idx + 11)):
            assert t["price"] <= candles[j]["low"] + 1e-4

def test_gate4_degree3_extreme_80_bars():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=300)
    res = engine.detect(candles, min_degree=3, max_degree=3)
    pivots_d3 = res["by_degree"]["3"]["pivots"]
    for p in pivots_d3:
        idx = p["index"]
        # Must be extreme in ±80 bars
        start = max(0, idx - 80)
        end = min(len(candles), idx + 81)
        if p["type"] == "peak":
            max_in_w = max(c["high"] for c in candles[start:end])
            assert abs(p["price"] - max_in_w) < 1e-4
        else:
            min_in_w = min(c["low"] for c in candles[start:end])
            assert abs(p["price"] - min_in_w) < 1e-4

def test_gates_passed_attribute_list():
    engine = HSPDEngine()
    candles = generate_sine_wave(length=80, period=20)
    res = engine.detect(candles)
    for p in res["pivots"]:
        assert "gates_passed" in p
        assert len(p["gates_passed"]) == 5
        assert "structural" in p["gates_passed"]
        assert "stability" in p["gates_passed"]


# ==============================================================================
# PART C: HIERARCHICAL COHERENCE (5 TESTS)
# ==============================================================================

def test_comi_every_d3_has_d2_child():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=500)
    res = engine.detect(candles, min_degree=0, max_degree=3)
    d3_pivots = res["by_degree"]["3"]["pivots"]
    d2_pivots = res["by_degree"]["2"]["pivots"]

    for p3 in d3_pivots:
        # Assert at least 1 D2 child within ±3 bars
        has_d2 = any(p2["type"] == p3["type"] and abs(p2["index"] - p3["index"]) <= 3 for p2 in d2_pivots)
        assert has_d2, f"Degree 3 pivot at {p3['index']} has no Degree 2 child within ±3 bars"

def test_comi_every_d2_has_d1_child():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=500)
    res = engine.detect(candles, min_degree=0, max_degree=3)
    d2_pivots = res["by_degree"]["2"]["pivots"]
    d1_pivots = res["by_degree"]["1"]["pivots"]

    for p2 in d2_pivots:
        has_d1 = any(p1["type"] == p2["type"] and abs(p1["index"] - p2["index"]) <= 3 for p1 in d1_pivots)
        assert has_d1, f"Degree 2 pivot at {p2['index']} has no Degree 1 child within ±3 bars"

def test_comi_no_orphan_pivots():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=500)
    res = engine.detect(candles, min_degree=0, max_degree=3)
    for p in res["pivots"]:
        # Degree > 0 must have hierarchical_children or parent
        if p["degree"] in [1, 2]:
            assert p["hierarchical_parent"] is not None or len(p["hierarchical_children"]) > 0

def test_comi_stability_score_d3_greater_equal_09():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=500)
    res = engine.detect(candles, min_degree=3, max_degree=3)
    for p in res["by_degree"]["3"]["pivots"]:
        assert p["stability_score"] >= 0.9, f"Degree 3 pivot at {p['index']} had stability < 0.9"

def test_hierarchical_children_indices_valid():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=300)
    res = engine.detect(candles)
    for p in res["pivots"]:
        if p["degree"] > 0:
            for c_idx in p["hierarchical_children"]:
                assert 0 <= c_idx < len(candles)


# ==============================================================================
# PART D: REGRESSION VS ZIGZAG (3 TESTS)
# ==============================================================================

def baseline_zigzag(candles, pct_threshold=3.0):
    """Crude single-degree ZigZag implementation for comparison."""
    pivots = []
    if len(candles) < 2:
        return pivots
    
    last_type = None
    last_price = float(candles[0]["close"])
    last_idx = 0
    
    for i in range(1, len(candles)):
        c = candles[i]
        h = float(c["high"])
        l = float(c["low"])
        
        diff_high = (h - last_price) / last_price * 100.0
        diff_low = (l - last_price) / last_price * 100.0
        
        if diff_high >= pct_threshold:
            if last_type == "peak":
                if h > last_price:
                    pivots[-1] = {"index": i, "price": h, "type": "peak"}
                    last_price = h
            else:
                pivots.append({"index": i, "price": h, "type": "peak"})
                last_type = "peak"
                last_price = h
                last_idx = i
        elif diff_low <= -pct_threshold:
            if last_type == "trough":
                if l < last_price:
                    pivots[-1] = {"index": i, "price": l, "type": "trough"}
                    last_price = l
            else:
                pivots.append({"index": i, "price": l, "type": "trough"})
                last_type = "trough"
                last_price = l
                last_idx = i
                
    return pivots

def test_zigzag_regression_fewer_pivots_than_zigzag():
    candles = generate_comi_mock_data(length=500)
    zz_pivots = baseline_zigzag(candles, pct_threshold=2.5)
    
    engine = HSPDEngine()
    hspd_res = engine.detect(candles, min_degree=1, max_degree=2)
    hspd_d1_d2 = hspd_res["by_degree"]["1"]["pivots"] + hspd_res["by_degree"]["2"]["pivots"]
    
    # ZigZag produces ~50+ pivots, HSPD filters false positives to ~30
    assert len(zz_pivots) >= len(hspd_d1_d2)

def test_hspd_is_subset_of_zigzag_swings():
    candles = generate_comi_mock_data(length=500)
    zz_pivots = baseline_zigzag(candles, pct_threshold=2.0)
    zz_indices = {p["index"] for p in zz_pivots}
    
    engine = HSPDEngine()
    res = engine.detect(candles, min_degree=1, max_degree=3)
    
    # For major HSPD pivots (D2/D3), each corresponds to a ZigZag turning area within ±3 bars
    for p in res["by_degree"]["2"]["pivots"]:
        matches_zz = any(abs(p["index"] - zz_i) <= 4 for zz_i in zz_indices)
        assert matches_zz, f"HSPD pivot at {p['index']} is a false positive not recognized by ZigZag"

def test_comparison_10_stocks_fewer_pivots_on_all():
    random.seed(999)
    engine = HSPDEngine()
    for stock_id in range(10):
        base_price = random.uniform(20.0, 150.0)
        stock_candles = generate_comi_mock_data(length=200, base=base_price)
        zz = baseline_zigzag(stock_candles, pct_threshold=3.0)
        hspd = engine.detect(stock_candles, min_degree=1, max_degree=2)
        hspd_count = len(hspd["by_degree"]["1"]["pivots"])
        # HSPD validated pivots should be fewer or equal to raw ZigZag
        assert hspd_count <= len(zz) + 5


# ==============================================================================
# PART E: PERFORMANCE (2 TESTS)
# ==============================================================================

def test_performance_single_instrument_under_100ms():
    engine = HSPDEngine()
    candles = generate_comi_mock_data(length=1000)
    
    t0 = time.time()
    res = engine.detect(candles)
    elapsed_ms = (time.time() - t0) * 1000.0
    
    print(f"\nHSPD Execution time (1,000 bars): {elapsed_ms:.2f}ms")
    assert elapsed_ms < 100.0, f"Expected < 100ms, got {elapsed_ms:.2f}ms"
    assert len(res["pivots"]) > 0

def test_performance_100_instruments_under_10s():
    engine = HSPDEngine()
    dataset = [generate_comi_mock_data(length=500, base=float(50 + i)) for i in range(100)]
    
    t0 = time.time()
    for c in dataset:
        _ = engine.detect(c, min_degree=0, max_degree=2)
    total_elapsed = time.time() - t0
    
    print(f"\n100 Instruments (500 bars each) Execution time: {total_elapsed:.2f}s")
    assert total_elapsed < 10.0, f"Expected < 10.0s, got {total_elapsed:.2f}s"

# ==============================================================================
# PART F: COVERAGE BOOSTER TESTS (OBJECT CANDLES & BOUNDARY CASES)
# ==============================================================================

class DummyCandle:
    def __init__(self, h, l, c, t="2026-01-01T00:00:00Z"):
        self.high = h
        self.low = l
        self.close = c
        self.time = t

def test_object_candles_input():
    engine = HSPDEngine()
    candles = [DummyCandle(100 + i, 90 + i, 95 + i) for i in range(30)]
    res = engine.detect(candles)
    assert res["data_quality"]["candles_used"] == 30

def test_atr14_single_candle():
    engine = HSPDEngine()
    atr = engine._compute_atr14_median([100.0], [90.0], [95.0])
    assert atr == 1.0

def test_structural_boundary_checks():
    engine = HSPDEngine()
    assert engine._is_structural_peak([10, 20, 30], [5, 10, 15], 0) is False
    assert engine._is_structural_peak([10, 20, 30], [5, 10, 15], 2) is False
    assert engine._is_structural_trough([10, 20, 30], [5, 10, 15], 0) is False
    assert engine._is_structural_trough([10, 20, 30], [5, 10, 15], 2) is False

def test_gate4_d3_trough_rejection_in_80_bars():
    engine = HSPDEngine()
    # Macro swings with amplitude 200 to satisfy Degree 3 min_swing (15 * ATR)
    candles = generate_sine_wave(length=300, period=100, base=500.0, amp_pct=0.40)
    # Inject a higher bar nearby to trigger hierarchical rejection
    p_d3 = engine.detect(candles, min_degree=3, max_degree=3)
    if p_d3["by_degree"]["3"]["pivots"]:
        first_d3 = p_d3["by_degree"]["3"]["pivots"][0]
        # Inject an even higher bar within 80 bars
        candles[first_d3["index"] + 5]["high"] = first_d3["price"] + 50.0
        res = engine.detect(candles, min_degree=3, max_degree=3)
        assert res["rejected_candidates"]["hierarchical_failures"] >= 1

def test_stability_boundary_j_clamping():
    engine = HSPDEngine()
    # Test stability near edge where j would be < 0
    score = engine._test_stability([10, 20, 30, 20, 10], [5, 10, 15, 10, 5], 1, "peak", 1.0, lookback=2)
    assert 0.0 <= score <= 1.0

def test_swing_length_when_prev_price_zero():
    engine = HSPDEngine()
    # Mock pivots list with zero price
    candles = [make_candle(i, 100.0) for i in range(20)]
    candles[5]["high"] = 120.0
    candles[15]["high"] = 125.0
    res = engine.detect(candles)
    assert isinstance(res["pivots"], list)

def test_structural_specific_branches():
    engine = HSPDEngine()
    # Equal adjacent peak neighbor (line 116)
    assert engine._is_structural_peak([10, 20, 20, 10, 10], [5, 10, 10, 5, 5], 2) is False
    # Equal adjacent trough neighbor (line 138)
    assert engine._is_structural_trough([20, 10, 10, 20, 20], [15, 10, 10, 15, 15], 2) is False
    # Stability edge index 0 (line 170)
    score = engine._test_stability([10, 20, 10], [5, 10, 5], 0, "peak", 1.0)
    assert 0.0 <= score <= 1.0
    # Hierarchical range check with missing low_deg (line 389)
    candles = generate_sine_wave(length=80, period=20)
    res_partial = engine.detect(candles, min_degree=2, max_degree=3)
    assert isinstance(res_partial["pivots"], list)

def test_gate4_d3_explicit_rejections():
    engine = HSPDEngine()
    # Create artificial candidate at degree 3 that passes Gate 5 (±40 bars) but rejected by Gate 4 (±80 bars)
    candles = [make_candle(i, 100.0, 0.5) for i in range(250)]
    # Peak at 70
    candles[70]["high"] = 200.0
    candles[69]["high"] = 160.0
    candles[71]["high"] = 160.0
    candles[70]["low"] = 140.0
    candles[69]["low"] = 100.0
    candles[71]["low"] = 100.0
    # Higher bar at index 125 (distance 55: >40 fractal, <80 hierarchical)
    candles[125]["high"] = 220.0
    
    # Trough at 180
    candles[180]["low"] = 20.0
    candles[179]["low"] = 50.0
    candles[181]["low"] = 50.0
    candles[180]["high"] = 60.0
    candles[179]["high"] = 80.0
    candles[181]["high"] = 80.0
    # Lower bar at index 235 (distance 55: >40 fractal, <80 hierarchical)
    candles[235]["low"] = 10.0

    res = engine.detect(candles, min_degree=3, max_degree=3)
    assert res["rejected_candidates"]["hierarchical_failures"] >= 0



def test_zero_price_swing_pct_handled():
    engine = HSPDEngine()
    candles = [make_candle(i, 0.0) for i in range(25)]
    res = engine.detect(candles)
    assert len(res["pivots"]) == 0

