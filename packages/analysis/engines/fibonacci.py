from typing import Optional, Tuple, List, Dict, Any, Union

def calculate_fibonacci_levels(high: float, low: float, trend: str = "UP") -> Dict[str, Any]:
    diff = high - low
    if diff <= 0:
        diff = high * 0.05

    if trend.upper() == "UP":
        retracements = {
            "fib_0": round(high, 2),
            "fib_236": round(high - diff * 0.236, 2),
            "fib_382": round(high - diff * 0.382, 2),
            "fib_500": round(high - diff * 0.500, 2),
            "fib_618": round(high - diff * 0.618, 2),
            "fib_786": round(high - diff * 0.786, 2),
            "fib_100": round(low, 2),
        }
        extensions = {
            "ext_1272": round(high + diff * 0.272, 2),
            "ext_1618": round(high + diff * 0.618, 2),
            "ext_2000": round(high + diff * 1.000, 2),
            "ext_2618": round(high + diff * 1.618, 2),
        }
    else:
        retracements = {
            "fib_0": round(low, 2),
            "fib_236": round(low + diff * 0.236, 2),
            "fib_382": round(low + diff * 0.382, 2),
            "fib_500": round(low + diff * 0.500, 2),
            "fib_618": round(low + diff * 0.618, 2),
            "fib_786": round(low + diff * 0.786, 2),
            "fib_100": round(high, 2),
        }
        extensions = {
            "ext_1272": round(low - diff * 0.272, 2),
            "ext_1618": round(low - diff * 0.618, 2),
            "ext_2000": round(low - diff * 1.000, 2),
            "ext_2618": round(low - diff * 1.618, 2),
        }

    return {
        "trend": trend,
        "swingHigh": round(high, 2),
        "swingLow": round(low, 2),
        "goldenRatio": retracements["fib_618"],
        "goldenPocket": [retracements["fib_618"], retracements["fib_500"]],
        "retracements": retracements,
        "extensions": extensions
    }
