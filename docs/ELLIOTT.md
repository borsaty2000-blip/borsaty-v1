# Elliott Wave Rule-First Engine (بورصتي - محرك موجات إليوت المبني على القواعد الصارمة)

## 1. Overview & Axiomatic Philosophy

The Borsaty Elliott Wave Engine is a **rule-first, deterministic mathematical engine** designed to derive valid Elliott Wave counts from Hierarchical Structural Pivot Detection (HSPD) pivots.

### Core Axioms
1. **Rule-First Binary Derivation:** Elliott Wave is not visual pattern matching or heuristic estimation. A wave count is an axiomatic derivation: if a count violates even **one** hard mathematical rule, it is **instantly rejected**. There is no "almost valid" count.
2. **Deterministic & Zero LLM:** Every ratio, extension, degree check, and wave boundary is computed via deterministic geometry and Fibonacci mathematics. No generative AI or fuzzy heuristics are used in wave derivation or price target generation.
3. **Ambiguity Preservation:** When multiple valid counts survive binary hard rules, the engine selects the highest-scoring candidate as the `primary_count`, while maintaining structurally distinct interpretations in `alternative_count`.
4. **Strict Multi-Timeframe Coherence:** Timeframes must speak the same language. When Higher Timeframe (Weekly/Daily) and Lower Timeframe (4H) disagree, the engine refuses to guess, downgrades coherence, and explicitly suppresses the `trade_ready` execution block.

---

## 2. Supported Wave Structures & Binary Hard Rules

| Pattern | Type | Subtypes | Hard Rules |
| :--- | :--- | :--- | :--- |
| **Impulse** | Motive (5 waves: 1-2-3-4-5) | `regular`, `extended_third`, `extended_fifth` | 1. **Wave 2 Retracement < 100%** of Wave 1 (never re-crosses start of Wave 1).<br>2. **Wave 3 is Never Shortest** among Waves 1, 3, and 5.<br>3. **Wave 4 Never Overlaps Wave 1** (Wave 4 low > Wave 1 high in bull; Wave 4 high < Wave 1 low in bear).<br>4. **Directional Continuity**: Waves 1, 3, and 5 must advance in trend direction. |
| **ZigZag** | Corrective (3 waves: A-B-C / 5-3-5) | `regular`, `extended_c` | 1. **Wave B Retraces < 100%** of Wave A.<br>2. **Wave C Extends Beyond Wave A** extreme. |
| **Flat** | Corrective (3 waves: A-B-C / 3-3-5) | `regular_flat`, `expanded_flat`, `running_flat` | 1. **Wave B Retraces $\ge$ 90%** of Wave A (re-tests origin).<br>2. **Wave C Terminates Near or Beyond** Wave A origin ($\ge$ 85% length of A). |
| **Triangle** | Corrective (5 waves: A-B-C-D-E / 3-3-3-3-3) | `contracting`, `expanding` | 1. **Consistent Wave Progression**: Successive waves must contract monotonically ($|B| < |A|, |C| < |B|, |D| < |C|, |E| < |D|$) or expand monotonically.<br>2. **Wave E Containment**: Wave E endpoint remains within price boundary of Wave A. |

---

## 3. Fibonacci Soft Scoring & Mathematical Weights

Candidates passing all binary hard rules receive a continuous score $\in [0.0, 1.0]$ based on ideal Fibonacci relationships:

### Impulse Soft Scoring Components:
- **Wave 3 Extension Ratio:**
  $$\text{Ideal } \frac{\text{Length}_3}{\text{Length}_1} = 1.618 \quad [\text{Acceptable: } 1.30 - 2.618]$$
- **Wave 2 Retracement:**
  $$\text{Ideal } \frac{\text{Length}_2}{\text{Length}_1} \in [0.50, 0.618] \quad [\text{Acceptable: } 0.382 - 0.786]$$
- **Wave 4 Retracement:**
  $$\text{Ideal } \frac{\text{Length}_4}{\text{Length}_3} = 0.382 \quad [\text{Acceptable: } 0.236 - 0.500]$$
- **Wave 5 Extension:**
  $$\text{Ideal } \frac{\text{Length}_5}{\text{Length}_{1 \to 3}} = 0.618 \quad [\text{Acceptable: } 0.382 - 1.000]$$

Total candidate score is synthesized using **geometric mean**, penalizing any severe deviation from classic Elliott proportions:
$$\text{Score} = \left(\prod_{i=1}^k S_i\right)^{1/k}$$

---

## 4. Multi-Timeframe Coherence Engine

The `MultiTfElliott` engine evaluates wave counts across **Weekly**, **Daily**, and **4-Hour** timeframes simultaneously.

### Pairwise Evaluation Rules:
1. **Direction Harmony:** Last active wave on lower timeframe must align with the active trend phase of the higher timeframe.
2. **Fractal Containment:** Minor corrective waves on 4H/Daily must structurally nest inside consolidation waves (Wave 2 or Wave 4) of Daily/Weekly.
3. **Contradiction Penalty:** Disagreeing directions penalize the score by $-0.20$.

### Coherence Tiers & Gating:
$$\text{Coherence Score} = \text{clamp}\left(0.50 + \sum \Delta_{\text{pairwise}}, 0.0, 1.0\right)$$

- **HIGH ($\ge 0.85$):** Unanimous agreement across all 3 timeframes. Trade signals confirmed with maximum confidence.
- **MEDIUM ($0.60 - 0.84$):** Minor sub-wave divergence but primary trend matches. Trade signals flagged with caution advisory.
- **LOW ($< 0.60$):** Contradictory counts across timeframes. **`trade_ready` block is strictly suppressed** with reason:
  > *"Counts are contradictory across timeframes. Wait for clarity before acting."*

---

## 5. Trade-Ready Block Specifications

When a pattern satisfies:
1. `pattern_score >= 0.70`
2. `stability_score >= 0.85`
3. `coherence_score >= 0.60`

The engine emits a deterministic execution block:

```json
{
  "entry_zone": {
    "low": 122.00,
    "high": 124.50
  },
  "stop_loss": {
    "price": 103.50,
    "method": "wave2_low - ATR buffer",
    "distance_pct": 16.87
  },
  "target_1": {
    "price": 154.93,
    "method": "wave3_extension_1.618",
    "r_multiple": 1.45
  },
  "target_2": {
    "price": 161.08,
    "method": "wave5_extension_0.618",
    "r_multiple": 1.74
  },
  "risk_reward": 1.45,
  "invalidation": {
    "price": 110.00,
    "reason": "close below wave1_high invalidates impulse wave structure"
  }
}
```

---

## 6. API Endpoints

### 1. Analysis Service (FastAPI)
`POST /elliott/detect`
- **Single-Timeframe:** Analyzes supplied candles or pre-detected HSPD pivots.
- **Multi-Timeframe:** Supply `multi_tf_candles: { "weekly": [...], "daily": [...], "h4": [...] }` to receive synchronized pairwise coherence and cross-timeframe synthesis.

### 2. Next.js Web App API
`GET /api/elliott/{symbol}?timeframe=1D&include_alternatives=true&min_degree=1`
- **Redis Caching Strategy:**
  - Daily & Weekly (`1D`, `1W`): 3,600 seconds (1 hour TTL)
  - 4-Hour (`4H`): 1,800 seconds (30 minutes TTL)
  - Intraday (`1H`, `15M`, `5M`): 300 seconds (5 minutes TTL)
- Seamless fallback for standalone operation when python analysis service is offline.
