# Harmonic Patterns Rule-First Engine (بورصتي - محرك نماذج الهارمونيك الحتمي)

## 1. Overview & Axiomatic Philosophy

The Borsaty Harmonic Patterns Engine is a **purely deterministic, Fibonacci-gated pattern recognition engine** that derives confirmed harmonic reversal and continuation patterns from Hierarchical Structural Pivot Detection (HSPD) pivots.

### Core Axioms
1. **Ratios Over Shapes:** A harmonic pattern is NOT a recognizable visual shape. It is a **specific set of mathematical Fibonacci ratios** that must be satisfied within strict numerical tolerances.
2. **Binary Confirmation:** If even one ratio exceeds tolerance, the pattern is **REJECTED**. Partial patterns are never presented with misleading "potential" or "forming" labels.
3. **PRZ is a Zone, Not a Level:** The Potential Reversal Zone (PRZ) is a confluence zone bounded by multiple Fibonacci projections. Its width must not exceed $2 \times ATR(14)$. If projections diverge beyond $2 \times ATR$, the pattern is rejected for lack of structural confluence.
4. **Deterministic Invalidation & Targets:** Every pattern carries an exact invalidation level based on ATR buffer beyond point D, and three Fibonacci retracement targets (38.2% CD, 61.8% CD, full retrace to A) with dynamic Risk/Reward multiples.

---

## 2. Pattern Specifications & Exact Fibonacci Ratios

| Pattern | Type | Distinguishing Feature | B vs XA | C vs AB | D vs XA (or XC) | CD vs BC |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Gartley** | Reversal | Classic 61.8% B retracement, 78.6% D | `0.618 ± 0.05` | `0.618 ± 0.06` | `0.786 ± 0.03` | `1.272 - 1.618` |
| **Bat** | Reversal | Shallow B (38.2-50%), Deep D (88.6%) | `0.440 ± 0.06` | `0.618 ± 0.15` | `0.886 ± 0.03` | `1.618 - 2.618` |
| **Butterfly** | Reversal | **D extends beyond X** (127 - 161.8%) | `0.786 ± 0.03` | `0.618 ± 0.15` | `1.270 - 1.618` | `1.618 - 2.240` |
| **Crab** | Reversal | **D extends far beyond X** at 161.8% | `0.500 ± 0.12` | `0.618 ± 0.15` | `1.618 ± 0.08` | `2.618 - 3.618` |
| **Deep Crab** | Reversal | Deep 88.6% B, extreme D extension | `0.886 ± 0.05` | `0.618 ± 0.15` | `1.618 - 2.618` | `2.618 - 4.236` |
| **Shark** | Reversal | **B extends beyond X**, C beyond A | `1.270 ± 0.15` | `1.618 ± 0.20` | `0.886 ± 0.05` | `1.618 ± 0.30` |
| **Cypher** | Reversal | **D measured from XC** at 78.6% | `0.500 ± 0.10` | `1.130 - 1.414` | `0.786 ± 0.05 (XC)` | `1.414 ± 0.25` |
| **ABCD** | Continuation | 3-swing harmonic symmetry | — | `0.618 ± 0.15` | `AD: 0.786 - 1.27` | `1.270 - 1.618` |

### 2.5 Tolerance Rationale Table

The engine enforces mathematically defensible tolerances derived from established literature. Tolerances allow for market microstructure (bid-ask spread, tick discrete intervals) without diluting geometric integrity:

