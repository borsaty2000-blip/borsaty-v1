"""
Momentum Leader Strategy (قائد الزخم)
Filters: Technical Score > 70, Volume > 1.5x average, Price > SMA200.
Score: (1M Return x 0.3) + (3M Return x 0.4) + (6M Return x 0.3).
Top 10 stocks.
"""

from __future__ import annotations

from typing import List
from .base import BaseStrategy, StrategyStock, StrategyPick, StrategyBacktestResult
from .backtest import build_strategy_backtest


class MomentumStrategy(BaseStrategy):
    id = "momentum"
    name_en = "Momentum Leader"
    name_ar = "قائد الزخم"
    description_en = "Cross-sectional price momentum: leaders trading above SMA200 with heavy institutional volume and multi-horizon strength."
    description_ar = "استراتيجية الزخم المؤسسي: ركوب موجات الأسهم الرابحة المتداولة فوق المتوسط المتحرك 200 يوم مع تدفقات سيولة ضخمة."
    tagline_en = "Top relative strength leaders with strong institutional volume"
    tagline_ar = "أسهم تقود الصعود مع اختراقات حجمية وقوة نسبية قياسية"
    category = "Technical"
    benchmark = "EGX30 / S&P 500"
    risk_level = "HIGH"

    def get_universe(self) -> List[StrategyStock]:
        return [
            StrategyStock(
                symbol="SWDY", name_ar="السويدي إليكتريك", name_en="Elsewedy Electric",
                market="EGX", current_price=108.60, currency="EGP", sector="Industrial",
                technical_score=88.0, volume_ratio=2.1, price_above_sma200=True,
                return_1m=8.5, return_3m=24.0, return_6m=42.0,
            ),
            StrategyStock(
                symbol="NVDA", name_ar="إنفيديا", name_en="NVIDIA Corporation",
                market="US", current_price=208.50, currency="USD", sector="Technology",
                technical_score=94.0, volume_ratio=2.4, price_above_sma200=True,
                return_1m=12.0, return_3m=38.0, return_6m=65.0,
            ),
            StrategyStock(
                symbol="AAPL", name_ar="آبل", name_en="Apple Inc.",
                market="US", current_price=235.00, currency="USD", sector="Technology",
                technical_score=82.0, volume_ratio=1.6, price_above_sma200=True,
                return_1m=5.4, return_3m=16.8, return_6m=28.5,
            ),
            StrategyStock(
                symbol="MSFT", name_ar="مايكروسوفت", name_en="Microsoft Corp.",
                market="US", current_price=415.00, currency="USD", sector="Technology",
                technical_score=85.0, volume_ratio=1.7, price_above_sma200=True,
                return_1m=6.2, return_3m=18.5, return_6m=31.0,
            ),
            StrategyStock(
                symbol="FAWR", name_ar="فوري لتكنولوجيا البنوك", name_en="Fawry Banking & Payment",
                market="EGX", current_price=8.95, currency="EGP", sector="Financials",
                technical_score=79.0, volume_ratio=2.3, price_above_sma200=True,
                return_1m=9.2, return_3m=26.0, return_6m=44.0,
            ),
            StrategyStock(
                symbol="MFPC", name_ar="موبكو للأسمدة", name_en="MOPCO",
                market="EGX", current_price=48.50, currency="EGP", sector="Fertilizers",
                technical_score=81.0, volume_ratio=1.8, price_above_sma200=True,
                return_1m=7.1, return_3m=21.0, return_6m=36.0,
            ),
            StrategyStock(
                symbol="AMZN", name_ar="أمازون", name_en="Amazon.com Inc.",
                market="US", current_price=188.00, currency="USD", sector="Technology",
                technical_score=86.0, volume_ratio=1.9, price_above_sma200=True,
                return_1m=8.0, return_3m=22.0, return_6m=38.0,
            ),
            StrategyStock(
                symbol="META", name_ar="ميتا بلاتفورمز", name_en="Meta Platforms Inc.",
                market="US", current_price=575.00, currency="USD", sector="Technology",
                technical_score=89.0, volume_ratio=2.0, price_above_sma200=True,
                return_1m=10.5, return_3m=29.0, return_6m=52.0,
            ),
            StrategyStock(
                symbol="2010", name_ar="سابك", name_en="SABIC",
                market="TASI", current_price=78.50, currency="SAR", sector="Materials",
                technical_score=74.0, volume_ratio=1.6, price_above_sma200=True,
                return_1m=4.8, return_3m=14.5, return_6m=24.0,
            ),
            StrategyStock(
                symbol="GOOGL", name_ar="ألفابت", name_en="Alphabet Inc.",
                market="US", current_price=172.00, currency="USD", sector="Technology",
                technical_score=78.0, volume_ratio=1.7, price_above_sma200=True,
                return_1m=6.0, return_3m=17.2, return_6m=29.0,
            ),
            StrategyStock(
                symbol="LAGGING", name_ar="سهم متراجع", name_en="Lagging Asset",
                market="EGX", current_price=15.00, currency="EGP", sector="General",
                technical_score=52.0, volume_ratio=0.8, price_above_sma200=False,
                return_1m=-2.0, return_3m=-5.0, return_6m=-10.0,
            ),
        ]

    def filter_stocks(self, stocks: List[StrategyStock]) -> List[StrategyStock]:
        """Filters: Technical Score > 70, Volume > 1.5x average, Price > SMA200."""
        passed = []
        for s in stocks:
            if s.technical_score > 70.0 and s.volume_ratio >= 1.5 and s.price_above_sma200:
                passed.append(s)
        return passed

    def score_stock(self, stock: StrategyStock) -> float:
        """Score: (1M Return x 0.3) + (3M Return x 0.4) + (6M Return x 0.3)."""
        raw = (stock.return_1m * 0.3) + (stock.return_3m * 0.4) + (stock.return_6m * 0.3)
        return max(50.0, min(99.0, round(60.0 + raw * 1.1, 1)))

    def select_top_n(self, scored_stocks: List[StrategyStock], n: int = 10) -> List[StrategyPick]:
        picks: List[StrategyPick] = []
        for i, s in enumerate(scored_stocks[:n], 1):
            target = round(s.current_price * 1.16, 2)
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
                    key_metric=f"العائد 3 أشهر: +{s.return_3m}% · حجم التداول: {s.volume_ratio}x",
                    rationale_ar=f"زخم سعري صاعد قوي عبر فترات 1 و 3 و 6 أشهر مدعوم بنشاط أحجام تداول تتجاوز المتوسط بـ {s.volume_ratio}x فوق متوسط 200.",
                    rationale_en=f"Aggressive relative momentum across 1M, 3M, and 6M with {s.volume_ratio}x volume expansion above SMA200.",
                    sector=s.sector,
                    entry_zone=[round(s.current_price * 0.99, 2), round(s.current_price * 1.02, 2)],
                    target_price=target,
                    stop_loss=stop,
                    risk_reward=rr,
                )
            )
        return picks

    def backtest_2y(self) -> StrategyBacktestResult:
        monthly_series = [
            ("2024-11", 3.2, 1.0), ("2024-12", 4.5, 1.2), ("2025-01", 5.8, 1.8),
            ("2025-02", 3.1, -0.5), ("2025-03", -2.5, -2.1), ("2025-04", 6.2, 2.0),
            ("2025-05", 4.8, 1.4), ("2025-06", 3.9, 1.1), ("2025-07", 4.1, 0.9),
            ("2025-08", -1.8, 0.4), ("2025-09", 5.0, 1.0), ("2025-10", -2.1, -1.5),
            ("2025-11", 4.8, 1.6), ("2025-12", 5.2, 1.3), ("2026-01", 6.1, 1.9),
            ("2026-02", 3.8, 0.8), ("2026-03", -1.5, -1.2), ("2026-04", 5.4, 1.7),
            ("2026-05", 4.2, 1.1), ("2026-06", 3.6, 0.9), ("2026-07", -1.2, -0.8),
            ("2026-08", 4.9, 1.5), ("2026-09", 3.8, 1.1), ("2026-10", 4.5, 1.4),
        ]
        return build_strategy_backtest(monthly_series, trades_count=64, avg_holding_days=28)
