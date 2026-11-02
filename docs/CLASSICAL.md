# Classical Chart Patterns Rule-First Engine (بورصتي - محرك النماذج الفنية الكلاسيكية الحتمي)

## 1. Overview & Axiomatic Philosophy

The Borsaty Classical Chart Patterns Engine is a **purely deterministic, 5-gate pattern recognition engine** that derives confirmed classical reversal and continuation patterns from Hierarchical Structural Pivot Detection (HSPD) pivots and candlestick volume profiles.

### Core Axioms
1. **Shape is Necessary; Logic is Sufficient; Both are Mandatory:** A classical chart pattern is **NOT** merely a visual shape. It is a **market structure** that satisfies BOTH:
   - **Geometric constraints:** Exact pivot sequences, symmetry, and depth derived from HSPD pivots.
   - **Contextual constraints:** Declining formation volume, breakout volume expansion, confirmed close (wick rejection), and time duration.
2. **Close vs. Wick Confirmation:** Intraday wicks that breach a neckline or support/resistance level without a confirmed bar close are **strictly rejected**. Patterns with wick-only breaches remain labeled as `"forming"`.
3. **Volume-Gated Breakouts:** Breakouts without volume expansion exceeding the pattern-specific threshold are disqualified from `"confirmed"` status and transparently surfaced under `"near_misses"`.
4. **Transparent Near-Misses:** If a pattern fails a specific gate (e.g. volume on right shoulder exceeds head), it is never silently dropped or presented with ambiguous labels; it is recorded with the exact failed gate, measured values, and theoretical score.

---

## 2. Pattern Specifications & Logic Rules

| Pattern | Type | Direction | Shape Rules | Volume Threshold | Breakout Criterion | Target Derivation |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **Head and Shoulders** | Reversal | Bearish | 3 peaks; Head > LS & RS; Shoulders within 10% | $\ge 1.3\times$ SMA | Close below neckline | $T_1 = \text{Neck} - \text{Depth} \times 1.0$<br>$T_2 = \text{Neck} - \text{Depth} \times 1.618$ |
| **Inverse H&S** | Reversal | Bullish | 3 troughs; Head < LS & RS; Shoulders within 10% | $\ge 1.3\times$ SMA | Close above neckline | $T_1 = \text{Neck} + \text{Depth} \times 1.0$<br>$T_2 = \text{Neck} + \text{Depth} \times 1.618$ |
| **Double Top** | Reversal | Bearish | 2 peaks within 3%; Valley decline $\ge 3\%$ | $\ge 1.2\times$ SMA | Close below valley low | $T_1 = \text{Valley} - \text{Height} \times 1.0$<br>$T_2 = \text{Valley} - \text{Height} \times 1.618$ |
| **Double Bottom** | Reversal | Bullish | 2 troughs within 3%; Peak rally $\ge 3\%$ | $\ge 1.2\times$ SMA | Close above peak high | $T_1 = \text{Peak} + \text{Height} \times 1.0$<br>$T_2 = \text{Peak} + \text{Height} \times 1.618$ |
| **Triple Top** | Reversal | Bearish | 3 peaks within 3%; 2 intervening valleys | $\ge 1.3\times$ SMA | Close below lowest valley | $T_1 = \text{Valley} - \text{Height} \times 1.0$ |
| **Triple Bottom** | Reversal | Bullish | 3 troughs within 3%; 2 intervening peaks | $\ge 1.3\times$ SMA | Close above highest peak | $T_1 = \text{Peak} + \text{Height} \times 1.0$ |
| **Ascending Triangle** | Continuation | Bullish | Flat upper resistance ($\le 2\%$); Rising support | $\ge 1.5\times$ SMA | Close above resistance | $T_1 = \text{Resistance} + \text{Base Height}$ |
| **Descending Triangle** | Continuation | Bearish | Flat lower support ($\le 2\%$); Falling resistance | $\ge 1.5\times$ SMA | Close below support | $T_1 = \text{Support} - \text{Base Height}$ |
| **Symmetrical Triangle** | Continuation | Directional | Lower highs & Higher lows converging | $\ge 1.4\times$ SMA | Close beyond boundary | $T_1 = \text{Breakout} \pm \text{Base Height}$ |
| **Bull Flag** | Continuation | Bullish | Sharp pole $\ge 5\%$ in $\le 15$ bars; Retrace $< 50\%$ | $\ge 1.4\times$ SMA | Close above pole peak | $T_1 = \text{Breakout} + \text{Pole Height}$ |
| **Bear Flag** | Continuation | Bearish | Sharp pole $\ge 5\%$ drop; Retrace $< 50\%$ | $\ge 1.4\times$ SMA | Close below pole trough | $T_1 = \text{Breakout} - \text{Pole Height}$ |
| **Cup and Handle** | Continuation | Bullish | Rounded bottom; Rim within 3%; Pullback 10-40% | $\ge 1.3\times$ SMA | Close above rim level | $T_1 = \text{Rim} + \text{Cup Depth}$ |

---

## 3. The 5-Gate Validation Pipeline

Every pattern candidate passes through five sequential gates:

1. **Gate 1 — Shape Geometry:** Validates HSPD pivot alternation, height ratios, boundary tolerance, and neckline definition.
2. **Gate 2 — Formation Volume Profile:** Computes linear regression volume slope across pattern formation. Expects declining volume into consolidation/apexes.
3. **Gate 3 — Breakout Volume Ratio:** Ratio of breakout bar volume to 20-bar Simple Moving Average (SMA). Must exceed pattern threshold (e.g. $1.3\times$ to $1.5\times$).
4. **Gate 4 — Breakout Confirmation (Close vs. Wick):** Enforces bar close beyond the critical level. Wick penetrations without confirmed close keep the pattern in `"forming"` state.
5. **Gate 5 — Retest Verification:** Tracks post-breakout pullback to the broken level. Successful retests provide a confidence boost to `pattern_score`.

---

## 4. Status Classification

Patterns are partitioned into unambiguous statuses:

- `"forming"`: Valid shape geometry established, but price has not yet broken out or closed beyond the confirmation level.
- `"confirmed"`: Full 5-gate pass. Confirmed close with elevated breakout volume.
- `"failed"`: Breakout occurred, but price subsequently closed back across the invalidation level (e.g. back above the Right Shoulder).
- `"unavailable"`: Market is consolidating or range-bound without qualified classical patterns.

---

## 5. API Reference

### 1. Analysis Engine (FastAPI)
- `POST /classical/detect`: Accepts symbol, timeframe, candles, or pre-computed HSPD pivots. Supports optional `pattern` and `status` filters.

### 2. Next.js Web App API
- `GET /api/classical/[symbol]?timeframe=1D&status=confirmed&pattern=head_and_shoulders`
- `GET /api/classical/[symbol]/near-misses?timeframe=1D`
- **Redis Caching Strategy:**
  - Daily & Weekly: 3,600s (1 hour)
  - 4-Hour: 1,800s (30 minutes)
  - Intraday (1H, 15M, 5M): 300s (5 minutes)
