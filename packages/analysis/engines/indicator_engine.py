from typing import List, Dict, Any, Optional, Tuple, Union
import math
import hashlib
import json

class IndicatorEngine:
    VERSION = "1.0.0"

    def __init__(self):
        self.version = self.VERSION

    @staticmethod
    def get_params_hash(indicator: str, params: Dict[str, Any]) -> str:
        serialized = json.dumps(params, sort_keys=True)
        return hashlib.sha256(f"{indicator.upper()}:{serialized}".encode("utf-8")).hexdigest()[:12]

    # -------------------------------------------------------------
    # 1. TREND: SMA
    # -------------------------------------------------------------
    def compute_sma(self, closes: List[float], period: int = 20) -> List[Optional[float]]:
        result: List[Optional[float]] = []
        for i in range(len(closes)):
            if i + 1 < period:
                result.append(None)
            else:
                subset = closes[i + 1 - period : i + 1]
                result.append(round(sum(subset) / period, 3))
        return result

    # -------------------------------------------------------------
    # 2. TREND: EMA
    # -------------------------------------------------------------
    def compute_ema(self, closes: List[float], period: int = 20) -> List[Optional[float]]:
        result: List[Optional[float]] = []
        multiplier = 2 / (period + 1)
        for i in range(len(closes)):
            if i + 1 < period:
                result.append(None)
            elif i + 1 == period:
                sma = sum(closes[:period]) / period
                result.append(round(sma, 3))
            else:
                prev_ema = result[-1]
                if prev_ema is not None:
                    ema = (closes[i] - prev_ema) * multiplier + prev_ema
                    result.append(round(ema, 3))
                else:
                    result.append(None)
        return result

    # -------------------------------------------------------------
    # 3. TREND: WMA (Weighted Moving Average)
    # -------------------------------------------------------------
    def compute_wma(self, closes: List[float], period: int = 20) -> List[Optional[float]]:
        result: List[Optional[float]] = []
        denom = period * (period + 1) / 2
        for i in range(len(closes)):
            if i + 1 < period:
                result.append(None)
            else:
                subset = closes[i + 1 - period : i + 1]
                weighted_sum = sum((w + 1) * price for w, price in enumerate(subset))
                result.append(round(weighted_sum / denom, 3))
        return result

    # -------------------------------------------------------------
    # 4. VOLATILITY: ATR (Average True Range)
    # -------------------------------------------------------------
    def compute_atr(self, highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n
        if n < period:
            return result

        tr_list: List[float] = [highs[0] - lows[0]]
        for i in range(1, n):
            h, l, prev_c = highs[i], lows[i], closes[i - 1]
            tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
            tr_list.append(tr)

        if len(tr_list) < period:
            return result

        atr = sum(tr_list[:period]) / period
        result[period - 1] = round(atr, 3)

        for i in range(period, n):
            atr = (atr * (period - 1) + tr_list[i]) / period
            result[i] = round(atr, 3)

        return result

    # -------------------------------------------------------------
    # 5. TREND: Supertrend
    # -------------------------------------------------------------
    def compute_supertrend(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        period: int = 10,
        multiplier: float = 3.0
    ) -> Dict[str, List[Optional[float]]]:
        n = len(closes)
        atr_vals = self.compute_atr(highs, lows, closes, period)

        upper_band: List[Optional[float]] = [None] * n
        lower_band: List[Optional[float]] = [None] * n
        supertrend: List[Optional[float]] = [None] * n
        direction: List[int] = [1] * n  # 1 for bull, -1 for bear

        for i in range(n):
            if atr_vals[i] is None:
                continue

            hl2 = (highs[i] + lows[i]) / 2.0
            basic_upper = hl2 + (multiplier * atr_vals[i])  # type: ignore
            basic_lower = hl2 - (multiplier * atr_vals[i])  # type: ignore

            if i > 0 and upper_band[i - 1] is not None:
                prev_upper = upper_band[i - 1]
                prev_lower = lower_band[i - 1]

                # Final upper band
                if basic_upper < prev_upper or closes[i - 1] > prev_upper:  # type: ignore
                    upper_band[i] = round(basic_upper, 3)
                else:
                    upper_band[i] = prev_upper

                # Final lower band
                if basic_lower > prev_lower or closes[i - 1] < prev_lower:  # type: ignore
                    lower_band[i] = round(basic_lower, 3)
                else:
                    lower_band[i] = prev_lower
            else:
                upper_band[i] = round(basic_upper, 3)
                lower_band[i] = round(basic_lower, 3)

            # Direction & Supertrend line
            if i > 0 and supertrend[i - 1] is not None:
                prev_dir = direction[i - 1]
                if prev_dir == 1:
                    if closes[i] < lower_band[i]:  # type: ignore
                        direction[i] = -1
                        supertrend[i] = upper_band[i]
                    else:
                        direction[i] = 1
                        supertrend[i] = lower_band[i]
                else:
                    if closes[i] > upper_band[i]:  # type: ignore
                        direction[i] = 1
                        supertrend[i] = lower_band[i]
                    else:
                        direction[i] = -1
                        supertrend[i] = upper_band[i]
            else:
                direction[i] = 1 if closes[i] >= lower_band[i] else -1  # type: ignore
                supertrend[i] = lower_band[i] if direction[i] == 1 else upper_band[i]

        return {
            "supertrend": supertrend,
            "upper": upper_band,
            "lower": lower_band,
            "direction": [float(d) for d in direction]
        }

    # -------------------------------------------------------------
    # 6. TREND: Parabolic SAR (PSAR)
    # -------------------------------------------------------------
    def compute_psar(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        af: float = 0.02,
        max_af: float = 0.2
    ) -> List[Optional[float]]:
        n = len(closes)
        if n < 2:
            return [None] * n

        psar: List[Optional[float]] = [None] * n
        is_bull = closes[1] >= closes[0]
        curr_af = af
        ep = highs[0] if is_bull else lows[0]
        curr_sar = lows[0] if is_bull else highs[0]
        psar[0] = round(curr_sar, 3)

        for i in range(1, n):
            prev_sar = curr_sar
            curr_sar = prev_sar + curr_af * (ep - prev_sar)

            if is_bull:
                if i >= 2:
                    curr_sar = min(curr_sar, lows[i - 1], lows[i - 2])
                else:
                    curr_sar = min(curr_sar, lows[i - 1])

                if lows[i] < curr_sar:
                    is_bull = False
                    curr_sar = ep
                    ep = lows[i]
                    curr_af = af
                else:
                    if highs[i] > ep:
                        ep = highs[i]
                        curr_af = min(curr_af + af, max_af)
            else:
                if i >= 2:
                    curr_sar = max(curr_sar, highs[i - 1], highs[i - 2])
                else:
                    curr_sar = max(curr_sar, highs[i - 1])

                if highs[i] > curr_sar:
                    is_bull = True
                    curr_sar = ep
                    ep = highs[i]
                    curr_af = af
                else:
                    if lows[i] < ep:
                        ep = lows[i]
                        curr_af = min(curr_af + af, max_af)

            psar[i] = round(curr_sar, 3)

        return psar

    # -------------------------------------------------------------
    # 7. MOMENTUM: RSI (Wilder Smoothing)
    # -------------------------------------------------------------
    def compute_rsi(self, closes: List[float], period: int = 14) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n
        if n <= period:
            return result

        gains = []
        losses = []
        for i in range(1, n):
            diff = closes[i] - closes[i - 1]
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
            result[period] = round(100.0 - (100.0 / (1.0 + rs)), 2)

        for i in range(period + 1, n):
            gain = gains[i - 1]
            loss = losses[i - 1]
            avg_gain = (avg_gain * (period - 1) + gain) / period
            avg_loss = (avg_loss * (period - 1) + loss) / period

            if avg_loss == 0:
                result[i] = 100.0
            else:
                rs = avg_gain / avg_loss
                result[i] = round(100.0 - (100.0 / (1.0 + rs)), 2)

        return result

    # -------------------------------------------------------------
    # 8. MOMENTUM: MACD
    # -------------------------------------------------------------
    def compute_macd(self, closes: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Optional[float]]]:
        ema_fast = self.compute_ema(closes, fast)
        ema_slow = self.compute_ema(closes, slow)

        macd_line: List[Optional[float]] = []
        for f, s in zip(ema_fast, ema_slow):
            if f is not None and s is not None:
                macd_line.append(round(f - s, 3))
            else:
                macd_line.append(None)

        valid_indices = [i for i, v in enumerate(macd_line) if v is not None]
        signal_line: List[Optional[float]] = [None] * len(closes)
        hist_line: List[Optional[float]] = [None] * len(closes)

        if len(valid_indices) >= signal:
            first_valid = valid_indices[0]
            valid_values = [macd_line[i] for i in valid_indices if macd_line[i] is not None]  # type: ignore
            sub_sig = self.compute_ema(valid_values, signal)  # type: ignore

            for j, s_val in enumerate(sub_sig):
                orig_idx = first_valid + j
                signal_line[orig_idx] = s_val
                if macd_line[orig_idx] is not None and s_val is not None:
                    hist_line[orig_idx] = round(macd_line[orig_idx] - s_val, 3)

        return {
            "macd": macd_line,
            "signal": signal_line,
            "histogram": hist_line
        }

    # -------------------------------------------------------------
    # 9. MOMENTUM: Stochastic (%K, %D)
    # -------------------------------------------------------------
    def compute_stochastic(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        k_period: int = 14,
        d_period: int = 3,
        smooth_k: int = 3
    ) -> Dict[str, List[Optional[float]]]:
        n = len(closes)
        fast_k: List[Optional[float]] = [None] * n

        for i in range(n):
            if i + 1 >= k_period:
                h_window = max(highs[i + 1 - k_period : i + 1])
                l_window = min(lows[i + 1 - k_period : i + 1])
                denom = h_window - l_window
                if denom == 0:
                    fast_k[i] = 50.0
                else:
                    fast_k[i] = round(((closes[i] - l_window) / denom) * 100.0, 2)

        # Smooth %K
        slow_k: List[Optional[float]] = [None] * n
        for i in range(n):
            if i + 1 >= k_period + smooth_k - 1:
                sub = [fast_k[j] for j in range(i + 1 - smooth_k, i + 1) if fast_k[j] is not None]
                if len(sub) == smooth_k:
                    slow_k[i] = round(sum(sub) / smooth_k, 2)  # type: ignore

        # %D = SMA of slow_k
        slow_d: List[Optional[float]] = [None] * n
        for i in range(n):
            if i + 1 >= k_period + smooth_k + d_period - 2:
                sub = [slow_k[j] for j in range(i + 1 - d_period, i + 1) if slow_k[j] is not None]
                if len(sub) == d_period:
                    slow_d[i] = round(sum(sub) / d_period, 2)  # type: ignore

        return {"k": slow_k, "d": slow_d}

    # -------------------------------------------------------------
    # 10. MOMENTUM: ADX (+DI, -DI, ADX)
    # -------------------------------------------------------------
    def compute_adx(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        period: int = 14
    ) -> Dict[str, List[Optional[float]]]:
        n = len(closes)
        plus_di: List[Optional[float]] = [None] * n
        minus_di: List[Optional[float]] = [None] * n
        adx: List[Optional[float]] = [None] * n

        if n < (period * 2):
            return {"adx": adx, "plus_di": plus_di, "minus_di": minus_di}

        tr_list = [highs[0] - lows[0]]
        plus_dm = [0.0]
        minus_dm = [0.0]

        for i in range(1, n):
            h_diff = highs[i] - highs[i - 1]
            l_diff = lows[i - 1] - lows[i]

            p_dm = h_diff if h_diff > l_diff and h_diff > 0 else 0.0
            m_dm = l_diff if l_diff > h_diff and l_diff > 0 else 0.0

            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))

            tr_list.append(tr)
            plus_dm.append(p_dm)
            minus_dm.append(m_dm)

        # 14-period initial sum
        sm_tr = sum(tr_list[:period])
        sm_p_dm = sum(plus_dm[:period])
        sm_m_dm = sum(minus_dm[:period])

        dx_list: List[Optional[float]] = [None] * n

        for i in range(period - 1, n):
            if i > period - 1:
                sm_tr = sm_tr - (sm_tr / period) + tr_list[i]
                sm_p_dm = sm_p_dm - (sm_p_dm / period) + plus_dm[i]
                sm_m_dm = sm_m_dm - (sm_m_dm / period) + minus_dm[i]

            p_di_val = (sm_p_dm / sm_tr * 100.0) if sm_tr > 0 else 0.0
            m_di_val = (sm_m_dm / sm_tr * 100.0) if sm_tr > 0 else 0.0

            plus_di[i] = round(p_di_val, 2)
            minus_di[i] = round(m_di_val, 2)

            denom = p_di_val + m_di_val
            dx = (abs(p_di_val - m_di_val) / denom * 100.0) if denom > 0 else 0.0
            dx_list[i] = dx

        # ADX = Wilder smooth of DX
        valid_dx_idx = [i for i, v in enumerate(dx_list) if v is not None]
        if len(valid_dx_idx) >= period:
            first_adx_idx = valid_dx_idx[period - 1]
            adx_val = sum(dx_list[valid_dx_idx[j]] for j in range(period)) / period  # type: ignore
            adx[first_adx_idx] = round(adx_val, 2)

            for j in range(period, len(valid_dx_idx)):
                orig_i = valid_dx_idx[j]
                adx_val = (adx_val * (period - 1) + dx_list[orig_i]) / period  # type: ignore
                adx[orig_i] = round(adx_val, 2)

        return {"adx": adx, "plus_di": plus_di, "minus_di": minus_di}

    # -------------------------------------------------------------
    # 11. MOMENTUM: CCI (Commodity Channel Index)
    # -------------------------------------------------------------
    def compute_cci(self, highs: List[float], lows: List[float], closes: List[float], period: int = 20) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n
        tp = [(highs[i] + lows[i] + closes[i]) / 3.0 for i in range(n)]

        for i in range(n):
            if i + 1 >= period:
                sub_tp = tp[i + 1 - period : i + 1]
                mean_tp = sum(sub_tp) / period
                mean_dev = sum(abs(x - mean_tp) for x in sub_tp) / period
                if mean_dev == 0:
                    result[i] = 0.0
                else:
                    cci_val = (tp[i] - mean_tp) / (0.015 * mean_dev)
                    result[i] = round(cci_val, 2)

        return result

    # -------------------------------------------------------------
    # 12. MOMENTUM: Williams %R
    # -------------------------------------------------------------
    def compute_williams_r(self, highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n

        for i in range(n):
            if i + 1 >= period:
                hh = max(highs[i + 1 - period : i + 1])
                ll = min(lows[i + 1 - period : i + 1])
                denom = hh - ll
                if denom == 0:
                    result[i] = -50.0
                else:
                    wr = ((hh - closes[i]) / denom) * -100.0
                    result[i] = round(wr, 2)

        return result

    # -------------------------------------------------------------
    # 13. MOMENTUM: ROC (Rate of Change)
    # -------------------------------------------------------------
    def compute_roc(self, closes: List[float], period: int = 12) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n

        for i in range(period, n):
            prev = closes[i - period]
            if prev != 0:
                roc_val = ((closes[i] - prev) / prev) * 100.0
                result[i] = round(roc_val, 2)
            else:
                result[i] = 0.0

        return result

    # -------------------------------------------------------------
    # 14. VOLUME: OBV (On-Balance Volume)
    # -------------------------------------------------------------
    def compute_obv(self, closes: List[float], volumes: List[float]) -> List[Optional[float]]:
        n = len(closes)
        if n == 0:
            return []

        result: List[Optional[float]] = [float(volumes[0])]
        for i in range(1, n):
            prev = result[-1] or 0.0
            if closes[i] > closes[i - 1]:
                result.append(prev + volumes[i])
            elif closes[i] < closes[i - 1]:
                result.append(prev - volumes[i])
            else:
                result.append(prev)

        return result

    # -------------------------------------------------------------
    # 15. VOLUME: MFI (Money Flow Index)
    # -------------------------------------------------------------
    def compute_mfi(self, highs: List[float], lows: List[float], closes: List[float], volumes: List[float], period: int = 14) -> List[Optional[float]]:
        n = len(closes)
        result: List[Optional[float]] = [None] * n
        if n <= period:
            return result

        tp = [(highs[i] + lows[i] + closes[i]) / 3.0 for i in range(n)]
        raw_mf = [tp[i] * volumes[i] for i in range(n)]

        pos_mf: List[float] = [0.0] * n
        neg_mf: List[float] = [0.0] * n

        for i in range(1, n):
            if tp[i] > tp[i - 1]:
                pos_mf[i] = raw_mf[i]
            elif tp[i] < tp[i - 1]:
                neg_mf[i] = raw_mf[i]

        for i in range(period, n):
            pos_sum = sum(pos_mf[i - period + 1 : i + 1])
            neg_sum = sum(neg_mf[i - period + 1 : i + 1])

            if neg_sum == 0:
                result[i] = 100.0
            else:
                mr = pos_sum / neg_sum
                mfi_val = 100.0 - (100.0 / (1.0 + mr))
                result[i] = round(mfi_val, 2)

        return result

    # -------------------------------------------------------------
    # 16. VOLUME: VWAP (Intraday only)
    # -------------------------------------------------------------
    def compute_vwap(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        volumes: List[float],
        timeframe: str = "1D"
    ) -> Tuple[List[Optional[float]], List[str]]:
        tf = timeframe.upper()
        warnings = []
        if tf in ["1D", "1W", "1M"]:
            warnings.append("VWAP is only defined for intraday timeframes (1m-4H)")
            return [None] * len(closes), warnings

        n = len(closes)
        result: List[Optional[float]] = []
        cum_tp_vol = 0.0
        cum_vol = 0.0

        for i in range(n):
            tp = (highs[i] + lows[i] + closes[i]) / 3.0
            cum_tp_vol += tp * volumes[i]
            cum_vol += volumes[i]
            if cum_vol > 0:
                result.append(round(cum_tp_vol / cum_vol, 3))
            else:
                result.append(round(closes[i], 3))

        return result, warnings

    # -------------------------------------------------------------
    # 17. VOLATILITY: Bollinger Bands
    # -------------------------------------------------------------
    def compute_bollinger(self, closes: List[float], period: int = 20, num_std: float = 2.0) -> Dict[str, List[Optional[float]]]:
        sma = self.compute_sma(closes, period)
        upper: List[Optional[float]] = []
        lower: List[Optional[float]] = []

        for i in range(len(closes)):
            if sma[i] is None:
                upper.append(None)
                lower.append(None)
            else:
                subset = closes[i + 1 - period : i + 1]
                mean = sma[i]  # type: ignore
                variance = sum((x - mean) ** 2 for x in subset) / period
                std_dev = math.sqrt(variance)
                upper.append(round(mean + (num_std * std_dev), 3))
                lower.append(round(mean - (num_std * std_dev), 3))

        return {"upper": upper, "middle": sma, "lower": lower}

    # -------------------------------------------------------------
    # 18. VOLATILITY: Keltner Channels
    # -------------------------------------------------------------
    def compute_keltner(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        ema_period: int = 20,
        multiplier: float = 2.0,
        atr_period: int = 10
    ) -> Dict[str, List[Optional[float]]]:
        middle = self.compute_ema(closes, ema_period)
        atr_vals = self.compute_atr(highs, lows, closes, atr_period)

        upper: List[Optional[float]] = []
        lower: List[Optional[float]] = []

        for m, a in zip(middle, atr_vals):
            if m is not None and a is not None:
                upper.append(round(m + (multiplier * a), 3))
                lower.append(round(m - (multiplier * a), 3))
            else:
                upper.append(None)
                lower.append(None)

        return {"upper": upper, "middle": middle, "lower": lower}

    # -------------------------------------------------------------
    # 19. VOLATILITY: Donchian Channels
    # -------------------------------------------------------------
    def compute_donchian(self, highs: List[float], lows: List[float], period: int = 20) -> Dict[str, List[Optional[float]]]:
        n = len(highs)
        upper: List[Optional[float]] = [None] * n
        lower: List[Optional[float]] = [None] * n
        middle: List[Optional[float]] = [None] * n

        for i in range(n):
            if i + 1 >= period:
                hh = max(highs[i + 1 - period : i + 1])
                ll = min(lows[i + 1 - period : i + 1])
                upper[i] = round(hh, 3)
                lower[i] = round(ll, 3)
                middle[i] = round((hh + ll) / 2.0, 3)

        return {"upper": upper, "middle": middle, "lower": lower}

    # -------------------------------------------------------------
    # 20. TREND STRENGTH: Ichimoku Kinko Hyo
    # -------------------------------------------------------------
    def compute_ichimoku(
        self,
        highs: List[float],
        lows: List[float],
        closes: List[float],
        tenkan_period: int = 9,
        kijun_period: int = 26,
        senkou_b_period: int = 52
    ) -> Dict[str, List[Optional[float]]]:
        n = len(closes)
        tenkan: List[Optional[float]] = [None] * n
        kijun: List[Optional[float]] = [None] * n
        senkou_a: List[Optional[float]] = [None] * n
        senkou_b: List[Optional[float]] = [None] * n

        for i in range(n):
            if i + 1 >= tenkan_period:
                th = max(highs[i + 1 - tenkan_period : i + 1])
                tl = min(lows[i + 1 - tenkan_period : i + 1])
                tenkan[i] = round((th + tl) / 2.0, 3)

            if i + 1 >= kijun_period:
                kh = max(highs[i + 1 - kijun_period : i + 1])
                kl = min(lows[i + 1 - kijun_period : i + 1])
                kijun[i] = round((kh + kl) / 2.0, 3)

            if tenkan[i] is not None and kijun[i] is not None:
                senkou_a[i] = round((tenkan[i] + kijun[i]) / 2.0, 3)  # type: ignore

            if i + 1 >= senkou_b_period:
                sb_h = max(highs[i + 1 - senkou_b_period : i + 1])
                sb_l = min(lows[i + 1 - senkou_b_period : i + 1])
                senkou_b[i] = round((sb_h + sb_l) / 2.0, 3)

        return {
            "tenkan": tenkan,
            "kijun": kijun,
            "senkou_a": senkou_a,
            "senkou_b": senkou_b
        }

    # -------------------------------------------------------------
    # Unified Compute API
    # -------------------------------------------------------------
    def compute(
        self,
        symbol: str,
        timeframe: str,
        candles: List[Dict[str, Any]],
        indicator: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        params = params or {}
        ind = indicator.upper().replace("-", "_")

        timestamps = [str(c.get("time", "")) for c in candles]
        closes = [float(c["close"]) for c in candles]
        highs = [float(c["high"]) for c in candles]
        lows = [float(c["low"]) for c in candles]
        volumes = [float(c.get("volume", 0)) for c in candles]
        last_close = closes[-1] if closes else 0.0

        warnings: List[str] = []
        values: List[Dict[str, Any]] = []
        latest_val: Any = None
        signal = "NEUTRAL"
        zone = "neutral"

        # Signal Classifications & Execution
        if ind == "RSI":
            p = params.get("period", 14)
            series = self.compute_rsi(closes, p)
            latest_val = series[-1]
            if latest_val is not None:
                if latest_val < 30:
                    zone = "oversold"
                    signal = "BULLISH"
                elif latest_val > 70:
                    zone = "overbought"
                    signal = "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, series)]

        elif ind in ["SMA", "SMA_20", "SMA_50", "SMA_200"]:
            p = params.get("period", 20 if "50" not in ind and "200" not in ind else (50 if "50" in ind else 200))
            series = self.compute_sma(closes, p)
            latest_val = series[-1]
            if latest_val is not None:
                signal = "BULLISH" if last_close > latest_val else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, series)]

        elif ind in ["EMA", "EMA_9", "EMA_20", "EMA_21", "EMA_50"]:
            p = params.get("period", 20)
            if "9" in ind: p = 9
            elif "21" in ind: p = 21
            elif "50" in ind: p = 50
            series = self.compute_ema(closes, p)
            latest_val = series[-1]
            if latest_val is not None:
                signal = "BULLISH" if last_close > latest_val else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, series)]

        elif ind == "WMA":
            p = params.get("period", 20)
            series = self.compute_wma(closes, p)
            latest_val = series[-1]
            if latest_val is not None:
                signal = "BULLISH" if last_close > latest_val else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, series)]

        elif ind == "MACD":
            fast = params.get("fast", 12)
            slow = params.get("slow", 26)
            sig = params.get("signal", 9)
            macd_dict = self.compute_macd(closes, fast, slow, sig)
            latest_val = {
                "macd": macd_dict["macd"][-1],
                "signal": macd_dict["signal"][-1],
                "histogram": macd_dict["histogram"][-1]
            }
            hist = latest_val["histogram"]
            if hist is not None:
                signal = "BULLISH" if hist > 0 else "BEARISH"
            values = [
                {"timestamp": t, "macd": m, "signal": s, "histogram": h}
                for t, m, s, h in zip(timestamps, macd_dict["macd"], macd_dict["signal"], macd_dict["histogram"])
            ]

        elif ind in ["BOLLINGER", "BB"]:
            p = params.get("period", 20)
            std = params.get("std_dev", 2.0)
            bb = self.compute_bollinger(closes, p, std)
            latest_val = {"upper": bb["upper"][-1], "middle": bb["middle"][-1], "lower": bb["lower"][-1]}
            if latest_val["upper"] is not None and latest_val["lower"] is not None:
                if last_close > latest_val["upper"]:
                    zone = "overbought"
                    signal = "BEARISH"
                elif last_close < latest_val["lower"]:
                    zone = "oversold"
                    signal = "BULLISH"
            values = [
                {"timestamp": t, "upper": u, "middle": m, "lower": l}
                for t, u, m, l in zip(timestamps, bb["upper"], bb["middle"], bb["lower"])
            ]

        elif ind == "SUPERTREND":
            p = params.get("period", 10)
            m = params.get("multiplier", 3.0)
            st = self.compute_supertrend(highs, lows, closes, p, m)
            latest_val = st["supertrend"][-1]
            latest_dir = st["direction"][-1]
            signal = "BULLISH" if latest_dir == 1 else "BEARISH"
            values = [{"timestamp": t, "value": v, "direction": d} for t, v, d in zip(timestamps, st["supertrend"], st["direction"])]

        elif ind == "PSAR":
            af = params.get("af", 0.02)
            max_af = params.get("max_af", 0.2)
            psar_vals = self.compute_psar(highs, lows, closes, af, max_af)
            latest_val = psar_vals[-1]
            if latest_val is not None:
                signal = "BULLISH" if last_close > latest_val else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, psar_vals)]

        elif ind == "STOCHASTIC":
            kp = params.get("k_period", 14)
            dp = params.get("d_period", 3)
            sm = params.get("smooth_k", 3)
            stoch = self.compute_stochastic(highs, lows, closes, kp, dp, sm)
            k_val = stoch["k"][-1]
            d_val = stoch["d"][-1]
            latest_val = {"k": k_val, "d": d_val}
            if k_val is not None and d_val is not None:
                if k_val < 20 and d_val < 20:
                    zone = "oversold"
                    signal = "BULLISH"
                elif k_val > 80 and d_val > 80:
                    zone = "overbought"
                    signal = "BEARISH"
                else:
                    signal = "BULLISH" if k_val > d_val else "BEARISH"
            values = [{"timestamp": t, "k": k, "d": d} for t, k, d in zip(timestamps, stoch["k"], stoch["d"])]

        elif ind == "ADX":
            p = params.get("period", 14)
            adx_dict = self.compute_adx(highs, lows, closes, p)
            adx_v = adx_dict["adx"][-1]
            p_di = adx_dict["plus_di"][-1]
            m_di = adx_dict["minus_di"][-1]
            latest_val = {"adx": adx_v, "plus_di": p_di, "minus_di": m_di}
            if adx_v is not None and p_di is not None and m_di is not None:
                zone = "trending" if adx_v > 25 else "ranging"
                if adx_v > 20:
                    signal = "BULLISH" if p_di > m_di else "BEARISH"
            values = [{"timestamp": t, "adx": a, "plus_di": pd, "minus_di": md} for t, a, pd, md in zip(timestamps, adx_dict["adx"], adx_dict["plus_di"], adx_dict["minus_di"])]

        elif ind == "CCI":
            p = params.get("period", 20)
            cci_vals = self.compute_cci(highs, lows, closes, p)
            latest_val = cci_vals[-1]
            if latest_val is not None:
                if latest_val > 100:
                    zone = "overbought"
                    signal = "BEARISH"
                elif latest_val < -100:
                    zone = "oversold"
                    signal = "BULLISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, cci_vals)]

        elif ind in ["WILLIAMS_R", "WILLIAMS"]:
            p = params.get("period", 14)
            wr_vals = self.compute_williams_r(highs, lows, closes, p)
            latest_val = wr_vals[-1]
            if latest_val is not None:
                if latest_val < -80:
                    zone = "oversold"
                    signal = "BULLISH"
                elif latest_val > -20:
                    zone = "overbought"
                    signal = "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, wr_vals)]

        elif ind == "ROC":
            p = params.get("period", 12)
            roc_vals = self.compute_roc(closes, p)
            latest_val = roc_vals[-1]
            if latest_val is not None:
                signal = "BULLISH" if latest_val > 0 else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, roc_vals)]

        elif ind == "OBV":
            if len(closes) < 2:
                warnings.append("Insufficient candles for OBV calculation (minimum 2 required)")
            obv_vals = self.compute_obv(closes, volumes)
            latest_val = obv_vals[-1] if obv_vals else None
            if obv_vals and len(obv_vals) >= 20:
                sma_obv = sum(obv_vals[-20:]) / 20.0
                signal = "BULLISH" if latest_val > sma_obv else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, obv_vals)]

        elif ind == "MFI":
            p = params.get("period", 14)
            mfi_vals = self.compute_mfi(highs, lows, closes, volumes, p)
            latest_val = mfi_vals[-1]
            if latest_val is not None:
                if latest_val < 20:
                    zone = "oversold"
                    signal = "BULLISH"
                elif latest_val > 80:
                    zone = "overbought"
                    signal = "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, mfi_vals)]

        elif ind == "VWAP":
            vwap_vals, vwap_warn = self.compute_vwap(highs, lows, closes, volumes, timeframe)
            warnings.extend(vwap_warn)
            latest_val = vwap_vals[-1] if vwap_vals else None
            if latest_val is not None:
                signal = "BULLISH" if last_close > latest_val else "BEARISH"
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, vwap_vals)]

        elif ind == "ATR":
            p = params.get("period", 14)
            atr_vals = self.compute_atr(highs, lows, closes, p)
            latest_val = atr_vals[-1]
            values = [{"timestamp": t, "value": v} for t, v in zip(timestamps, atr_vals)]

        elif ind == "KELTNER":
            ep = params.get("ema_period", 20)
            m = params.get("multiplier", 2.0)
            ap = params.get("atr_period", 10)
            kc = self.compute_keltner(highs, lows, closes, ep, m, ap)
            latest_val = {"upper": kc["upper"][-1], "middle": kc["middle"][-1], "lower": kc["lower"][-1]}
            if latest_val["middle"] is not None:
                signal = "BULLISH" if last_close > latest_val["middle"] else "BEARISH"
            values = [{"timestamp": t, "upper": u, "middle": m_val, "lower": l} for t, u, m_val, l in zip(timestamps, kc["upper"], kc["middle"], kc["lower"])]

        elif ind == "DONCHIAN":
            p = params.get("period", 20)
            dc = self.compute_donchian(highs, lows, p)
            latest_val = {"upper": dc["upper"][-1], "middle": dc["middle"][-1], "lower": dc["lower"][-1]}
            if latest_val["middle"] is not None:
                signal = "BULLISH" if last_close > latest_val["middle"] else "BEARISH"
            values = [{"timestamp": t, "upper": u, "middle": m_val, "lower": l} for t, u, m_val, l in zip(timestamps, dc["upper"], dc["middle"], dc["lower"])]

        elif ind == "ICHIMOKU":
            tp = params.get("tenkan", 9)
            kp = params.get("kijun", 26)
            sb = params.get("senkou_b", 52)
            ich = self.compute_ichimoku(highs, lows, closes, tp, kp, sb)
            latest_val = {
                "tenkan": ich["tenkan"][-1],
                "kijun": ich["kijun"][-1],
                "senkou_a": ich["senkou_a"][-1],
                "senkou_b": ich["senkou_b"][-1]
            }
            if latest_val["tenkan"] is not None and latest_val["kijun"] is not None:
                signal = "BULLISH" if latest_val["tenkan"] > latest_val["kijun"] else "BEARISH"
            values = [
                {"timestamp": t, "tenkan": tk, "kijun": kj, "senkou_a": sa, "senkou_b": sb_v}
                for t, tk, kj, sa, sb_v in zip(timestamps, ich["tenkan"], ich["kijun"], ich["senkou_a"], ich["senkou_b"])
            ]

        else:
            warnings.append(f"Unknown indicator '{indicator}'")

        is_empty_or_all_none = False
        if latest_val is None:
            is_empty_or_all_none = True
        elif isinstance(latest_val, dict):
            if all(v is None for v in latest_val.values()):
                is_empty_or_all_none = True

        if is_empty_or_all_none and not warnings:
            warnings.append(f"Insufficient candles for {indicator} calculation")

        return {
            "indicator": ind,
            "params": params,
            "version": self.VERSION,
            "timeframe": timeframe,
            "symbol": symbol,
            "values": values,
            "latest": {
                "timestamp": timestamps[-1] if timestamps else None,
                "value": latest_val,
                "signal": signal,
                "zone": zone,
            },
            "warnings": warnings,
        }

    def compute_all(self, symbol: str, timeframe: str, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        indicators = [
            ("SMA_20", {"period": 20}),
            ("SMA_50", {"period": 50}),
            ("SMA_200", {"period": 200}),
            ("EMA_9", {"period": 9}),
            ("EMA_20", {"period": 20}),
            ("EMA_21", {"period": 21}),
            ("EMA_50", {"period": 50}),
            ("WMA", {"period": 20}),
            ("SUPERTREND", {"period": 10, "multiplier": 3.0}),
            ("PSAR", {"af": 0.02, "max_af": 0.2}),
            ("RSI", {"period": 14}),
            ("MACD", {"fast": 12, "slow": 26, "signal": 9}),
            ("STOCHASTIC", {"k_period": 14, "d_period": 3, "smooth_k": 3}),
            ("ADX", {"period": 14}),
            ("CCI", {"period": 20}),
            ("WILLIAMS_R", {"period": 14}),
            ("ROC", {"period": 12}),
            ("OBV", {}),
            ("MFI", {"period": 14}),
            ("VWAP", {}),
            ("BOLLINGER", {"period": 20, "std_dev": 2.0}),
            ("ATR", {"period": 14}),
            ("KELTNER", {"ema_period": 20, "multiplier": 2.0, "atr_period": 10}),
            ("DONCHIAN", {"period": 20}),
            ("ICHIMOKU", {"tenkan": 9, "kijun": 26, "senkou_b": 52}),
        ]

        results = {}
        for name, p in indicators:
            results[name] = self.compute(symbol, timeframe, candles, name, p)
        return results

global_indicator_engine = IndicatorEngine()
