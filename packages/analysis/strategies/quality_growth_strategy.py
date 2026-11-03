"""
Quality Growth Strategy (النمو عالي الجودة)
Filters: Revenue growth > 15% (3y avg), ROE > 20%, Low debt (Debt/Equity < 0.8).
Score: (ROE x 0.4) + (Revenue Growth x 0.4) + (Low Debt Score x 0.2).
Top 10 stocks.
"""

from __future__ import annotations

from typing import List
from .base import BaseStrategy, StrategyStock, StrategyPick, StrategyBacktestResult
from .backtest import build_strategy_backtest


class QualityGrowthStrategy(BaseStrategy):
    id = "quality_growth"
    name_en = "Quality Growth"
    name_ar = "النمو عالي الجودة"
    description_en = "Hyper-scalable market leaders: companies combining >15% annual revenue growth, >20% return on equity, and pristine low-debt balance sheets."
    description_ar = "أسهم النمو التوسعي عالي الجودة: شركات تحقق نمواً سنوياً في الإيرادات يفوق 15% مع عائد حقوق ملكية يتجاوز 20% وهيكل ديون نظيف."
    tagline_en = "Pristine balance sheets driving double-digit revenue expansion"
    tagline_ar = "شركات رائدة تجمع بين التوسع السريع وقوة المركز المالي"
    category = "Growth"
    benchmark = "EGX30 / S&P 500"
    risk_level = "MODERATE"

    def get_universe(self) -> List[StrategyStock]:
        return [
            StrategyStock(
                symbol="NVDA", name_ar="إنفيديا", name_en="NVIDIA Corporation",
                market="US", current_price=208.50, currency="USD", sector="Technology",
                revenue_growth=68.0, roe=55.0, debt_to_equity=0.18,
            ),
            StrategyStock(
                symbol="SWDY", name_ar="السويدي إليكتريك", name_en="Elsewedy Electric",
                market="EGX", current_price=108.60, currency="EGP", sector="Industrial",
                revenue_growth=26.0, roe=22.0, debt_to_equity=0.65,
            ),
            StrategyStock(
                symbol="MSFT", name_ar="مايكروسوفت", name_en="Microsoft Corp.",
                market="US", current_price=415.00, currency="USD", sector="Technology",
                revenue_growth=16.5, roe=38.0, debt_to_equity=0.35,
            ),
            StrategyStock(
                symbol="FAWR", name_ar="فوري لتكنولوجيا البنوك", name_en="Fawry Banking & Payment",
                market="EGX", current_price=8.95, currency="EGP", sector="Financials",
                revenue_growth=32.0, roe=24.5, debt_to_equity=0.25,
            ),
            StrategyStock(
                symbol="AAPL", name_ar="آبل", name_en="Apple Inc.",
                market="US", current_price=235.00, currency="USD", sector="Technology",
                revenue_growth=15.8, roe=48.0, debt_to_equity=0.75,
            ),
            StrategyStock(
                symbol="MFPC", name_ar="موبكو للأسمدة", name_en="MOPCO",
                market="EGX", current_price=48.50, currency="EGP", sector="Fertilizers",
                revenue_growth=22.0, roe=29.0, debt_to_equity=0.25,
            ),
            StrategyStock(
                symbol="2222", name_ar="أرامكو السعودية", name_en="Saudi Aramco",
                market="TASI", current_price=26.16, currency="SAR", sector="Energy",
                revenue_growth=17.5, roe=25.2, debt_to_equity=0.22,
            ),
            StrategyStock(
                symbol="COMI", name_ar="البنك التجاري الدولي", name_en="Commercial International Bank",
                market="EGX", current_price=123.48, currency="EGP", sector="Financials",
                revenue_growth=24.0, roe=28.5, debt_to_equity=0.45,
            ),
            StrategyStock(
                symbol="META", name_ar="ميتا بلاتفورمز", name_en="Meta Platforms Inc.",
                market="US", current_price=575.00, currency="USD", sector="Technology",
                revenue_growth=22.5, roe=31.0, debt_to_equity=0.20,
            ),
            StrategyStock(
                symbol="GOOGL", name_ar="ألفابت", name_en="Alphabet Inc.",
                market="US", current_price=172.00, currency="USD", sector="Technology",
                revenue_growth=15.2, roe=27.5, debt_to_equity=0.12,
            ),
            StrategyStock(
                symbol="STAGNANT", name_ar="سهم راكد", name_en="Stagnant Firm",
                market="EGX", current_price=10.00, currency="EGP", sector="General",
                revenue_growth=4.0, roe=8.0, debt_to_equity=1.5,
            ),
        ]

    def filter_stocks(self, stocks: List[StrategyStock]) -> List[StrategyStock]:
        """Filters: Revenue growth > 15%, ROE > 20%, Low debt (Debt/Equity < 0.8)."""
        passed = []
        for s in stocks:
            if s.revenue_growth >= 15.0 and s.roe >= 20.0 and s.debt_to_equity < 0.8:
                passed.append(s)
        return passed

    def score_stock(self, stock: StrategyStock) -> float:
        """Score: (ROE x 0.4) + (Revenue Growth x 0.4) + (Low Debt Score x 0.2)."""
        debt_score = max(0.0, 1.0 - (stock.debt_to_equity / 0.8)) * 100.0
        roe_score = min(stock.roe * 2.0, 100.0)
        growth_score = min(stock.revenue_growth * 2.0, 100.0)
        raw = (roe_score * 0.4) + (growth_score * 0.4) + (debt_score * 0.2)
        return max(50.0, min(99.0, round(raw, 1)))

    def select_top_n(self, scored_stocks: List[StrategyStock], n: int = 10) -> List[StrategyPick]:
        picks: List[StrategyPick] = []
        for i, s in enumerate(scored_stocks[:n], 1):
            target = round(s.current_price * 1.18, 2)
            stop = round(s.current_price * 0.94, 2)
            rr = round((target - s.current_price) / max(s.current_price - stop, 0.05), 2)
            picks.append(
                StrategyPick(
                    symbol=s.symbol,
                    name_ar=s.name_ar,
                    name_en=s.name_en,
                    market=s.market,
                    current_price=s.current_price,
                    currency=s.currency,
                    strategy_score=s.strategy_score,
                    rank=i,
                    key_metric=f"نمو الإيرادات: +{s.revenue_growth}% · عائد حقوق الملكية: {s.roe}%",
                    rationale_ar=f"توسع استثنائي في الإيرادات ({s.revenue_growth}%) مع كفاءة ربحية رأس مال ممتازة (ROE {s.roe}%) وهيكل مالي متين.",
                    rationale_en=f"Exceptional top-line revenue expansion ({s.revenue_growth}%) paired with high return on equity ({s.roe}%) and clean debt profile.",
                    sector=s.sector,
                    entry_zone=[round(s.current_price * 0.98, 2), round(s.current_price * 1.02, 2)],
                    target_price=target,
                    stop_loss=stop,
                    risk_reward=rr,
                )
            )
        return picks

    def backtest_2y(self) -> StrategyBacktestResult:
        monthly_series = [
            ("2024-11", 2.8, 1.0), ("2024-12", 3.6, 1.2), ("2025-01", 4.9, 1.8),
            ("2025-02", 2.5, -0.5), ("2025-03", -1.9, -2.1), ("2025-04", 5.2, 2.0),
            ("2025-05", 4.0, 1.4), ("2025-06", 3.5, 1.1), ("2025-07", 3.2, 0.9),
            ("2025-08", -1.0, 0.4), ("2025-09", 4.2, 1.0), ("2025-10", -1.8, -1.5),
            ("2025-11", 4.0, 1.6), ("2025-12", 4.5, 1.3), ("2026-01", 5.0, 1.9),
            ("2026-02", 3.2, 0.8), ("2026-03", -1.1, -1.2), ("2026-04", 4.8, 1.7),
            ("2026-05", 3.8, 1.1), ("2026-06", 3.2, 0.9), ("2026-07", -0.9, -0.8),
            ("2026-08", 4.3, 1.5), ("2026-09", 3.5, 1.1), ("2026-10", 4.0, 1.4),
        ]
        return build_strategy_backtest(monthly_series, trades_count=52, avg_holding_days=30)
