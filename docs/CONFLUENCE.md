# Confluence, Market Regime & Analysis Orchestration Engine (بورصتي - محرك التوافق وحالات السوق)

## 1. Overview & Axiomatic Philosophy

The Borsaty Confluence Engine is the **central decision core** of the platform. It integrates evidence produced by all four deterministic analytical engines (Elliott Wave, Harmonic Patterns, Classical Chart Patterns, Indicators) alongside Market Structure (HSPD) and Volume Dynamics into a single, mathematically transparent verdict.

### Core Axioms
1. **Regime-Aware Weighting (Not Equal Weighting):** Different analytical engines hold different predictive power depending on market conditions. For instance:
   - In a **strong trend**, Elliott Wave and Market Structure carry the heaviest weight ($0.25$ and $0.15$), while Harmonic reversals are downweighted ($0.10$).
   - In a **ranging / consolidating market**, Harmonic and Classical boundary patterns carry the highest weights ($0.25$ each), while Elliott impulse is downweighted ($0.10$).
   - In a **breakout**, Volume and Structure dominate ($0.25$ and $0.20$).
2. **Transparent Arithmetic (No Black Box):** Every engine's contribution is explicitly computed as:
   $$\text{Contribution}_i = \text{RawScore}_i \times \text{Weight}_i$$
   The final score is the exact sum of contributions.
3. **Statistical Confidence Intervals via Error Propagation:** Rather than presenting false precision, the engine propagates individual engine uncertainties to calculate a 95% Confidence Interval ($1.96\sigma$):
   $$\sigma_{\text{total}} = \sqrt{\sum_{i} \left(\sigma_i^2 \times \text{Weight}_i^2\right)}$$
   $$\text{CI}_{95\%} = \left[\text{Score} - 1.96 \sigma_{\text{total}}, \; \text{Score} + 1.96 \sigma_{\text{total}}\right]$$
4. **Contradictions Exposed, Never Concealed:** If at least two analytical engines point in the opposite direction of the primary verdict with meaningful magnitude, a `major_contradiction` flag is explicitly reported with bilingual rationales.

---

## 2. The 7 Deterministic Market Regimes

The `RegimeDetector` evaluates raw candles in strict priority order without ML or heuristic opacity:

| Regime | Primary Indicators & Conditions | Market Behavior |
| :--- | :--- | :--- |
| **`volatile_expansion`** | Bollinger Bandwidth percentile $> 90\text{th}$ & Bandwidth $> 5\%$ | Explosive volatility / parabolic surge |
| **`volatile_contraction`** | Bandwidth percentile $< 10\text{th}$, Bandwidth $< 6\%$, $\text{ADX} < 25$ | Severe consolidation / Bollinger Squeeze |
| **`breakout`** | Price exceeds $1.5\sigma$ outside Bollinger Bands ($> \text{Upper} \times (1 + 0.5 \sigma/\mu)$) | High-momentum boundary breach |
| **`trending_strong`** | $\text{ADX} > 30$ AND $|\text{DI}^+ - \text{DI}^-| > 15$ | Dominant directional trend |
| **`trending_weak`** | $\text{ADX} > 20$ (with moderate DI spread) | Developing / softening trend |
| **`mean_reversion`** | Price at BB extreme ($\ge 0.985\text{U}$ or $\le 1.015\text{L}$) + RSI extreme ($<30$ or $>70$) + Declining Volume | Overextended move ready for pullback |
| **`ranging`** | $\text{ADX} < 20$, price oscillates within Bollinger interior | Standard sideways consolidation |

---

## 3. Regime-Specific Weighting Matrix

Every regime distributes exactly $1.00$ ($100\%$) across the six analytical dimensions:

| Regime | Elliott | Classical | Indicators | Harmonic | Structure | Volume | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`trending_strong`** | **0.25** | 0.20 | 0.20 | 0.10 | 0.15 | 0.10 | **1.00** |
| **`trending_weak`** | **0.20** | 0.20 | 0.20 | 0.15 | 0.15 | 0.10 | **1.00** |
| **`ranging`** | 0.10 | **0.25** | 0.15 | **0.25** | 0.15 | 0.10 | **1.00** |
| **`volatile_expansion`** | 0.15 | 0.15 | **0.20** | 0.10 | **0.20** | **0.20** | **1.00** |
| **`volatile_contraction`**| 0.10 | **0.25** | 0.15 | **0.25** | 0.20 | 0.05 | **1.00** |
| **`breakout`** | 0.10 | 0.20 | 0.15 | 0.10 | 0.20 | **0.25** | **1.00** |
| **`mean_reversion`** | 0.10 | 0.20 | **0.25** | **0.25** | 0.15 | 0.05 | **1.00** |

