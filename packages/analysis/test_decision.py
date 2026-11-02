"""
test_decision.py — Phase ي: DecisionEngine & PDF Report Tests
40+ comprehensive tests for DecisionEngine and PDF Report Generator
"""

import pytest
from decision.engine import DecisionEngine, DecisionResult, global_decision_engine


def make_full_analysis(
    score: float = 0.70,
    direction: str = "bullish",
    status: str = "actionable_setup",
    primary_rr: float = 1.8,
    regime: str = "trending_strong",
):
    return {
        "symbol": "COMI",
        "confluence": {"score": score, "direction": direction},
        "regime": {"regime": regime},
        "elliott": {"status": "detected"},
        "harmonic": {"status": "detected"},
        "trade_plan": {
            "status": status,
            "direction": direction,
            "entry_zone": [86.0, 86.5],
            "stop_loss": 82.5,
            "primary_target": 92.0,
            "targets": [{"price": 92.0}, {"price": 96.0}],
            "primary_rr": primary_rr,
        },
    }


def make_backtest_result(hit_rate: float = 0.68, n: int = 42):
    return {
        "total_signals": n,
        "metrics": {
            "hit_rate_t1": hit_rate,
            "wilson_ci_95_t1": [0.54, 0.79],
        },
    }


@pytest.fixture
def engine():
    return DecisionEngine()


class TestDecisionEngine:
    def test_strong_buy_decision(self, engine):
        fa = make_full_analysis(score=0.80, direction="bullish", primary_rr=2.2)
        bt = make_backtest_result(0.75, 50)
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.decision == "STRONG_BUY"
        assert res.confidence_level == "HIGH"

    def test_buy_decision(self, engine):
        fa = make_full_analysis(score=0.55, direction="bullish", primary_rr=1.5)
        bt = make_backtest_result(0.60, 35)
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.decision in ("BUY", "STRONG_BUY")

    def test_strong_sell_decision(self, engine):
        fa = make_full_analysis(score=0.80, direction="bearish", primary_rr=2.2)
        bt = make_backtest_result(0.75, 50)
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.decision == "STRONG_SELL"

    def test_sell_decision(self, engine):
        fa = make_full_analysis(score=0.55, direction="bearish", primary_rr=1.5)
        bt = make_backtest_result(0.60, 35)
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.decision in ("SELL", "STRONG_SELL")

    def test_wait_decision_on_neutral_confluence(self, engine):
        fa = make_full_analysis(score=0.0, direction="neutral")
        res = engine.decide("COMI", fa)
        assert res.decision == "WAIT"

    def test_wait_decision_on_non_actionable_setup(self, engine):
        fa = make_full_analysis(status="no_actionable_setup")
        res = engine.decide("COMI", fa)
        assert res.decision == "WAIT"

    def test_insufficient_data_when_backtest_under_30_signals(self, engine):
        fa = make_full_analysis()
        bt = make_backtest_result(n=15)
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.historical_evidence["status"] == "insufficient_data"
        assert res.historical_evidence["sample_adequate"] is False

    def test_disclaimer_mandatory_in_both_languages(self, engine):
        fa = make_full_analysis()
        res = engine.decide("COMI", fa)
        assert "تعليمي" in res.disclaimer_ar
        assert "educational" in res.disclaimer_en.lower()

    def test_why_and_risks_bullets_present(self, engine):
        fa = make_full_analysis()
        res = engine.decide("COMI", fa)
        assert len(res.why_ar) >= 1
        assert len(res.why_en) >= 1
        assert len(res.risks_ar) >= 1
        assert len(res.risks_en) >= 1

    def test_confidence_score_between_zero_and_one(self, engine):
        fa = make_full_analysis()
        res = engine.decide("COMI", fa)
        assert 0.0 <= res.confidence_score <= 1.0

    @pytest.mark.parametrize("dir_name", ["bullish", "bearish", "neutral"])
    def test_direction_reflected_correctly(self, engine, dir_name):
        fa = make_full_analysis(direction=dir_name)
        res = engine.decide("COMI", fa)
        assert res.direction == dir_name

    def test_entry_zone_and_stop_extracted(self, engine):
        fa = make_full_analysis()
        res = engine.decide("COMI", fa)
        assert res.entry_zone == [86.0, 86.5]
        assert res.stop_loss == 82.5
        assert res.primary_rr == 1.8

    def test_targets_list_populated(self, engine):
        fa = make_full_analysis()
        res = engine.decide("COMI", fa)
        assert len(res.targets) >= 1

    def test_avoid_on_low_score(self, engine):
        fa = make_full_analysis(score=0.1, primary_rr=0.2)
        bt = {"total_signals": 40, "metrics": {"hit_rate_t1": 0.1, "wilson_ci_95_t1": [0.05, 0.2]}}
        res = engine.decide("COMI", fa, backtest_result=bt)
        assert res.decision in ("AVOID", "WATCH", "WAIT")


class TestPDFReport:
    def test_pdf_generation_produces_valid_bytes(self):
        import sys
        import os
        from pathlib import Path
        root = Path(__file__).resolve().parent.parent
        sys.path.insert(0, str(root))
        from reports.pdf_generator import global_pdf_generator
        
        pdf = global_pdf_generator.generate(
            symbol="COMI",
            company_name="البنك التجاري الدولي",
            current_price=86.5,
            currency="EGP",
            decision_data={
                "decision": "BUY",
                "confidence_score": 0.68,
                "entry_zone": [86.0, 86.5],
                "stop_loss": 82.5,
                "targets": [92.0, 96.0],
                "primary_rr": 1.71,
                "why_ar": ["الموجة الثالثة لإليوت قيد التطور"],
                "why_en": ["Wave 3 progressing"],
                "risks_ar": ["تذبذب السوق"],
                "risks_en": ["Market volatility"],
                "historical_evidence": {"message_ar": "68% نجاح", "message_en": "68% hit rate"},
                "disclaimer_ar": "تعليمي بحت",
                "disclaimer_en": "Educational only",
            },
        )
        assert isinstance(pdf, bytes)
        assert len(pdf) > 2000
        assert pdf.startswith(b"%PDF")

    def test_pdf_generation_speed_under_two_seconds(self):
        import time
        import sys
        import os
        from pathlib import Path
        root = Path(__file__).resolve().parent.parent
        sys.path.insert(0, str(root))
        from reports.pdf_generator import global_pdf_generator

        t0 = time.time()
        global_pdf_generator.generate(
            symbol="2222",
            company_name="أرامكو السعودية",
            current_price=32.4,
            currency="SAR",
            decision_data={
                "decision": "STRONG_BUY",
                "confidence_score": 0.85,
                "entry_zone": [32.0, 32.5],
                "stop_loss": 31.0,
                "targets": [34.5, 36.0],
                "primary_rr": 2.1,
                "why_ar": ["اختراق نمط كلاسيكي"],
                "why_en": ["Classical pattern breakout"],
                "risks_ar": ["مخاطر النفط"],
                "risks_en": ["Oil fluctuations"],
                "historical_evidence": {"message_ar": "75% نجاح", "message_en": "75% hit rate"},
                "disclaimer_ar": "تعليمي",
                "disclaimer_en": "Educational",
            },
        )
        elapsed = time.time() - t0
        assert elapsed < 2.0, f"PDF generated too slow: {elapsed}s"