| Pattern | Ratio | Ideal | Tolerance | Rationale | Academic Source |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Gartley** | $B \text{ vs } XA$ | `0.618` | `±0.05` | Crucial boundary: separating true Gartley from shallow Bat; ±0.05 accommodates discrete market ticks | Scott Carney, *The Harmonic Trader* (1999) |
| **Gartley** | $C \text{ vs } AB$ | `0.618` | `±0.06` | Standard internal swing retracement bounded within `[0.382, 0.886]` | Larry Pesavento, *Fibonacci Ratios with Pattern Recognition* (1997) |
| **Gartley** | $D \text{ vs } XA$ | `0.786` | `±0.03` | Definitive terminal reversal level; tight tolerance prevents overlap with Bat 0.886 | Scott Carney, *Harmonic Trading Vol. 1* (2004) |
| **Gartley** | $CD \text{ vs } BC$ | `1.272 - 1.618` | range | Reciprocal Fibonacci harmonic extension | H.M. Gartley, *Profits in the Stock Market* (1935); Carney (2004) |
| **Bat** | $B \text{ vs } XA$ | `0.440` | `±0.06` | Shallow retracement strictly capped at 0.500; distinguishes Bat from Gartley | Scott Carney (2001) |
| **Bat** | $C \text{ vs } AB$ | `0.618` | `±0.15` | Flexible internal swing range `[0.382, 0.886]` | Scott Carney (2004) |
| **Bat** | $D \text{ vs } XA$ | `0.886` | `±0.03` | Signature deep reversal point ($\sqrt{0.786}$); tight tolerance prevents extension beyond X | Scott Carney (2001, 2004) |
| **Bat** | $CD \text{ vs } BC$ | `1.618 - 2.618` | range | Extreme projection matching the deep 88.6% retracement | Scott Carney (2004) |
| **Butterfly** | $B \text{ vs } XA$ | `0.786` | `±0.03` | Deep primary retracement; tight tolerance separates from Gartley (0.618) | Bryce Gilmore (1998); Carney (2004) |
| **Butterfly** | $C \text{ vs } AB$ | `0.618` | `±0.15` | Intermediate swing retracement | Larry Pesavento (1997); Carney (2004) |
| **Butterfly** | $D \text{ vs } XA$ | `1.270 - 1.618` | range | Must extend strictly beyond X; establishes breakout-reversal geometry | Bryce Gilmore (1998); Carney (2004) |
| **Butterfly** | $CD \text{ vs } BC$ | `1.618 - 2.240` | range | Reciprocal harmonic extension into PRZ confluence | Scott Carney (2004) |
| **Crab** | $B \text{ vs } XA$ | `0.500` | `±0.12` | Variable shallow retracement `[0.382, 0.618]` | Scott Carney (2000) |
| **Crab** | $C \text{ vs } AB$ | `0.618` | `±0.15` | Internal swing retracement | Scott Carney (2004) |
| **Crab** | $D \text{ vs } XA$ | `1.618` | `±0.08` | Extreme extension beyond X; signature reversal level | Scott Carney (2000, 2004) |
| **Crab** | $CD \text{ vs } BC$ | `2.618 - 3.618` | range | Parabolic extension required to meet extreme 1.618 XA | Scott Carney (2004) |
| **Deep Crab** | $B \text{ vs } XA$ | `0.886` | `±0.05` | Deep retracement distinguishing Deep Crab from standard Crab | Scott Carney (2004) |
| **Deep Crab** | $C \text{ vs } AB$ | `0.618` | `±0.15` | Internal swing retracement | Scott Carney (2004) |
| **Deep Crab** | $D \text{ vs } XA$ | `1.618 - 2.618` | range | Extended PRZ target beyond initial swing origin | Scott Carney (2004) |
| **Deep Crab** | $CD \text{ vs } BC$ | `2.618 - 4.236` | range | Extreme reciprocal projection | Scott Carney (2004) |
| **Shark** | $B \text{ vs } XA$ | `1.270` | `±0.15` | B point extends beyond origin X `[1.13, 1.414]` | Scott Carney (2010) |
| **Shark** | $C \text{ vs } AB$ | `1.618` | `±0.20` | C point extends beyond A `[1.618, 2.24]` | Scott Carney (2010) |
| **Shark** | $D \text{ vs } XA$ | `0.886` | `±0.05` | Overall retracement to 88.6% of original reference leg | Scott Carney (2010) |
| **Shark** | $CD \text{ vs } BC$ | `1.618` | `±0.30` | Harmonic reciprocal projection | Scott Carney (2010) |
| **Cypher** | $B \text{ vs } XA$ | `0.500` | `±0.10` | Intermediate retracement between 0.382 and 0.618 | Darren Oglesbee (2009) |
| **Cypher** | $C \text{ vs } AB$ | `1.130 - 1.414` | range | C extends beyond point A | Darren Oglesbee (2009) |
| **Cypher** | $D \text{ vs } XC$ | `0.786` | `±0.05` | Retracement measured strictly from origin X to extreme C | Darren Oglesbee (2009) |
| **Cypher** | $CD \text{ vs } BC$ | `1.414` | `±0.25` | Counter-extension confirming PRZ | Darren Oglesbee (2009) |
| **ABCD** | $C \text{ vs } AB$ | `0.618` | `±0.15` | Retracement of primary impulse swing | Larry Pesavento (1997) |
| **ABCD** | $AD \text{ vs } AB$ | `0.786 - 1.27` | range | Swing symmetry constraint ($AB \approx CD$) | Larry Pesavento (1997) |
| **ABCD** | $CD \text{ vs } BC$ | `1.270 - 1.618` | range | Reciprocal completion target | Larry Pesavento (1997) |

