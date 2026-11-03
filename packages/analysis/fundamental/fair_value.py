"""
Borsaty Fair Value Engine
Calculates institutional intrinsic valuation using DCF, Relative Multiples (P/E, P/B),
Graham Number, and Reverse DCF Implied Growth.
"""

from __future__ import annotations

import math
import logging
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional

logger = logging.getLogger("borsaty.fair_value")

# Known institutional baseline fundamentals for MENA and Global reference assets
KNOWN_FUNDAMENTALS: Dict[str, Dict[str, Any]] = {
    "COMI": {
        "current_price": 123.50,
        "eps": 15.60,
        "bvps": 74.20,
        "fcf_per_share": 14.80,
        "sector_pe": 9.2,
        "sector_pb": 1.65,
        "wacc": 0.12,
        "growth_rate": 0.14,
        "terminal_growth": 0.04,
        "currency": "EGP",
        "market": "EGX",
        "sector": "Banking",
    },
    "SWDY": {
        "current_price": 108.60,
        "eps": 13.40,
        "bvps": 69.50,
        "fcf_per_share": 12.10,
        "sector_pe": 10.8,
        "sector_pb": 1.85,
        "wacc": 0.12,
        "growth_rate": 0.15,
        "terminal_growth": 0.04,
        "currency": "EGP",
        "market": "EGX",
        "sector": "Industrial",
    },
    "ABUK": {
        "current_price": 77.70,
        "eps": 9.20,
        "bvps": 44.00,
        "fcf_per_share": 8.70,
        "sector_pe": 9.5,
        "sector_pb": 1.75,
        "wacc": 0.12,
        "growth_rate": 0.09,
        "terminal_growth": 0.035,
        "currency": "EGP",
        "market": "EGX",
        "sector": "Fertilizers",
    },
    "2222": {
        "current_price": 26.16,
        "eps": 1.88,
        "bvps": 10.45,
        "fcf_per_share": 2.10,
        "sector_pe": 16.0,
        "sector_pb": 2.65,
        "wacc": 0.09,
        "growth_rate": 0.05,
        "terminal_growth": 0.025,
        "currency": "SAR",
        "market": "TASI",
        "sector": "Energy",
    },
    "1120": {
        "current_price": 60.15,
        "eps": 4.80,
        "bvps": 32.50,
        "fcf_per_share": 4.60,
        "sector_pe": 14.5,
        "sector_pb": 1.95,
        "wacc": 0.095,
        "growth_rate": 0.07,
        "terminal_growth": 0.03,
        "currency": "SAR",
        "market": "TASI",
        "sector": "Banking",
    },
    "AAPL": {
        "current_price": 235.00,
        "eps": 7.40,
        "bvps": 5.20,
        "fcf_per_share": 7.10,
        "sector_pe": 32.5,
        "sector_pb": 38.0,
        "wacc": 0.088,
        "growth_rate": 0.095,
        "terminal_growth": 0.03,
        "currency": "USD",
        "market": "US",
        "sector": "Technology",
    },
    "NVDA": {
        "current_price": 208.50,
        "eps": 3.80,
        "bvps": 4.10,
        "fcf_per_share": 3.65,
        "sector_pe": 45.0,
        "sector_pb": 35.0,
        "wacc": 0.095,
        "growth_rate": 0.28,
        "terminal_growth": 0.035,
        "currency": "USD",
        "market": "US",
        "sector": "Semiconductors",
    },
    "MSFT": {
        "current_price": 415.00,
        "eps": 12.80,
        "bvps": 38.50,
        "fcf_per_share": 11.90,
        "sector_pe": 34.0,
        "sector_pb": 11.5,
        "wacc": 0.085,
        "growth_rate": 0.12,
        "terminal_growth": 0.03,
        "currency": "USD",
        "market": "US",
        "sector": "Technology",
    },
}


