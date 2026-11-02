"""
Unit tests for TechnicalScoreEngine (Phase ق: Technical Depth & Signal Power)
"""

import pytest
from engines.technical_score import TechnicalScoreEngine, global_technical_score_engine


def make_bullish_candles(n=60, start_price=50.0):
    candles = []
    p = start_price
    for i in range(n):
        p += 0.5 + (i * 0.05)
        candles.append({
            "time": f"2026-01-{i+1:02d}",
            "open": p - 0.2,
            "high": p + 0.4,
            "low": p - 0.3,
            "close": p,
            "volume": 100000 + i * 2000,
        })
    return candles


def make_bearish_candles(n=60, start_price=100.0):
    candles = []
    p = start_price
    for i in range(n):
        p -= 0.5 + (i * 0.05)
        candles.append({
            "time": f"2026-01-{i+1:02d}",
            "open": p + 0.2,
            "high": p + 0.3,
            "low": p - 0.4,
            "close": p,
            "volume": 150000 + i * 2500,
        })
    return candles


def test_technical_score_bullish():
    candles = make_bullish_candles(60)
    res = global_technical_score_engine.compute_score(candles, symbol="COMI")

    assert res["symbol"] == "COMI"
    assert -100 <= res["score"] <= 100
    assert res["score"] > 20  # Strongly trending up
    assert res["verdict"] in ["BUY", "STRONG BUY"]
    assert "components" in res
    assert res["components"]["trend"] > 0
    assert "trend" in res["components"]
    assert "momentum" in res["components"]
    assert "volume" in res["components"]
    assert "structure" in res["components"]
    assert "patterns" in res["components"]


def test_technical_score_bearish():
    candles = make_bearish_candles(60)
    res = global_technical_score_engine.compute_score(candles, symbol="SWDY")

    assert res["symbol"] == "SWDY"
    assert -100 <= res["score"] <= 100
    assert res["score"] < -20  # Strongly trending down
    assert res["verdict"] in ["SELL", "STRONG SELL"]
    assert res["components"]["trend"] < 0


def test_technical_score_empty_or_small():
    res = global_technical_score_engine.compute_score([], symbol="TEST")
    assert res["score"] == 0
    assert res["verdict"] == "NEUTRAL"
    assert res["components"]["trend"] == 0
