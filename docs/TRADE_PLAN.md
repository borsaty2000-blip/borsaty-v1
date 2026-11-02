# Unified Trade Plan & Position Sizing Engine (بورصتي - محرك خطة التداول وإدارة المخاطر)

## 1. Overview & Axiomatic Principles

The Borsaty Trade Plan Engine (`packages/analysis/trade_plan/`) serves as the **final actionable bridge** between raw analytical evidence and disciplined risk execution. It synthesizes trade targets and stop loss proposals from all 5 analytical engines into a single, cohesive, mathematically validated trade plan.

### Core Non-Negotiable Axioms
1. **No Fabricated Levels (لا مستويات وهمية):** Every price target and stop loss must originate from a verified analytical method (Elliott, Harmonic, Classical, HSPD Structure, or Fibonacci swings).
2. **Never Average Incompatible Methods (حظر خلط الطرق غير المتوافقة):** Price levels are clustered based on mathematical proximity ($\le 1.0 \times \text{ATR}$); we never blindly average divergent levels.
3. **Every Stop Has a Method and Reason (كل وقف له منهجية وسبب):** A stop loss is always accompanied by its mathematical source (e.g. Wave 2 start, PRZ boundary, or structural pivot) and invalidation reason.
4. **Primary Target Confluence Requirement (التأكيد المتعدد للهدف الأول):** Target 1 requires agreement from $\ge 2$ independent analytical methods; otherwise, the plan is classified as `no_actionable_setup`.
5. **Minimum Risk-to-Reward Ratio ($R \ge 1.5$):** If the primary target does not yield at least an $R$-multiple of $1.5$, no trade plan is recommended.
6. **Multi-Method Position Sizing (خيارات إدارة المخاطر المتعددة):** Fixed Fractional, ATR-Based, Kelly Criterion, and Volatility Parity are calculated transparently to allow user choice without black boxes.

---

## 2. Six-Step Plan Derivation Pipeline

### Step 1 — Collect Proposals Across All Engines
- **Elliott Wave:** Extract `trade_ready` entry zone, Wave invalidation stop, and projection targets with confidence score (`pattern_score * stability_score`).
- **Harmonic Patterns:** Extract PRZ entry zone, PRZ invalidation stop, and Fibonacci retracement targets for all confirmed patterns.
- **Classical Chart Patterns:** Extract breakout entry level, pattern invalidation stop, and measured move projection targets.
- **HSPD Market Structure:** Extract last higher low (bullish) or lower high (bearish) minus $0.5 \times \text{ATR}$, and prior structural swing levels.
- **Fibonacci Extensions:** Extract swing extension projections ($1.272, 1.618, 2.618$) for significant swings ($\ge 1.5 \times \text{ATR}$ and $\ge 1.5\%$).

### Step 2 — Greedy Price Clustering
- Proximity tolerance: $\text{Tolerance} = 1.0 \times \text{ATR}(14)$.
- Targets are sorted by proximity to entry and grouped greedily:
  $$\text{Centroid} = \frac{1}{N} \sum_{i=1}^N \text{Price}_i$$
- Each cluster maintains:
  - `centroid_price`: Recomputed dynamically after each addition.
  - `members`: Engine, method, price, and quality score.
  - `method_diversity`: Number of distinct analytical engines supporting the cluster.
  - `sum_score`: Aggregated quality score.

### Step 3 — Confluence Ranking
Clusters are scored using a regime-aware composite ranking formula:
$$\text{RankScore} = \left(\frac{\text{Diversity}}{5}\right) \times 0.35 + \text{Quality} \times 0.30 + \text{DistanceFactor} \times 0.20 + \text{RegimeWeight} \times 0.15$$
where:
$$\text{DistanceFactor} = \max\left(0, 1 - \frac{|\text{Centroid} - \text{Price}|}{\text{Price} \times 0.15}\right)$$
- The top-ranked confluent cluster ($\ge 2$ methods) is designated as **Target 1**.
- The next two clusters outward in the trade direction are designated as **Target 2** and **Target 3**.

### Step 4 — Primary Stop Selection
- For **Bullish** trades: Most conservative stop = $\max(\text{Stops})$ (closest to entry).
- For **Bearish** trades: Most conservative stop = $\min(\text{Stops})$ (closest to entry).
- **Consensus Rule:** Must have $\ge 2$ engines agree within $1.0 \times \text{ATR}$ of the candidate level; if no consensus exists, the engine falls back to the **HSPD Structure stop**.

### Step 5 — Trade Validation Gates (Actionable vs. No Actionable Setup)
A plan is certified as `actionable` only when all 5 binary criteria pass:
1. Confluence direction is NOT `"neutral"` (`status_reason = "neutral_direction"`).
2. At least one target cluster has $\ge 2$ methods (`status_reason = "insufficient_target_confluence"`).
3. Primary Target 1 $R$-multiple $\ge 1.5$ (`status_reason = "r_multiple_too_low"`).
4. Stop distance $\ge 1.5 \times \text{ATR}$ and $\ge 1.5\%$ (`status_reason = "stop_too_tight"`).
5. Valid targets exist in the trade direction (`status_reason = "no_targets_found"`).

