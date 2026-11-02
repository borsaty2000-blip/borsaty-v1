"""
Cross-Engine Consistency Integration Tests: Elliott Wave 4 vs Harmonic Point D.
Ensures structural agreement is verified and structural divergence is explicitly reported.
"""

import pytest
from engines.consistency import check_elliott_harmonic_consistency
from elliott.detector import ElliottDetector
from harmonic.detector import HarmonicDetector
from engines.hspd import HSPDEngine


def make_pivot(index: int, price: float, p_type: str, degree: int = 1, timestamp: str = "2026-01-01T00:00:00Z"):
    return {
        "index": index,
        "price": round(price, 4),
        "type": p_type,
        "degree": degree,
        "timestamp": timestamp,
        "stability_score": 1.0,
    }


def test_wave4_and_harmonic_d_exact_match():
    elliott_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "primary_count": {
            "pattern": "impulse",
            "waves": [
                {"number": "1", "end": {"index": 20, "price": 110.0}},
                {"number": "2", "end": {"index": 30, "price": 104.0}},
                {"number": "3", "end": {"index": 50, "price": 130.0}},
                {"number": "4", "end": {"index": 65, "price": 122.0}},
                {"number": "5", "end": {"index": 85, "price": 145.0}},
            ],
        },
    }

    harmonic_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "patterns": [
            {
                "pattern": "gartley",
                "direction": "bullish",
                "points": {
                    "X": {"index": 10, "price": 100.0},
                    "A": {"index": 20, "price": 110.0},
                    "B": {"index": 30, "price": 103.82},
                    "C": {"index": 50, "price": 107.66},
                    "D": {"index": 65, "price": 102.14},
                },
            }
        ],
    }

    report = check_elliott_harmonic_consistency(elliott_mock, harmonic_mock, max_bar_diff=3)
    assert report["status"] == "consistent"
    assert report["is_consistent"] is True
    assert report["has_disagreement"] is False
    assert len(report["comparisons"]) == 1
    assert report["comparisons"][0]["bar_difference"] == 0
    assert report["comparisons"][0]["within_tolerance"] is True


def test_wave4_and_harmonic_d_within_tolerance_match():
    # Wave 4 at 65, Harmonic D at 67 (difference = 2 <= 3)
    elliott_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "primary_count": {
            "pattern": "impulse",
            "waves": [
                {"number": "1", "end": {"index": 20, "price": 110.0}},
                {"number": "2", "end": {"index": 30, "price": 104.0}},
                {"number": "3", "end": {"index": 50, "price": 130.0}},
                {"number": "4", "end": {"index": 65, "price": 122.0}},
                {"number": "5", "end": {"index": 85, "price": 145.0}},
            ],
        },
    }

    harmonic_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "patterns": [
            {
                "pattern": "bat",
                "direction": "bullish",
                "points": {
                    "D": {"index": 67, "price": 121.5},
                },
            }
        ],
    }

    report = check_elliott_harmonic_consistency(elliott_mock, harmonic_mock, max_bar_diff=3)
    assert report["status"] == "consistent"
    assert report["is_consistent"] is True
    assert report["comparisons"][0]["bar_difference"] == 2
    assert report["comparisons"][0]["within_tolerance"] is True


def test_wave4_and_harmonic_d_divergence_logged_without_silent_failure():
    # Wave 4 at 65, Harmonic D at 75 (difference = 10 > 3)
    elliott_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "primary_count": {
            "pattern": "impulse",
            "waves": [
                {"number": "4", "end": {"index": 65, "price": 122.0}},
            ],
        },
    }

    harmonic_mock = {
        "symbol": "COMI",
        "timeframe": "1D",
        "patterns": [
            {
                "pattern": "butterfly",
                "direction": "bearish",
                "points": {
                    "D": {"index": 75, "price": 140.0},
                },
            }
        ],
    }

    report = check_elliott_harmonic_consistency(elliott_mock, harmonic_mock, max_bar_diff=3)
    assert report["status"] == "divergent"
    assert report["is_consistent"] is False
    assert report["has_disagreement"] is True
    assert len(report["comparisons"]) == 1
    assert report["comparisons"][0]["bar_difference"] == 10
    assert report["comparisons"][0]["within_tolerance"] is False
    assert "divergent" in report["comparisons"][0]["status"]
    assert "تعارض هيكلي" in report["summary_ar"]


def test_cross_engine_unavailable_graceful_handling():
    # When harmonic or elliott has no pattern
    elliott_empty = {"symbol": "TEST", "timeframe": "1D", "primary_count": None}
    harmonic_empty = {"symbol": "TEST", "timeframe": "1D", "patterns": []}

    report = check_elliott_harmonic_consistency(elliott_empty, harmonic_empty)
    assert report["status"] == "not_applicable"
    assert report["is_consistent"] is False
    assert report["has_disagreement"] is False
    assert report["comparisons"] == []


def test_cross_engine_simulation_runs():
    detector_e = ElliottDetector()
    detector_h = HarmonicDetector()

    pivots = [
        make_pivot(10, 100.0, "trough"),
        make_pivot(20, 110.0, "peak"),
        make_pivot(30, 103.82, "trough"),
        make_pivot(40, 107.66, "peak"),
        make_pivot(50, 102.14, "trough"),
    ]

    res_e = detector_e.detect("COMI", "1D", pivots, min_degree=1)
    res_h = detector_h.detect("COMI", "1D", pivots, min_degree=1)

    report = check_elliott_harmonic_consistency(res_e, res_h, max_bar_diff=3)
    assert "status" in report
    assert "comparisons" in report
    assert "summary_ar" in report
    assert "summary_en" in report