@dataclass
class FairValueResult:
    symbol: str
    current_price: float
    currency: str
    market: str
    dcf_value: float
    relative_pe_value: float
    relative_pb_value: float
    graham_number: float
    reverse_dcf_implied_growth: float
    fair_value_range: Dict[str, float]
    margin_of_safety_pct: float
    verdict: str  # "UNDERVALUED" | "FAIR" | "OVERVALUED"
    verdict_ar: str
    confidence: float
    model_breakdown: Dict[str, Any] = field(default_factory=dict)
    inputs_used: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class FairValueEngine:
    """
    Quantitative intrinsic valuation engine combining:
    - 5-year Free Cash Flow Discounted Cash Flow (DCF) with terminal value.
    - Relative P/E multiple against sector median.
    - Relative P/B multiple against sector median.
    - Classic Benjamin Graham Number.
    - Reverse DCF implied growth solver.
    """

    def __init__(self):
        pass

    @staticmethod
    def _calculate_dcf(
        fcf_per_share: float,
        growth_rate: float,
        wacc: float,
        terminal_growth: float,
        years: int = 5,
    ) -> float:
        """Calculate intrinsic value per share using a 2-stage FCF model."""
        if fcf_per_share <= 0:
            return 0.0

        wacc = max(wacc, terminal_growth + 0.01)  # Guarantee discount rate > perpetual growth
        pv_fcf = 0.0
        current_fcf = fcf_per_share

        for t in range(1, years + 1):
            current_fcf *= (1.0 + growth_rate)
            pv_fcf += current_fcf / ((1.0 + wacc) ** t)

        # Terminal value at year n
        terminal_fcf = current_fcf * (1.0 + terminal_growth)
        terminal_value = terminal_fcf / (wacc - terminal_growth)
        pv_terminal = terminal_value / ((1.0 + wacc) ** years)

        return round(pv_fcf + pv_terminal, 2)

    @staticmethod
    def _solve_reverse_dcf_growth(
        target_price: float,
        fcf_per_share: float,
        wacc: float,
        terminal_growth: float,
    ) -> float:
        """Find the 5-year growth rate implied by the current market price."""
        if target_price <= 0 or fcf_per_share <= 0:
            return 0.0

        # Binary search for growth rate in [-25%, +60%]
        low_g = -0.25
        high_g = 0.60
        best_g = 0.05

        for _ in range(40):
            mid_g = (low_g + high_g) / 2.0
            price_est = FairValueEngine._calculate_dcf(fcf_per_share, mid_g, wacc, terminal_growth)
            if abs(price_est - target_price) < 0.05:
                best_g = mid_g
                break
            if price_est < target_price:
                low_g = mid_g
            else:
                high_g = mid_g
            best_g = mid_g

        return round(best_g * 100.0, 2)

    def compute(
        self,
        symbol: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> FairValueResult:
        sym = symbol.upper().strip()
        defaults = KNOWN_FUNDAMENTALS.get(sym, {})
        payload = data or {}

        # Merge input data with known fundamentals or sensible defaults
        current_price = float(payload.get("current_price") or defaults.get("current_price") or 100.0)
        currency = str(payload.get("currency") or defaults.get("currency") or "EGP")
        market = str(payload.get("market") or defaults.get("market") or "EGX")
        sector = str(payload.get("sector") or defaults.get("sector") or "General")

        eps = float(payload.get("eps") or defaults.get("eps") or max(current_price * 0.09, 0.5))
        bvps = float(payload.get("bvps") or defaults.get("bvps") or max(current_price * 0.55, 1.0))
        fcf_per_share = float(payload.get("fcf_per_share") or defaults.get("fcf_per_share") or max(eps * 0.85, 0.4))
        
        sector_pe = float(payload.get("sector_pe") or defaults.get("sector_pe") or 12.0)
        sector_pb = float(payload.get("sector_pb") or defaults.get("sector_pb") or 1.8)
        wacc = float(payload.get("wacc") or defaults.get("wacc") or 0.11)
        growth_rate = float(payload.get("growth_rate") or defaults.get("growth_rate") or 0.10)
        terminal_growth = float(payload.get("terminal_growth") or defaults.get("terminal_growth") or 0.035)

        # 1. DCF Model
        dcf_val = self._calculate_dcf(fcf_per_share, growth_rate, wacc, terminal_growth)
        if dcf_val <= 0:
            dcf_val = round(eps * 10.5, 2)

        # 2. Relative P/E Model
        relative_pe = round(sector_pe * max(eps, 0.01), 2)

        # 3. Relative P/B Model
        relative_pb = round(sector_pb * max(bvps, 0.01), 2)

        # 4. Graham Number = sqrt(22.5 * EPS * BVPS)
        graham_prod = 22.5 * max(eps, 0.01) * max(bvps, 0.01)
        graham_val = round(math.sqrt(graham_prod), 2)

        # 5. Reverse DCF Implied Growth
        implied_g = self._solve_reverse_dcf_growth(current_price, fcf_per_share, wacc, terminal_growth)

        # 6. Weighted Fair Value calculation
        # Sector weighting adjustments
        weights = {"dcf": 0.35, "pe": 0.30, "pb": 0.20, "graham": 0.15}
        if "bank" in sector.lower() or "financial" in sector.lower():
            # Banks rely heavier on P/B and P/E than raw FCF
            weights = {"dcf": 0.20, "pe": 0.40, "pb": 0.30, "graham": 0.10}
        elif "tech" in sector.lower() or "semiconductor" in sector.lower():
            # Tech asset-light relies heavier on DCF and P/E
            weights = {"dcf": 0.45, "pe": 0.40, "pb": 0.05, "graham": 0.10}

        fair_mid = round(
            (dcf_val * weights["dcf"])
            + (relative_pe * weights["pe"])
            + (relative_pb * weights["pb"])
            + (graham_val * weights["graham"]),
            2
        )

        all_models = [dcf_val, relative_pe, relative_pb, graham_val]
        valid_models = [m for m in all_models if m > 0]

        fair_low = round(min(valid_models) if valid_models else fair_mid * 0.85, 2)
        fair_high = round(max(valid_models) if valid_models else fair_mid * 1.15, 2)

        # Keep a rational corridor around mid value (± 25% max spread)
        fair_low = max(fair_low, round(fair_mid * 0.80, 2))
        fair_high = min(fair_high, round(fair_mid * 1.25, 2))

        # 7. Margin of Safety: ((Fair Value - Current Price) / Fair Value) * 100
        margin_of_safety = round(((fair_mid - current_price) / fair_mid) * 100.0, 1)

        # 8. Verdict determination
        if margin_of_safety > 10.0:
            verdict = "UNDERVALUED"
            verdict_ar = "مقوم بأقل من قيمته العادلة"
        elif margin_of_safety < -10.0:
            verdict = "OVERVALUED"
            verdict_ar = "مقوم بأعلى من قيمته العادلة"
        else:
            verdict = "FAIR"
            verdict_ar = "قريب من القيمة العادلة"

        # 9. Confidence
        confidence = 0.90 if sym in KNOWN_FUNDAMENTALS else 0.75
        if payload and all(k in payload for k in ["eps", "bvps", "fcf_per_share"]):
            confidence = 0.95

        return FairValueResult(
            symbol=sym,
            current_price=current_price,
            currency=currency,
            market=market,
            dcf_value=dcf_val,
            relative_pe_value=relative_pe,
            relative_pb_value=relative_pb,
            graham_number=graham_val,
            reverse_dcf_implied_growth=implied_g,
            fair_value_range={"low": fair_low, "mid": fair_mid, "high": fair_high},
            margin_of_safety_pct=margin_of_safety,
            verdict=verdict,
            verdict_ar=verdict_ar,
            confidence=confidence,
            model_breakdown={
                "dcf": {"value": dcf_val, "weight": weights["dcf"], "description": "5-Year FCF Projections + Terminal Value"},
                "pe": {"value": relative_pe, "weight": weights["pe"], "description": f"Sector Median P/E ({sector_pe}x) × EPS"},
                "pb": {"value": relative_pb, "weight": weights["pb"], "description": f"Sector Median P/B ({sector_pb}x) × BVPS"},
                "graham": {"value": graham_val, "weight": weights["graham"], "description": "Benjamin Graham Intrinsic Value Formula"},
            },
            inputs_used={
                "eps": eps,
                "bvps": bvps,
                "fcf_per_share": fcf_per_share,
                "sector_pe": sector_pe,
                "sector_pb": sector_pb,
                "wacc": wacc,
                "growth_rate": growth_rate,
                "terminal_growth": terminal_growth,
            },
        )


global_fair_value_engine = FairValueEngine()