### Blended Risk-to-Reward Formula (معادلة العائد للمخاطرة الموزون)
The aggregate risk-to-reward ratio (`blended_rr`) weights each target's $R$-multiple inversely by its rank:
$$\text{Blended RR} = \frac{\sum_{i=1}^N \left(\text{rr}_i \times \frac{1}{\text{rank}_i}\right)}{\sum_{i=1}^N \frac{1}{\text{rank}_i}}$$
For 3 targets, rank weights are $1.0$, $0.5$, and $0.333$, giving Target 1 ~54.5% of the blended weight.

### Step 6 — Multi-Method Position Sizing
Four distinct position sizing methodologies are computed:
1. **Fixed Fractional:**
   $$\text{Units} = \frac{\text{Capital} \times (\text{RiskPct} / 100)}{|\text{Entry} - \text{Stop}|}$$
2. **ATR-Based:**
   $$\text{Units} = \frac{\text{Capital} \times (\text{RiskPct} / 100)}{1.5 \times \text{ATR}}$$
3. **Kelly Criterion (Strict $n \ge 30$ Requirement):**
   $$f^* = \frac{W \times R - (1 - W)}{R}, \quad \text{Capped at } 25\% \text{ of Capital}$$
4. **Volatility Parity:**
   $$\text{Units} = \frac{\text{Capital} \times 0.01}{\sigma_{\text{instrument}}}$$

---

## 3. Output Schema

```json
{
  "symbol": "COMI",
  "timeframe": "1D",
  "version": "1.0.0",
  "computed_at": "2026-11-02T08:00:00Z",
  "status": "actionable",
  "status_reason": null,
  "direction": "bullish",
  "current_price": 86.00,
  "entry_zone": { "low": 85.50, "high": 86.50 },
  "stop_loss": {
    "price": 82.50,
    "distance_pct": 4.1,
    "atr_multiple": 2.1,
    "methods": [
      { "engine": "elliott", "reason": "Below Wave 2 start" },
      { "engine": "structure", "reason": "Below last higher low" },
      { "engine": "harmonic", "reason": "Below Gartley D + ATR buffer" }
    ],
    "primary_reason": "Below Wave 2 start — Elliott invalidation",
    "confidence": "high"
  },
  "targets": [
    {
      "rank": 1,
      "price": 92.00,
      "distance_pct": 7.0,
      "r_multiple": 1.71,
      "methods": [
        { "engine": "elliott", "method": "Wave 3 extension (1.618)", "score": 0.90 },
        { "engine": "fibonacci", "method": "1.618 extension", "score": 0.75 },
        { "engine": "harmonic", "method": "Gartley PRZ target", "score": 0.68 },
        { "engine": "classical", "method": "Double bottom measured move", "score": 0.62 }
      ],
      "method_diversity": 4,
      "cluster_sum_score": 2.95,
      "confidence": "high"
    },
    {
      "rank": 2,
      "price": 96.00,
      "distance_pct": 11.6,
      "r_multiple": 2.83,
      "methods": [
        { "engine": "elliott", "method": "Wave 5 extension (0.618)", "score": 0.72 },
        { "engine": "fibonacci", "method": "2.618 extension", "score": 0.65 }
      ],
      "method_diversity": 2,
      "cluster_sum_score": 1.37,
      "confidence": "medium"
    },
    {
      "rank": 3,
      "price": 100.50,
      "distance_pct": 16.8,
      "r_multiple": 4.10,
      "methods": [
        { "engine": "structure", "method": "Prior major swing high", "score": 0.80 }
      ],
      "method_diversity": 1,
      "cluster_sum_score": 0.80,
      "confidence": "low"
    }
  ],
  "risk_reward": {
    "target_1_rr": 1.71,
    "target_2_rr": 2.83,
    "target_3_rr": 4.10,
    "blended_rr": 2.52,
    "primary_rr": 1.71
  },
  "position_sizing": {
    "risk_per_trade_pct": 2.0,
    "fixed_fractional": {
      "units_per_1000_capital": 48,
      "max_capital_risk": 20.00,
      "units": 48.78,
      "position_value": 4195.08
    },
    "atr_based": {
      "units_per_1000_capital": 50,
      "units": 50.0,
      "position_value": 4300.0
    },
    "note": "User must confirm capital and risk tolerance"
  },
  "invalidation": {
    "price": 82.50,
    "condition": "close below",
    "reason": "Below Wave 2 start invalidates entire bullish count"
  },
  "confluence_snapshot": {
    "direction": "bullish",
    "score": 0.62,
    "regime": "trending_strong",
    "engines_agreeing": ["elliott", "harmonic", "structure", "indicators"],
    "engines_disagreeing": ["classical"]
  },
  "warnings": [
    "Stop distance 4.1% > 3% — position size is conservative",
    "Target 3 has only 1 method — highest risk"
  ],
  "data_quality": {
    "engines_used": 4,
    "engines_unavailable": ["classical"],
    "targets_proposed": 11,
    "clusters_formed": 4,
    "clusters_returned": 3
  }
}
```

---

## 4. API Endpoints

### 1. Analysis Service (FastAPI)
- `POST /trade-plan/compute`
  - Input: `{"symbol": "COMI", "timeframe": "1D", "capital": 1000, "risk_pct": 2.0, "candles": [...]}`
  - Returns complete `TradePlan` payload.

### 2. Next.js Web App API
- `GET /api/trade-plan/[symbol]?timeframe=1D&capital=1000&risk_pct=2`
- **Redis TTL Caching:**
  - Daily & Weekly: 3,600s (1 hour)
  - 4-Hour: 1,800s (30 minutes)
  - Intraday: 300s (5 minutes)