---

## 3. Potential Reversal Zone (PRZ) Confluence Rules

1. **Projection Cluster:** For each pattern, multiple Fibonacci projections are calculated to point D:
   - Gartley: $0.786 \times XA$, $1.272 \times BC$, $1.618 \times BC$.
   - Bat: $0.886 \times XA$, $2.0 \times BC$, $2.618 \times BC$.
   - Butterfly: $1.27 \times XA$, $1.618 \times XA$, $2.24 \times BC$.
   - Crab: $1.618 \times XA$, $2.618 \times XA$, $3.618 \times BC$.
   - Shark: $0.886 \times XA$, $1.13 \times XC$, $1.618 \times BC$.
   - Cypher: $0.786 \times XC$, $1.414 \times BC$.
2. **Cluster Filtering:**
   - Projections are sorted and clustered into the tightest band containing $\ge 2$ projections.
   - $\text{PRZ Width} = \text{High} - \text{Low}$.
3. **Strict Rejection Gate:**
   - If $\text{PRZ Width} > 2.0 \times ATR(14)$, the pattern is **REJECTED** as structurally too vague.

---

## 4. Invalidation, Targets & Execution Parameters

### Invalidation:
- **Bullish Reversal:** $\text{Invalidation} = D_{\text{low}} - 1.5 \times ATR(14)$.
  Reason: `"close below D_low - 1.5 ATR(14)"`.
- **Bearish Reversal:** $\text{Invalidation} = D_{\text{high}} + 1.5 \times ATR(14)$.
  Reason: `"close above D_high + 1.5 ATR(14)"`.

### Targets:
- **Target 1 (Conservative):** $38.2\%$ retracement of leg $CD$.
- **Target 2 (Primary):** $61.8\%$ retracement of leg $CD$.
- **Target 3 (Structural):** Full retracement to level $A$.
- Each target includes the exact price, mathematical derivation method, and Risk/Reward R-multiple.

---

## 5. Explicit "Unavailable" State Handling

When no valid pattern passes all hard ratio tests, the engine returns an explicit, transparent status with Arabic and English localization:

```json
{
  "symbol": "COMI",
  "timeframe": "1D",
  "version": "1.0.0",
  "status": "unavailable",
  "status_reason": "no_valid_pattern",
  "status_message_ar": "لا توجد نماذج هارمونيك مؤكدة تحقق نسب فيبوناتشي الصارمة",
  "status_message_en": "No confirmed harmonic patterns satisfied exact Fibonacci ratio criteria",
  "patterns": [],
  "rejected_candidates": [
    {
      "pivots_indices": [10, 20, 30, 40, 50],
      "reason": "D_vs_XA = 0.832 exceeds tolerance 0.030 (ideal 0.886) by 0.024",
      "closest_pattern": "bat"
    }
  ],
  "data_quality": {
    "pivots_used": 15,
    "min_degree": 1,
    "patterns_found": 0,
    "patterns_rejected": 5
  }
}
```

---

## 6. API Reference

### 1. Analysis Service (FastAPI)
- `POST /harmonic/detect`: Accepts symbol, timeframe, candles, or pre-computed HSPD pivots.
- `POST /harmonic/prz`: Focused PRZ calculator endpoint given XABCD points and ATR.

### 2. Next.js Web App API
- `GET /api/harmonic/{symbol}?timeframe=1D&min_score=0.7&min_degree=1`
- `GET /api/harmonic/{symbol}/prz?pattern=gartley&timeframe=1D`
- **Redis Caching Strategy:**
  - Daily & Weekly: 3,600s (1 hour)
  - 4-Hour: 1,800s (30 minutes)
  - Intraday (1H, 15M, 5M): 300s (5 minutes)
