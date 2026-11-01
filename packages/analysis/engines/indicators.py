from typing import List, Dict, Any
import math

def calculate_sma(prices: List[float], period: int) -> List[float | None]:
    result: List[float | None] = []
    for i in range(len(prices)):
        if i + 1 < period:
            result.append(None)
        else:
            subset = prices[i + 1 - period : i + 1]
            result.append(round(sum(subset) / period, 3))
    return result

def calculate_ema(prices: List[float], period: int) -> List[float | None]:
    result: List[float | None] = []
    multiplier = 2 / (period + 1)
    
    # Start with SMA for initial EMA
    for i in range(len(prices)):
        if i + 1 < period:
            result.append(None)
        elif i + 1 == period:
            sma = sum(prices[:period]) / period
            result.append(round(sma, 3))
        else:
            prev_ema = result[-1]
            if prev_ema is not None:
                ema = (prices[i] - prev_ema) * multiplier + prev_ema
                result.append(round(ema, 3))
            else:
                result.append(None)
    return result

def calculate_rsi(prices: List[float], period: int = 14) -> List[float | None]:
    result: List[float | None] = [None] * len(prices)
    if len(prices) <= period:
        return result

    gains = []
    losses = []
    for i in range(1, len(prices)):
        diff = prices[i] - prices[i - 1]
        if diff >= 0:
            gains.append(diff)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(diff))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    if avg_loss == 0:
        result[period] = 100.0
    else:
        rs = avg_gain / avg_loss
        result[period] = round(100 - (100 / (1 + rs)), 2)

    for i in range(period + 1, len(prices)):
        gain = gains[i - 1]
        loss = losses[i - 1]
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

        if avg_loss == 0:
            result[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            result[i] = round(100 - (100 / (1 + rs)), 2)

    return result

def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[float | None]]:
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)

    macd_line: List[float | None] = []
    for f, s in zip(ema_fast, ema_slow):
        if f is not None and s is not None:
            macd_line.append(round(f - s, 3))
        else:
            macd_line.append(None)

    valid_macd_indices = [i for i, v in enumerate(macd_line) if v is not None]
    signal_line: List[float | None] = [None] * len(prices)
    hist_line: List[float | None] = [None] * len(prices)

    if len(valid_macd_indices) >= signal:
        first_valid = valid_macd_indices[0]
        valid_macd_values = [macd_line[i] for i in valid_macd_indices if macd_line[i] is not None]  # type: ignore
        sub_signal = calculate_ema(valid_macd_values, signal)  # type: ignore

        for j, s_val in enumerate(sub_signal):
            orig_idx = first_valid + j
            signal_line[orig_idx] = s_val
            if macd_line[orig_idx] is not None and s_val is not None:
                hist_line[orig_idx] = round(macd_line[orig_idx] - s_val, 3)

    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": hist_line
    }

def calculate_bollinger_bands(prices: List[float], period: int = 20, num_std: float = 2.0) -> Dict[str, List[float | None]]:
    sma = calculate_sma(prices, period)
    upper: List[float | None] = []
    lower: List[float | None] = []

    for i in range(len(prices)):
        if i + 1 < period or sma[i] is None:
            upper.append(None)
            lower.append(None)
        else:
            subset = prices[i + 1 - period : i + 1]
            mean = sma[i]  # type: ignore
            variance = sum((x - mean) ** 2 for x in subset) / period
            std_dev = math.sqrt(variance)
            upper.append(round(mean + (num_std * std_dev), 3))
            lower.append(round(mean - (num_std * std_dev), 3))

    return {
        "upper": upper,
        "middle": sma,
        "lower": lower
    }

def calculate_all_indicators(candles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    closes = [float(c["close"]) for c in candles]
    sma20 = calculate_sma(closes, 20)
    sma50 = calculate_sma(closes, 50)
    sma200 = calculate_sma(closes, 200)
    ema20 = calculate_ema(closes, 20)
    rsi14 = calculate_rsi(closes, 14)
    macd = calculate_macd(closes, 12, 26, 9)
    bb = calculate_bollinger_bands(closes, 20, 2.0)

    result = []
    for i, c in enumerate(candles):
        result.append({
            "time": c["time"],
            "open": c["open"],
            "high": c["high"],
            "low": c["low"],
            "close": c["close"],
            "volume": c.get("volume", 0),
            "sma20": sma20[i],
            "sma50": sma50[i],
            "sma200": sma200[i],
            "ema20": ema20[i],
            "rsi": rsi14[i],
            "macd": macd["macd"][i],
            "macdSignal": macd["signal"][i],
            "macdHist": macd["histogram"][i],
            "bbUpper": bb["upper"][i],
            "bbMiddle": bb["middle"][i],
            "bbLower": bb["lower"][i],
        })
    return result
