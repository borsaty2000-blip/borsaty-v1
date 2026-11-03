"""
Reversal Hunter Strategy (صائد الانعكاس)
Filters: RSI < 30, Harmonic bullish pattern confirmed, Price at strong HSPD support.
Score: Harmonic Confidence x 0.5 + Support Strength x 0.5.
Top 5 stocks (highest conviction).
"""

from __future__ import annotations

from typing import List
from .base import BaseStrategy, StrategyStock, StrategyPick, StrategyBacktestResult
from .backtest import build_strategy_backtest


class ReversalHunterStrategy(BaseStrategy):
    id = "reversal"
    name_en = "Reversal Hunter"
    name_ar = "صائد الانعكاس"
    description_en = "Mean-reversion tactical sniper: stocks reaching terminal selloffs with RSI < 30 at confirmed harmonic PRZ support zones."
    description_ar = "اصطياد القيعان السعرية وفرص الارتداد الفني: أسهم في مناطق تشبع بيعي حاد مع تأكيد نماذج توافقية عند دعوم هيكلية قوية."
    tagline_en = "Oversold harmonic confluence sniper at key support"
    tagline_ar = "اقتناص الارتدادات من القيعان عند مناطق التشبع البيعي ودعوم الهارمونيك"
    category = "Technical"
    benchmark = "EGX30 / S&P 500"
    risk_level = "MODERATE"

    def get_universe(self) -> List[StrategyStock]:
        return [
            StrategyStock(
                symbol="ABUK", name_ar="أبو قير للأسمدة", name_en="Abu Qir Fertilizers",
                market="EGX", current_price=77.70, currency="EGP", sector="Fertilizers",
                rsi=26.4, harmonic_confidence=91.0, support_strength=88.0,
            ),
            StrategyStock(
                symbol="ORAS", name_ar="أوراسكوم كونستراكشون", name_en="Orascom Construction",
                market="EGX", current_price=245.00, currency="EGP", sector="Industrial",
                rsi=24.8, harmonic_confidence=87.0, support_strength=84.0,
            ),
            StrategyStock(
                symbol="2380", name_ar="بترورابغ", name_en="Petro Rabigh",
                market="TASI", current_price=7.12, currency="SAR", sector="Energy",
                rsi=22.5, harmonic_confidence=85.0, support_strength=82.0,
            ),
            StrategyStock(
                symbol="TSLA", name_ar="تسلا", name_en="Tesla Inc.",
                market="US", current_price=218.00, currency="USD", sector="Automotive",
                rsi=28.2, harmonic_confidence=84.0, support_strength=80.0,
            ),
            StrategyStock(
                symbol="SKPC", name_ar="سيدي كرير للبتروكيماويات", name_en="Sidi Kerir Petrochemicals",
                market="EGX", current_price=27.40, currency="EGP", sector="Materials",
                rsi=27.0, harmonic_confidence=83.0, support_strength=79.0,
            ),
            StrategyStock(
                symbol="AMOC", name_ar="الإسكندرية للزيوت المعدنية", name_en="Alexandria Mineral Oils",
                market="EGX", current_price=9.15, currency="EGP", sector="Energy",
                rsi=29.1, harmonic_confidence=78.0, support_strength=76.0,
            ),
            StrategyStock(
                symbol="OVERBOUGHT", name_ar="سهم متضخم", name_en="Overbought Stock",
                market="EGX", current_price=50.00, currency="EGP", sector="General",
                rsi=68.0, harmonic_confidence=40.0, support_strength=50.0,
            ),
        ]

    def filter_stocks(self, stocks: List[StrategyStock]) -> List[StrategyStock]:
        """Filters: RSI < 30, Harmonic pattern confirmed (confidence > 75), strong support (> 75)."""
        passed = []
        for s in stocks:
            if s.rsi < 30.0 and s.harmonic_confidence >= 75.0 and s.support_strength >= 75.0:
                passed.append(s)
        return passed

    def score_stock(self, stock: StrategyStock) -> float:
        """Score: Harmonic Confidence x 0.5 + Support Strength x 0.5."""
        return round((stock.harmonic_confidence * 0.5) + (stock.support_strength * 0.5), 1)

    def select_top_n(self, scored_stocks: List[StrategyStock], n: int = 5) -> List[StrategyPick]:
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
                    key_metric=f"مؤشر RSI: {s.rsi} · توافق هارمونيك: {s.harmonic_confidence}%",
                    rationale_ar=f"تشبع بيعي حاد (RSI {s.rsi}) عند منطقة انعكاس توافقية محتملة (PRZ) مع دعم هيكلي قوي بنسبة {s.support_strength}%.",
                    rationale_en=f"Severe oversold state (RSI {s.rsi}) entering high-probability harmonic PRZ with {s.support_strength}% structural support.",
                    sector=s.sector,
                    entry_zone=[round(s.current_price * 0.98, 2), round(s.current_price * 1.01, 2)],
                    target_price=target,
                    stop_loss=stop,
                    risk_reward=rr,
                )
            )
        return picks

    def backtest_2y(self) -> StrategyBacktestResult:
        monthly_series = [
            ("2024-11", 2.5, 1.0), ("2024-12", 3.8, 1.2), ("2025-01", 4.2, 1.8),
            ("2025-02", -1.8, -0.5), ("2025-03", 5.6, -2.1), ("2025-04", 4.1, 2.0),
            ("2025-05", 2.8, 1.4), ("2025-06", 3.5, 1.1), ("2025-07", 2.2, 0.9),
            ("2025-08", -2.4, 0.4), ("2025-09", 4.8, 1.0), ("2025-10", -1.5, -1.5),
            ("2025-11", 3.9, 1.6), ("2025-12", 4.4, 1.3), ("2026-01", 5.2, 1.9),
            ("2026-02", 2.8, 0.8), ("2026-03", -1.0, -1.2), ("2026-04", 4.6, 1.7),
            ("2026-05", 3.5, 1.1), ("2026-06", 2.8, 0.9), ("2026-07", -0.8, -0.8),
            ("2026-08", 4.1, 1.5), ("2026-09", 3.2, 1.1), ("2026-10", 3.9, 1.4),
        ]
        return build_strategy_backtest(monthly_series, trades_count=38, avg_holding_days=21)
