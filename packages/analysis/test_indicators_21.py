import pytest
import math
from engines.indicator_engine import IndicatorEngine, global_indicator_engine

@pytest.fixture
def engine():
    return IndicatorEngine()

@pytest.fixture
def sample_candles_100():
    candles = []
    price = 100.0
    for i in range(120):
        candles.append({
            "time": f"2026-05-{i % 28 + 1:02d}",
            "open": round(price, 2),
            "high": round(price + 2.0, 2),
            "low": round(price - 1.5, 2),
            "close": round(price + 0.5, 2),
            "volume": 100000 + (i * 1000)
        })
        price += 0.3 * (1 if i % 3 != 0 else -1)
    return candles

# ----------------------------------------------------------------------
# 1. KNOWN VALUE TESTS (Standard mathematical benchmarks)
# ----------------------------------------------------------------------
def test_known_value_sma(engine):
    prices = [10.0, 20.0, 30.0, 40.0, 50.0]
    sma3 = engine.compute_sma(prices, 3)
    assert sma3 == [None, None, 20.0, 30.0, 40.0]

def test_known_value_wma(engine):
    prices = [10.0, 20.0, 30.0]
    # WMA(3) = (10*1 + 20*2 + 30*3) / (1 + 2 + 3) = (10 + 40 + 90) / 6 = 140 / 6 = 23.333
    wma = engine.compute_wma(prices, 3)
    assert wma == [None, None, 23.333]

def test_known_value_wilder_rsi(engine):
    # Standard classic RSI sequence
    closes = [
        44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42,
        45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00
    ]
    rsi = engine.compute_rsi(closes, 14)
    assert rsi[13] is None
    assert rsi[14] is not None
    assert 60.0 <= rsi[14] <= 75.0  # Wilder standard RSI range

def test_known_value_roc(engine):
    closes = [100.0, 105.0, 110.0]
    roc = engine.compute_roc(closes, 2)
    # (110 - 100) / 100 * 100 = 10%
    assert roc == [None, None, 10.0]

# ----------------------------------------------------------------------
# 2. EDGE TESTS: INSUFFICIENT DATA & ALL-SAME-PRICE
# ----------------------------------------------------------------------
@pytest.mark.parametrize("ind_name", [
    "SMA_20", "SMA_50", "SMA_200", "EMA_9", "EMA_20", "EMA_21", "EMA_50",
    "WMA", "RSI", "MACD", "BOLLINGER", "SUPERTREND", "PSAR", "STOCHASTIC",
    "ADX", "CCI", "WILLIAMS_R", "ROC", "OBV", "MFI", "VWAP", "ATR",
    "KELTNER", "DONCHIAN", "ICHIMOKU"
])
def test_edge_insufficient_data(engine, ind_name):
    tiny_candles = [{"time": "2026-01-01", "open": 10, "high": 11, "low": 9, "close": 10, "volume": 100}]
    res = engine.compute("TEST", "1D", tiny_candles, ind_name)
    assert res["indicator"] is not None
    assert len(res["warnings"]) > 0 or res["latest"]["value"] is None

@pytest.mark.parametrize("ind_name", [
    "SMA_20", "EMA_20", "WMA", "RSI", "MACD", "BOLLINGER", "SUPERTREND",
    "PSAR", "STOCHASTIC", "ADX", "CCI", "WILLIAMS_R", "ROC", "OBV",
    "MFI", "ATR", "KELTNER", "DONCHIAN", "ICHIMOKU"
])
def test_edge_all_same_price_no_crash(engine, ind_name):
    # Flat line: division by zero checks
    flat_candles = [
        {"time": f"2026-01-{i+1:02d}", "open": 50.0, "high": 50.0, "low": 50.0, "close": 50.0, "volume": 1000}
        for i in range(60)
    ]
    res = engine.compute("FLAT", "1D", flat_candles, ind_name)
    assert res["latest"]["value"] is not None
    # No NaN or Infinite numbers allowed
    val = res["latest"]["value"]
    if isinstance(val, dict):
        for v in val.values():
            if v is not None:
                assert not math.isnan(v) and not math.isinf(v)
    elif val is not None:
        assert not math.isnan(val) and not math.isinf(val)

# ----------------------------------------------------------------------
# 3. VERSION DETERMINISM & LOOK-AHEAD VERIFICATION
# ----------------------------------------------------------------------
def test_version_determinism(engine, sample_candles_100):
    res1 = engine.compute_all("COMI", "1D", sample_candles_100)
    res2 = engine.compute_all("COMI", "1D", sample_candles_100)
    assert res1 == res2
    assert res1["RSI"]["version"] == "1.0.0"

def test_no_lookahead_bias(engine, sample_candles_100):
    # Last bar value at index 50 must NOT change when bars 51..100 are added
    first_50 = sample_candles_100[:50]
    all_100 = sample_candles_100

    res_50 = engine.compute("COMI", "1D", first_50, "RSI", {"period": 14})
    val_at_50 = res_50["latest"]["value"]

    res_100 = engine.compute("COMI", "1D", all_100, "RSI", {"period": 14})
    val_in_100_at_50 = res_100["values"][49]["value"]

    assert val_at_50 == val_in_100_at_50, "Lookahead bias detected! Past indicator value changed."

# ----------------------------------------------------------------------
# 4. SIGNAL CLASSIFICATION ACCURACY
# ----------------------------------------------------------------------
def test_rsi_signals_and_zones(engine):
    # Falling price -> RSI < 30 (oversold & BULLISH signal for mean-reversion)
    falling = [{"time": f"t{i}", "open": 100 - i * 2, "high": 101 - i * 2, "low": 98 - i * 2, "close": 98 - i * 2, "volume": 100} for i in range(25)]
    res = engine.compute("FALL", "1D", falling, "RSI", {"period": 14})
    assert res["latest"]["zone"] == "oversold"
    assert res["latest"]["signal"] == "BULLISH"

def test_vwap_timeframe_warning(engine, sample_candles_100):
    # Daily timeframe -> VWAP returns null + warning
    daily_res = engine.compute("COMI", "1D", sample_candles_100, "VWAP")
    assert daily_res["latest"]["value"] is None
    assert any("intraday" in w.lower() for w in daily_res["warnings"])

    # 15M timeframe -> VWAP computes value
    intra_res = engine.compute("COMI", "15M", sample_candles_100, "VWAP")
    assert intra_res["latest"]["value"] is not None
    assert intra_res["latest"]["value"] > 0
