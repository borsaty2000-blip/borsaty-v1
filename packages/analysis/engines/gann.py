from typing import Optional, Tuple, List, Dict, Any, Union
import math

def calculate_square_of_nine(base_price: float, levels: int = 4) -> Dict[str, List[float]]:
    """
    Gann Square of 9 calculation using mathematical spiral coordinates:
    Degrees: 45, 90, 135, 180, 225, 270, 315, 360 (per cycle)
    Formula: Price = (sqrt(base_price) + (degrees / 180))^2
    """
    sqrt_p = math.sqrt(base_price)
    angles = [45, 90, 135, 180, 225, 270, 315, 360]
    
    resistances: List[float] = []
    supports: List[float] = []

    for cycle in range(1, levels + 1):
        for deg in [90, 180, 270, 360]:
            factor = (deg + (cycle - 1) * 360) / 180.0
            r_val = round((sqrt_p + factor) ** 2, 2)
            s_val = round(max(0.1, (sqrt_p - factor) ** 2), 2)
            resistances.append(r_val)
            if s_val < base_price:
                supports.append(s_val)

    supports.sort(reverse=True)
    resistances.sort()

    return {
        "seed": base_price,
        "supports": supports[:4],
        "resistances": resistances[:4],
        "keyAngle180": resistances[1] if len(resistances) > 1 else base_price * 1.1,
        "keyAngle360": resistances[3] if len(resistances) > 3 else base_price * 1.25,
    }

def calculate_gann_angles(origin_price: float, origin_index: int, current_index: int, scale_factor: float = 0.5) -> Dict[str, float]:
    """
    Gann fan angles (1x1, 2x1, 1x2, 3x1, 4x1)
    1x1 = 45 degrees (1 unit price per unit time)
    """
    delta_bars = max(1, current_index - origin_index)
    
    return {
        "angle_1x1": round(origin_price + (delta_bars * scale_factor * 1.0), 2),
        "angle_2x1": round(origin_price + (delta_bars * scale_factor * 2.0), 2),
        "angle_1x2": round(origin_price + (delta_bars * scale_factor * 0.5), 2),
        "angle_3x1": round(origin_price + (delta_bars * scale_factor * 3.0), 2),
        "angle_4x1": round(origin_price + (delta_bars * scale_factor * 4.0), 2),
    }

def calculate_time_cycles(last_pivot_bar: int, total_bars: int) -> Dict[str, Any]:
    """
    Gann time cycle landmarks: 45, 90, 144, 180, 270, 360 bars
    """
    cycles = [45, 90, 144, 180, 270, 360]
    next_cycle = None
    bars_remaining = None

    elapsed = total_bars - last_pivot_bar
    for c in cycles:
        if c > elapsed:
            next_cycle = c
            bars_remaining = c - elapsed
            break

    return {
        "elapsedBars": elapsed,
        "nextKeyCycle": next_cycle or 45,
        "barsRemaining": bars_remaining if bars_remaining is not None else 10,
        "activeHarmonic": "144 Cycle (Fibonacci Harmonic)" if elapsed > 90 and elapsed <= 144 else "90 Day Solstice Cycle"
    }
