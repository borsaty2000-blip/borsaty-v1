"""
P1: Historical Data Seeder for Backtest Engine (Borsaty Phase ح)

Generates 5 years of synthetic but realistic OHLCV candle data
for key instruments. Used when real data is unavailable (development/CI).

Symbols seeded:
  Egypt:    COMI, ABUK
  Saudi:    2222, 1120
  US:       AAPL, MSFT, NVDA, TSLA
  Crypto:   BTC
  Forex:    EURUSD
"""

import math
import random
import json
from datetime import date, timedelta
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any, Union

# ─── Seed settings ────────────────────────────────────────────────────────────

INSTRUMENTS = {
    "COMI":   {"start_price": 65.0,    "annual_drift": 0.12, "annual_vol": 0.28},
    "ABUK":   {"start_price": 18.0,    "annual_drift": 0.09, "annual_vol": 0.32},
    "SWDY":   {"start_price": 45.0,    "annual_drift": 0.18, "annual_vol": 0.30},
    "2222":   {"start_price": 32.0,    "annual_drift": 0.08, "annual_vol": 0.22},
    "1120":   {"start_price": 120.0,   "annual_drift": 0.10, "annual_vol": 0.25},
    "AAPL":   {"start_price": 145.0,   "annual_drift": 0.15, "annual_vol": 0.30},
    "MSFT":   {"start_price": 280.0,   "annual_drift": 0.18, "annual_vol": 0.28},
    "NVDA":   {"start_price": 220.0,   "annual_drift": 0.35, "annual_vol": 0.55},
    "TSLA":   {"start_price": 200.0,   "annual_drift": 0.20, "annual_vol": 0.65},
    "BTC":    {"start_price": 35000.0, "annual_drift": 0.25, "annual_vol": 0.80},
    "EURUSD": {"start_price": 1.10,    "annual_drift": 0.00, "annual_vol": 0.08},
}

YEARS = 5
TRADING_DAYS_PER_YEAR = 252


def _generate_candles(
    symbol: str,
    start_price: float,
    annual_drift: float,
    annual_vol: float,
    n_days: int,
    seed: int = 42,
) -> List[Dict[str, Any]]:
    """
    Generate synthetic daily OHLCV candles using geometric Brownian motion.
    Realistic OHLC construction from daily returns.
    """
    rng = random.Random(seed + hash(symbol) % 10000)
    dt = 1 / TRADING_DAYS_PER_YEAR
    drift = (annual_drift - 0.5 * annual_vol ** 2) * dt
    vol_sqrt_dt = annual_vol * math.sqrt(dt)

    candles = []
    price = start_price
    start_date = date(2021, 11, 1)

    for i in range(n_days):
        bar_date = start_date + timedelta(days=i)
        # Skip weekends
        if bar_date.weekday() >= 5:
            continue

        # GBM return
        z = rng.gauss(0, 1)
        daily_ret = math.exp(drift + vol_sqrt_dt * z)
        close = round(price * daily_ret, 4)

        # Intraday range via secondary GBM
        intraday_vol = annual_vol * math.sqrt(1 / TRADING_DAYS_PER_YEAR) * rng.uniform(0.5, 1.5)
        intraday_range = close * intraday_vol

        open_ = round(price * math.exp(rng.gauss(0, vol_sqrt_dt * 0.3)), 4)
        high = round(max(open_, close) + abs(rng.gauss(0, intraday_range * 0.5)), 4)
        low = round(min(open_, close) - abs(rng.gauss(0, intraday_range * 0.5)), 4)
        low = max(low, close * 0.5)  # floor at 50% of close

        avg_vol_base = start_price * 500_000
        volume = round(abs(rng.gauss(avg_vol_base, avg_vol_base * 0.3)), 2)

        candles.append({
            "time": bar_date.isoformat(),
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
        })
        price = close

    return candles


def seed_all(output_dir: str = "backtest_data") -> Dict[str, int]:
    """
    Generate and save seed data for all instruments.

    Parameters
    ----------
    output_dir : Directory where JSON files will be written.

    Returns
    -------
    Dict mapping symbol → number of candles generated.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    n_days = YEARS * 365  # includes weekends — filtered in generator
    summary = {}

    for sym, cfg in INSTRUMENTS.items():
        candles = _generate_candles(
            symbol=sym,
            start_price=cfg["start_price"],
            annual_drift=cfg["annual_drift"],
            annual_vol=cfg["annual_vol"],
            n_days=n_days,
        )
        fpath = out / f"{sym}_1D.json"
        fpath.write_text(json.dumps(candles, indent=2))
        summary[sym] = len(candles)
        print(f"  ✓ {sym}: {len(candles)} trading-day candles → {fpath}")

    return summary


def load_seed_candles(symbol: str, output_dir: str = "backtest_data") -> List[Dict[str, Any]]:
    """
    Load previously seeded candles for a symbol.
    If the file doesn't exist, generate on-the-fly (no disk write).
    """
    fpath = Path(output_dir) / f"{symbol.upper()}_1D.json"
    if fpath.exists():
        return json.loads(fpath.read_text())

    # On-the-fly generation
    cfg = INSTRUMENTS.get(symbol.upper())
    if cfg is None:
        # Generic fallback
        cfg = {"start_price": 100.0, "annual_drift": 0.10, "annual_vol": 0.30}

    return _generate_candles(
        symbol=symbol.upper(),
        start_price=cfg["start_price"],
        annual_drift=cfg["annual_drift"],
        annual_vol=cfg["annual_vol"],
        n_days=YEARS * 365,
    )


if __name__ == "__main__":
    print("Seeding 5-year synthetic data for 10 instruments…")
    results = seed_all()
    print("\nSummary:")
    for sym, count in results.items():
        print(f"  {sym}: {count} candles")
    total = sum(results.values())
    print(f"\nTotal: {total} candles across {len(results)} instruments")
    print("✓ P1 complete — data ready for backtest")
