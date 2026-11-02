# Dual-Authored Narrator Engine (بورصتي - محرك الصياغة المزدوجة المستقلة)

## 1. Overview & Core Philosophy

The Borsaty Narrator Engine v2.0.0 (`packages/analysis/narrator/`) generates natural financial market narratives from deterministic quantitative analysis payloads.

> [!IMPORTANT]
> **The Golden Axiom: We Do NOT Translate. We Author Twice.**
> - **The Arabic Voice** is an **original composition** written directly in Arabic financial idioms ("الموجة الدافعة", "العدّ الموجي", "المصداقية", "بناءً على هذا البناء"), following Arabic nominal-to-verbal rhetoric flow.
> - **The English Voice** is an **original composition** written directly in institutional financial English ("developing in", "impulse sequence", "confluence reading", SVO syntax).
> - **Zero LLM in Production:** 100% deterministic template and fact-bound generation. No nondeterminism, no hallucinated numbers, and sub-50ms execution.

---

## 2. Stylistic Principles & Number Formatting

### Why Western Arabic Numerals (0-9) in Arabic Financial Reporting?
In modern Arabic financial markets (The Egyptian Exchange EGX, Saudi Tadawul TASI, Dubai Financial Market DFM, and regional central banks), official financial statements and trading screens standardly use Western Arabic numerals (`0-9`) rather than Eastern numerals (`٠-٩`). Using Eastern numerals in institutional equity market reporting looks archaic and unfamiliar to professional Arab traders.

### Currency Formatting Rules
- **Arabic Locale:** Currency symbol placed **after** the number (`86.00 ج.م`, `28.00 ر.س`, `220.00 $`).
- **English Locale:** Currency code placed **before** the number (`EGP 86.00`, `SAR 28.00`, `$220.00`).
- **Score Formatting:**
  - Arabic: `84 من 100`
  - English: `84/100`

---

## 3. Structural Comparison of Authoring

| Dimension | Arabic Voice (الصياغة العربية) | English Voice (الصياغة الإنجليزية) |
| :--- | :--- | :--- |
| **Sentence Structure** | Nominal $\to$ Verbal flow ("سهم البنك التجاري الدولي يتحرك حالياً...") | Strict SVO ("Commercial International Bank trades at...") |
| **Wave Terminology** | "الموجة الدافعة الثالثة" (natural Arabic ordinal) | "Wave 3 of an impulse sequence" |
| **Confluence Phrasing** | "مما يعزز المصداقية للمسار الهيكلي" | "Reinforcing structural count reliability" |
| **Target Framing** | "تتوزع الأهداف السعرية التوافقية وفق الترتيب..." | "Consensus profit targets are mapped as..." |
| **Disclaimer Tone** | "هذا التحليل تعليمي وكمي بحت، ولا يُعتبر توصية استثمارية..." | "This analysis is strictly educational and quantitative..." |

---

## 4. Enhanced Zero-Hallucination Gate

The `NarratorVerification` engine ensures that no numerical token or marketing claim exists in the text unless authorized:

1. **Direct Payload Values:** Current price, entry bounds, stop loss, target prices, ATR, and volume ratios.
2. **Derived Mathematical Percentages:**
   - Gain percentage: $\frac{|\text{Target} - \text{Price}|}{\text{Price}} \times 100$
   - Stop risk percentage: $\frac{|\text{Price} - \text{Stop}|}{\text{Price}} \times 100$
   - Scores out of 100: $\text{Score} \times 100$
3. **Derived R-Multiples:** Target risk-reward multiples ($R_1, R_2, R_3, R_{\text{blended}}$).
4. **Forbidden Claim Detection:** Words like `"guaranteed"`, `"risk-free"`, `"مضمون"`, or `"ربح مؤكد"` immediately trigger `HallucinationError`.

---

## 5. Output Schema

```json
{
  "symbol": "COMI",
  "language": "ar",
  "style": "professional",
  "version": "2.0.0",
  "generated_at": "2026-11-02T08:15:00Z",
  "sections": {
    "analysis_summary": "سهم البنك التجاري الدولي يتحرك حالياً عند 86.00 ج.م في إطار مسار صاعد إيجابي، مستنداً إلى درجة توافق تبلغ 84 من 100...",
    "elliott": "البنك التجاري الدولي يتحرك حالياً في الموجة الدافعة الثالثة، وهي مرحلة اتجاهية رئيسية في البناء الموجي الخماسي...",
    "harmonic": "تم رصد نموذج جارتلي صاعد مؤكد رياضياً، محققاً استقراراً كاملاً داخل منطقة الانعكاس المحتملة (PRZ)...",
    "classical": "أكد المحرك الكلاسيكي اكتمال نموذج القاع المزدوج بعد استيفائه بوابات التحقق الخمس الصارمة...",
    "trade_plan": "بناءً على التوافق المشترك، تتحدد منطقة الدخول الفنية بين 85.50 ج.م و 86.50 ج.م. يستقر وقف الخسارة عند مستوى 82.50 ج.م...",
    "warnings": ["وقف الخسارة أوسع من 3% — ينصح بتقليص حجم المركز"],
    "disclaimer": "هذا التحليل تعليمي وكمي بحت، ولا يُعتبر توصية استثمارية مباشرة بالبيع أو الشراء. القرارات الاستثمارية هي مسؤولية المستخدم بالكامل."
  },
  "full_text": "...",
  "verification": {
    "status": "passed",
    "numbers_checked": 12,
    "numbers_authorized": 12,
    "hallucination_gate": "clear"
  }
}
```

---

## 6. API Endpoints

### 1. Analysis Service (FastAPI)
- `POST /narrate`: Generate narration from input candlestick data or payload.
  - Input: `{"symbol": "COMI", "timeframe": "1D", "language": "ar", "style": "professional", "candles": [...]}`
  - Returns complete narrative structure with verification metadata.

### 2. Next.js Web App API
- `GET /api/narrate/[symbol]?timeframe=1D&language=ar&style=professional`
- **Integrated into Full Analysis:** `GET /api/analysis/[symbol]/full` automatically includes both `narrative_ar` and `narrative_en`.
- **Redis Caching Strategy:**
  - Daily & Weekly: 3,600s (1 hour)
  - 4-Hour: 1,800s (30 minutes)
  - Intraday: 300s (5 minutes)
