"""
Mathematical Integrity Tests for Confluence Engine.
Axiomatic validation of weights, contributions, aggregation, and confidence intervals.
"""

import pytest
import math
from confluence.engine import ConfluenceEngine


def test_weights_sum_to_one_exact_for_all_regimes():
    """For each regime: assert sum(weights) == 1.0 (exact within float rounding)."""
    engine = ConfluenceEngine()
    for regime, weights_dict in engine.WEIGHTS.items():
        total_weight = sum(weights_dict.values())
        assert math.isclose(total_weight, 1.0, rel_tol=1e-9, abs_tol=1e-9), (
            f"Regime {regime} weights sum to {total_weight}, expected 1.0"
        )
        # Ensure all 6 engines are present in every regime
        expected_engines = {"elliott", "classical", "indicators", "harmonic", "structure", "volume"}
        assert set(weights_dict.keys()) == expected_engines, (
            f"Regime {regime} engines mismatch: {set(weights_dict.keys())}"
        )


def test_contributions_equal_raw_times_weight_for_all_engines():
    """For each engine: assert contribution == raw * weight."""
    engine = ConfluenceEngine()
    regimes = list(engine.WEIGHTS.keys())

    for regime in regimes:
        mock_results = {
            "elliott": {
                "status": "available",
                "counts": [{"type": "impulse", "score": 0.80, "direction": "bullish"}]
            },
            "harmonic": {
                "status": "available",
                "patterns": [{"pattern": "gartley", "type": "bullish", "overall_score": 0.90}]
            },
            "classical": {
                "status": "available",
                "patterns": [{"pattern": "double_bottom", "type": "bullish", "pattern_score": 0.85, "status": "confirmed"}]
            },
            "indicators": {
                "indicators": {
                    "rsi": 65.0,
                    "macd": {"histogram": 1.2},
                    "supertrend": {"direction": 1}
                }
            },
            "hspd": {
                "pivots": [
                    {"type": "trough", "price": 100},
                    {"type": "peak", "price": 110},
                    {"type": "trough", "price": 105},
                    {"type": "peak", "price": 120}
                ]
            }
        }

        candles = [
            {"time": i, "open": 100 + i, "high": 102 + i, "low": 99 + i, "close": 101 + i, "volume": 1000 + i * 50}
            for i in range(25)
        ]

        res = engine.compute("TEST", "1D", mock_results, regime=regime, candles=candles)
        engines_out = res["engines"]
        weights = engine.WEIGHTS[regime]

        for engine_name, data in engines_out.items():
            expected_weight = weights[engine_name]
            assert math.isclose(data["weight"], expected_weight, rel_tol=1e-5), (
                f"Engine {engine_name} weight mismatch in regime {regime}"
            )
            raw = data["raw_score"]
            w = data["weight"]
            expected_contrib = raw * w
            assert math.isclose(data["contribution"], expected_contrib, rel_tol=1e-5, abs_tol=1e-5), (
                f"Contribution mismatch for {engine_name} in {regime}: got {data['contribution']}, expected {expected_contrib}"
            )


def test_total_score_equals_exact_sum_of_contributions():
    """Assert total == sum(contributions)."""
    engine = ConfluenceEngine()

    for regime in engine.WEIGHTS.keys():
        mock_results = {
            "elliott": {"status": "available", "counts": [{"type": "impulse", "score": 0.75, "direction": "bullish"}]},
            "harmonic": {"status": "available", "patterns": [{"pattern": "bat", "type": "bearish", "overall_score": 0.70}]},
            "indicators": {"indicators": {"rsi": 50, "macd": {"histogram": 0.0}, "supertrend": {"direction": 1}}}
        }

        res = engine.compute("TEST", "1D", mock_results, regime=regime)
        engines_out = res["engines"]
        sum_contribs = sum(data["contribution"] for data in engines_out.values())

        assert math.isclose(res["total_score"], sum_contribs, rel_tol=1e-4, abs_tol=1e-4), (
            f"Total score {res['total_score']} does not match sum of contributions {sum_contribs} in regime {regime}"
        )
        assert math.isclose(res["score"], round(sum_contribs, 3), rel_tol=1e-3, abs_tol=1e-3)


def test_confidence_interval_bounds_strictly_contain_point_estimate():
    """Assert CI bounds contain point estimate."""
    engine = ConfluenceEngine()

    for regime in engine.WEIGHTS.keys():
        # High confidence scenario
        res_hi = engine.compute(
            "TEST", "1D",
            {"elliott": {"status": "available", "counts": [{"type": "impulse", "score": 0.90, "direction": "bullish"}]}},
            regime=regime
        )
        low_ci, high_ci = res_hi["confidence_interval"]
        score = res_hi["score"]
        assert low_ci <= score <= high_ci, (
            f"Score {score} outside CI [{low_ci}, {high_ci}] in regime {regime}"
        )

        # Diverse / conflicting scenario
        res_conflict = engine.compute(
            "TEST", "1D",
            {
                "elliott": {"status": "available", "counts": [{"type": "impulse", "score": 0.95, "direction": "bullish"}]},
                "harmonic": {"status": "available", "patterns": [{"pattern": "crab", "type": "bearish", "overall_score": 0.95}]},
            },
            regime=regime
        )
        low_c, high_c = res_conflict["confidence_interval"]
        score_c = res_conflict["score"]
        assert low_c <= score_c <= high_c, (
            f"Conflicted score {score_c} outside CI [{low_c}, {high_c}] in regime {regime}"
        )
