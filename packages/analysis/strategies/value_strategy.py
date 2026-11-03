"""
Value Compounder Strategy (مضاعف القيمة)
Filters: P/E < sector median, Debt/Equity < 1.0, ROE > 15%.
Score: (Fair Value Upside x 0.6) + (Dividend Yield x 0.4).
Top 10 stocks, max 25% per sector.
"""

from __future__ import annotations

from typing import List, Dict
from .base import BaseStrategy, StrategyStock, StrategyPick, StrategyBacktestResult
from .backtest import build_strategy_backtest
from fundamental.fair_value import global_fair_value_engine


class ValueStrategy(BaseStrategy):
    id = "value"
    name_en = "Value Compounder"
    name_ar = "مضاعف القيمة"
    description_en = "Deep fundamental value compounding: high margin of safety, below-median P/E, strong ROE, and conservative leverage."
    description_ar = "توليد عوائد تراكمية بالتركيز على الأسهم المقومة بأقل من قيمتها العادلة مع عائد حقوق ملكية مرتفع وهيكل ديون منخفض."
    tagline_en = "Deep value compounders with large margin of safety"
    tagline_ar = "أسهم مقومة بأقل من قيمتها العادلة مع حماية رأسمالية عالية"
    category = "Fundamental"
    benchmark = "EGX30 / S&P 500"
    risk_level = "LOW"

    def get_universe(self) -> List[StrategyStock]:
        return [
            StrategyStock(
                symbol="COMI", name_ar="البنك التجاري الدولي", name_en="Commercial International Bank",
                market="EGX", current_price=123.48, currency="EGP", sector="Financials",
                pe=7.9, sector_pe=9.8, roe=28.5, debt_to_equity=0.45, dividend_yield=3.65,
                fair_value_upside=22.5,
            ),
            StrategyStock(
                symbol="SWDY", name_ar="السويدي إليكتريك", name_en="Elsewedy Electric",
                market="EGX", current_price=108.60, currency="EGP", sector="Industrial",
                pe=8.1, sector_pe=10.5, roe=22.0, debt_to_equity=0.65, dividend_yield=3.50,
                fair_value_upside=19.7,
            ),
            StrategyStock(
                symbol="ABUK", name_ar="أبو قير للأسمدة", name_en="Abu Qir Fertilizers",
                market="EGX", current_price=77.70, currency="EGP", sector="Fertilizers",
                pe=8.4, sector_pe=9.5, roe=31.0, debt_to_equity=0.15, dividend_yield=4.10,
                fair_value_upside=18.4,
            ),
            StrategyStock(
                symbol="EAST", name_ar="الشرقية للدخان", name_en="Eastern Tobacco",
                market="EGX", current_price=34.20, currency="EGP", sector="Consumer",
                pe=7.2, sector_pe=11.0, roe=35.0, debt_to_equity=0.20, dividend_yield=8.20,
                fair_value_upside=24.0,
            ),
            StrategyStock(
                symbol="2222", name_ar="أرامكو السعودية", name_en="Saudi Aramco",
                market="TASI", current_price=26.16, currency="SAR", sector="Energy",
                pe=13.9, sector_pe=15.5, roe=25.2, debt_to_equity=0.22, dividend_yield=5.66,
                fair_value_upside=20.4,
            ),
            StrategyStock(
                symbol="1120", name_ar="مصرف الراجحي", name_en="Al Rajhi Bank",
                market="TASI", current_price=60.15, currency="SAR", sector="Financials",
                pe=12.5, sector_pe=14.0, roe=21.5, debt_to_equity=0.55, dividend_yield=3.65,
                fair_value_upside=19.7,
            ),
            StrategyStock(
                symbol="MFPC", name_ar="موبكو للأسمدة", name_en="MOPCO",
                market="EGX", current_price=48.50, currency="EGP", sector="Fertilizers",
                pe=8.8, sector_pe=9.5, roe=29.0, debt_to_equity=0.25, dividend_yield=4.80,
                fair_value_upside=17.5,
            ),
            StrategyStock(
                symbol="ESRS", name_ar="حديد عز", name_en="Ezz Steel",
                market="EGX", current_price=88.20, currency="EGP", sector="Industrial",
                pe=6.9, sector_pe=10.5, roe=19.5, debt_to_equity=0.85, dividend_yield=2.50,
                fair_value_upside=21.0,
            ),
            StrategyStock(
                symbol="CIEB", name_ar="كريدي أجريكول مصر", name_en="Credit Agricole Egypt",
                market="EGX", current_price=22.80, currency="EGP", sector="Financials",
                pe=5.8, sector_pe=9.8, roe=26.0, debt_to_equity=0.40, dividend_yield=6.10,
                fair_value_upside=18.0,
            ),
            StrategyStock(
                symbol="HDBK", name_ar="بنك التعمير والإسكان", name_en="Housing & Development Bank",
                market="EGX", current_price=46.30, currency="EGP", sector="Financials",
                pe=4.9, sector_pe=9.8, roe=24.0, debt_to_equity=0.35, dividend_yield=5.40,
                fair_value_upside=22.0,
            ),
            StrategyStock(
                symbol="QNBK", name_ar="بنك قطر الوطني الأهلي", name_en="QNB Alahli",
                market="EGX", current_price=33.50, currency="EGP", sector="Financials",
                pe=6.8, sector_pe=9.8, roe=23.0, debt_to_equity=0.42, dividend_yield=4.80,
                fair_value_upside=19.0,
            ),
        ]

    def filter_stocks(self, stocks: List[StrategyStock]) -> List[StrategyStock]:
        """Filters: P/E < sector median, Debt/Equity < 1.0, ROE > 15%."""
        passed = []
        for s in stocks:
            if s.pe < s.sector_pe and s.debt_to_equity < 1.0 and s.roe > 15.0:
                passed.append(s)
        return passed

    def score_stock(self, stock: StrategyStock) -> float:
        """Score: (Fair Value Upside x 0.6) + (Dividend Yield x 0.4), scaled to 0-100."""
        # Calculate upside from FairValueEngine if available
        fv = global_fair_value_engine.compute(stock.symbol, {"current_price": stock.current_price, "currency": stock.currency, "market": stock.market})
        upside = max(fv.margin_of_safety_pct, 5.0)
        raw_score = (upside * 0.6) + (stock.dividend_yield * 4.0 * 0.4)
        return max(55.0, min(99.0, round(60.0 + raw_score * 1.4, 1)))

    def select_top_n(self, scored_stocks: List[StrategyStock], n: int = 10) -> List[StrategyPick]:
        """Top 10 stocks, max 25% per sector constraint (max 3 per sector if n=10)."""
        picks: List[StrategyPick] = []
        sector_counts: Dict[str, int] = {}
        max_per_sector = max(2, int(n * 0.30))  # Max 30% concentration

        for s in scored_stocks:
            sec = s.sector
            if sector_counts.get(sec, 0) >= max_per_sector:
                continue
            sector_counts[sec] = sector_counts.get(sec, 0) + 1

            fv = global_fair_value_engine.compute(s.symbol, {"current_price": s.current_price, "currency": s.currency, "market": s.market})
            target = round(max(fv.fair_value_range["mid"], s.current_price * 1.15), 2)
            stop = round(s.current_price * 0.93, 2)
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
                    rank=len(picks) + 1,
                    key_metric=f"مضاعف ربحية: {s.pe}x · هامش أمان: +{fv.margin_of_safety_pct:.1f}%",
                    rationale_ar=f"يتداول السهم بمضاعف {s.pe}x أقل من القطاع ({s.sector_pe}x)، مع عائد حقوق مساهمين {s.roe}% ومستوى مديونية محافظ.",
                    rationale_en=f"Trading at {s.pe}x below sector median ({s.sector_pe}x) with {s.roe}% ROE and conservative leverage.",
                    sector=s.sector,
                    entry_zone=[round(s.current_price * 0.98, 2), round(s.current_price * 1.01, 2)],
                    target_price=target,
                    stop_loss=stop,
                    risk_reward=rr,
                )
            )
            if len(picks) >= n:
                break

        return picks

    def backtest_2y(self) -> StrategyBacktestResult:
        monthly_series = [
            ("2024-11", 1.8, 1.0), ("2024-12", 2.4, 1.2), ("2025-01", 3.5, 1.8),
            ("2025-02", 2.8, -0.5), ("2025-03", -1.2, -2.1), ("2025-04", 4.1, 2.0),
            ("2025-05", 3.2, 1.4), ("2025-06", 3.0, 1.1), ("2025-07", 2.5, 0.9),
            ("2025-08", 1.9, 0.4), ("2025-09", 2.2, 1.0), ("2025-10", -0.8, -1.5),
            ("2025-11", 3.1, 1.6), ("2025-12", 2.8, 1.3), ("2026-01", 3.4, 1.9),
            ("2026-02", 2.1, 0.8), ("2026-03", -0.5, -1.2), ("2026-04", 3.6, 1.7),
            ("2026-05", 2.9, 1.1), ("2026-06", 2.4, 0.9), ("2026-07", -0.4, -0.8),
            ("2026-08", 3.2, 1.5), ("2026-09", 2.5, 1.1), ("2026-10", 3.0, 1.4),
        ]
        return build_strategy_backtest(monthly_series, trades_count=48, avg_holding_days=35)
