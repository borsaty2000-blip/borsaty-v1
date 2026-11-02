"""
Position Sizing Engine (Borsaty).
Multi-Method Risk Management: Fixed Fractional, ATR-Based, Kelly Criterion, Volatility Parity.
Version 1.0.0
"""

from typing import Optional, Tuple, List, Dict, Any, Union
import math


class KellyRejectionError(ValueError):
    """Raised when Kelly criterion is rejected due to insufficient closed signals."""
    def __init__(self, current_count: int = 0, required_count: int = 30, signals_per_week: float = 5.0):
        self.current_count = current_count
        self.required_count = required_count
        remaining = max(0, required_count - current_count)
        weeks = max(1, math.ceil(remaining / signals_per_week)) if remaining > 0 else 0
        self.estimated_time_to_threshold = f"{weeks} weeks" if weeks != 1 else "1 week"
        self.estimated_time_ar = f"{weeks} أسابيع" if weeks > 2 else ("أسبوعين" if weeks == 2 else "أسبوع واحد")
        self.reason_en = (
            f"Kelly requires hit rate from SignalStore. Run at least 30 closed signals first. "
            f"Current count: {current_count}/{required_count}. "
            f"Estimated time to threshold: ~{self.estimated_time_to_threshold}."
        )
        self.reason_ar = (
            f"يتطلب معيار كيلي نسبة نجاح موثقة من سجل الإشارات (30 إشارة مغلقة على الأقل). "
            f"العدد الحالي: {current_count}/{required_count}. "
            f"الوقت التقديري للوصول للعتبة: ~{self.estimated_time_ar}."
        )
        super().__init__(self.reason_en)


class PositionSizer:
    """
    Multiple sizing methods, user-selectable.
    No single 'right' method — calculates transparently and allows user to choose.
    """

    VERSION = "1.0.0"

    def compute(
        self,
        capital: float,
        entry: float,
        stop: float,
        risk_tolerance_pct: float = 2.0,
        method: str = "fixed_fractional",
        atr: Optional[float] = None,
        returns_history: Optional[List[float]] = None,
        win_rate: Optional[float] = None,
        avg_win: Optional[float] = None,
        avg_loss: Optional[float] = None,
        closed_signals_count: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Compute position size based on selected method and risk parameters.
        """
        if capital <= 0:
            raise ValueError("Capital must be greater than zero")
        if risk_tolerance_pct <= 0:
            raise ValueError("Risk tolerance percentage must be positive")
        if entry <= 0:
            raise ValueError("Entry price must be positive")
        if stop <= 0:
            raise ValueError("Stop price must be positive")
        if math.isclose(entry, stop):
            raise ValueError("Entry and stop prices cannot be identical")

        risk_amount = capital * (risk_tolerance_pct / 100.0)
        risk_per_unit = abs(entry - stop)
        stop_distance_pct = round((risk_per_unit / entry) * 100.0, 2)

        method_lower = method.lower()

        if method_lower == "fixed_fractional":
            units = risk_amount / risk_per_unit
            position_value = units * entry
            whole_units = int(math.floor(units))
            max_loss = round(units * risk_per_unit, 2)
            max_loss_pct = round((max_loss / capital) * 100.0, 2)

            return {
                "method": "fixed_fractional",
                "capital": round(capital, 2),
                "risk_tolerance_pct": risk_tolerance_pct,
                "entry": round(entry, 2),
                "stop": round(stop, 2),
                "stop_distance_pct": stop_distance_pct,
                "risk_per_unit": round(risk_per_unit, 2),
                "units": round(units, 2),
                "position_value": round(position_value, 2),
                "max_loss": max_loss,
                "max_loss_pct": max_loss_pct,
                "whole_units": whole_units,
                "note": f"Rounded to nearest whole share → {whole_units} shares",
            }

        elif method_lower == "atr_based":
            if atr is None or atr <= 0:
                atr = risk_per_unit / 1.5  # fallback if ATR not provided

            stop_distance = 1.5 * atr
            units = risk_amount / stop_distance
            position_value = units * entry
            whole_units = int(math.floor(units))
            max_loss = round(units * stop_distance, 2)

            return {
                "method": "atr_based",
                "capital": round(capital, 2),
                "risk_tolerance_pct": risk_tolerance_pct,
                "entry": round(entry, 2),
                "stop": round(stop, 2),
                "atr": round(atr, 2),
                "stop_distance": round(stop_distance, 2),
                "units": round(units, 2),
                "position_value": round(position_value, 2),
                "max_loss": max_loss,
                "max_loss_pct": round((max_loss / capital) * 100.0, 2),
                "whole_units": whole_units,
                "note": f"Sizing based on 1.5x ATR → {whole_units} shares",
            }

        elif method_lower == "kelly":
            current_cnt = closed_signals_count if closed_signals_count is not None else 0
            if win_rate is None or avg_win is None or avg_loss is None or current_cnt < 30:
                raise KellyRejectionError(current_count=current_cnt, required_count=30)
            if avg_win <= 0:
                raise ValueError("Average win must be greater than zero for Kelly Criterion")

            loss_rate = 1.0 - win_rate
            kelly_f = (win_rate * avg_win - loss_rate * avg_loss) / avg_win
            capped_f = max(0.0, min(kelly_f, 0.25))  # cap at 25% of capital

            capital_per_trade = capital * capped_f
            units = capital_per_trade / entry
            position_value = capital_per_trade
            whole_units = int(math.floor(units))
            max_loss = round(units * risk_per_unit, 2)

            return {
                "method": "kelly",
                "capital": round(capital, 2),
                "win_rate": round(win_rate, 4),
                "kelly_fraction": round(kelly_f, 4),
                "capped_fraction": round(capped_f, 4),
                "entry": round(entry, 2),
                "stop": round(stop, 2),
                "units": round(units, 2),
                "position_value": round(position_value, 2),
                "max_loss": max_loss,
                "whole_units": whole_units,
                "note": f"Kelly fraction {capped_f*100:.1f}% of capital → {whole_units} shares",
            }

        elif method_lower in ["volatility_parity", "vol_parity"]:
            if not returns_history or len(returns_history) < 5:
                # Estimate from ATR if returns not provided
                if atr and atr > 0:
                    instrument_vol = atr
                else:
                    instrument_vol = risk_per_unit
            else:
                window = returns_history[-20:] if len(returns_history) >= 20 else returns_history
                mean_ret = sum(window) / len(window)
                var = sum((r - mean_ret) ** 2 for r in window) / len(window)
                std_ret = math.sqrt(var)
                instrument_vol = max(0.0001, std_ret * entry)

            target_vol_per_trade = capital * 0.01  # 1% vol target
            units = target_vol_per_trade / instrument_vol
            position_value = units * entry
            whole_units = int(math.floor(units))
            max_loss = round(units * risk_per_unit, 2)

            return {
                "method": "volatility_parity",
                "capital": round(capital, 2),
                "entry": round(entry, 2),
                "stop": round(stop, 2),
                "instrument_volatility": round(instrument_vol, 2),
                "units": round(units, 2),
                "position_value": round(position_value, 2),
                "max_loss": max_loss,
                "whole_units": whole_units,
                "note": f"Volatility parity 1% allocation → {whole_units} shares",
            }

        else:
            raise ValueError(f"Unknown sizing method: {method}")


global_position_sizer = PositionSizer()