---

## 4. Direction & Strength Classification

The aggregated score $\text{Score} \in [-1.0, +1.0]$ is categorized into definitive strength tiers:

| Absolute Score Range | Strength Tier | Direction |
| :---: | :---: | :---: |
| $|\text{Score}| < 0.15$ | **`neutral`** | `neutral` |
| $0.15 \le |\text{Score}| < 0.40$ | **`weak`** | `bullish` (if $>0$) / `bearish` (if $<0$) |
| $0.40 \le |\text{Score}| < 0.65$ | **`moderate`** | `bullish` (if $>0$) / `bearish` (if $<0$) |
| $|\text{Score}| \ge 0.65$ | **`strong`** | `bullish` (if $>0$) / `bearish` (if $<0$) |

---

## 5. Output Schema

```json
{
  "symbol": "COMI",
  "timeframe": "1D",
  "version": "1.0.0",
  "computed_at": "2026-11-02T07:44:00Z",
  "regime": {
    "regime": "trending_strong",
    "confidence": 0.85,
    "evidence": {
      "adx_value": 34.2,
      "adx_threshold": 30,
      "di_spread": 18.5,
      "bb_width_percentile": 0.55,
      "volume_trend": "rising"
    },
    "since_bars": 12,
    "previous_regime": "ranging",
    "transition_warning": false
  },
  "direction": "bullish",
  "strength": "moderate",
  "score": 0.62,
  "confidence_interval": [0.45, 0.79],
  "engines": {
    "elliott": {
      "raw_score": 0.84,
      "weight": 0.25,
      "contribution": 0.21,
      "rationale_ar": "موجة دافعة صاعدة من الدرجة 2، النتيجة 0.84",
      "rationale_en": "Bullish degree-2 impulse wave, score 0.84"
    },
    "harmonic": {
      "raw_score": 0.95,
      "weight": 0.10,
      "contribution": 0.095,
      "rationale_ar": "نمط جارتلي صاعد مؤكد، درجة 0.95",
      "rationale_en": "Confirmed bullish Gartley, score 0.95"
    },
    "classical": {
      "raw_score": 0.0,
      "weight": 0.20,
      "contribution": 0.0,
      "rationale_ar": "لا نمط كلاسيكي مؤكد",
      "rationale_en": "No confirmed classical pattern"
    },
    "indicators": {
      "raw_score": 0.72,
      "weight": 0.20,
      "contribution": 0.144,
      "rationale_ar": "RSI إيجابي (62) + MACD صاعد + Supertrend صاعد",
      "rationale_en": "RSI bullish (62) + MACD bullish + Supertrend up"
    },
    "structure": {
      "raw_score": 0.88,
      "weight": 0.15,
      "contribution": 0.132,
      "rationale_ar": "قمم وقيعان صاعدة، هيكل اتجاه صاعد (BOS)",
      "rationale_en": "Higher highs and higher lows, BOS confirmed"
    },
    "volume": {
      "raw_score": 0.30,
      "weight": 0.10,
      "contribution": 0.030,
      "rationale_ar": "صعود سعري مدعوم بحجم 1.2x المتوسط",
      "rationale_en": "Price advance confirmed by 1.2x volume"
    }
  },
  "total_score": 0.611,
  "contradictions": [],
  "missing_engines": ["classical"],
  "data_quality": {
    "engines_available": 5,
    "engines_unavailable": 1,
    "coverage_pct": 83
  }
}
```

---

## 6. API Reference

### 1. Analysis Service (FastAPI)
- `POST /analysis/full`: Runs the end-to-end unified pipeline across all engines.
  - Request: `{"symbol": "COMI", "timeframe": "1D", "candles": [...]}`
  - Returns complete `FullAnalysis` object containing regime, pivots, elliott, harmonic, classical, indicators, and confluence verdict.

### 2. Next.js Web App API
- `GET /api/analysis/[symbol]/full?timeframe=1D`
- **Redis Caching Strategy:**
  - Daily & Weekly: 3,600s (1 hour)
  - 4-Hour: 1,800s (30 minutes)
  - Intraday (1H, 15M, 5M): 300s (5 minutes)
- **Performance:**
  - Fresh execution: **< 100ms** (well within the < 2s budget).
  - Cached: **< 10ms** (well within the < 500ms budget).
