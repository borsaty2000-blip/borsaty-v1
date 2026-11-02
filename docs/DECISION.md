# Decision Engine Specification (Phase ي)

## Overview
The Decision Engine (`packages/analysis/decision/engine.py`) aggregates all multi-engine signals into **one deterministic, actionable verdict**:
- `STRONG_BUY`
- `BUY`
- `WATCH`
- `AVOID`
- `SELL`
- `STRONG_SELL`
- `WAIT`

## Weighting Formula
$$Score = (ConfluenceScore \times 0.45) + (TradeQuality \times 0.25) + (HistoricalConfidence \times 0.30)$$

## Rules
1. **No Decision without TradePlan**: requires Entry, Stop Loss, and Targets.
2. **No Claim without Evidence**: if historical occurrences $< 30$, sample is flagged as `insufficient_data` and no hit rate is published.
3. **Mandatory Disclaimer**: Arabic & English disclaimer attached to every payload.
