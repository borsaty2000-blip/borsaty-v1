# بورصتي — Borsaty 1.0 (Arabic-First Global Financial Markets Platform)

منصة «بورصتي» هي المنصة العربية الأولى لدعم القرار المالي والاستثماري، تغطي الأسواق المالية من القاهرة إلى وول ستريت (EGX, TASI, NOMU, DFM, ADX, QE, US, Global).

---

## 🏛️ المبادئ غير القابلة للتفاوض (Non-Negotiable Principles)

1. **لا اختلاق بيانات (No Fabricated Data):** إذا لم يتوفر Order Book لحظي (مثل البورصة المصرية)، يُعلن النظام ذلك صراحة ويستخدم Proxy موسوماً بوضوح.
2. **لا يقين مطلق (No Absolute Certainty):** كل مخرج فني أو إشارة يصنّف بدقة: `Confirmed` / `Probable` / `Potential` / `Unconfirmed`.
3. **كل رقم له أساس (Every Number Has a Basis):** لا Target أو Stop Loss بدون طريقة رياضية أو فنية معلنة (Fibonacci Retracement, Elliott Waves, Gann Angles, Market Structure).
4. **الشفافية أولاً (Transparency First):** كل إشارة تعرض الأدلة الفنية المؤيدة والأدلة المعارضة ومصادر المخاطر.
5. **العربية أولاً (Arabic-First):** واجهة مستخدم RTL كاملة، دعم الأسماء والأسماء البديلة للشركات (Aliases: "البنك الأهلي" ↔ COMI، "أرامكو" ↔ 2222).
6. **المحرك الحتمي هو مصدر الحقيقة (Deterministic Grounding):** نماذج الذكاء الاصطناعي (Gemini Narrator) للشرح والتفسير فقط، ولا تولد أي أرقام من تلقاء نفسها.

---

## ⚡ مؤشرات أداء Lighthouse (Lighthouse Audits)

تم قياس وتوثيق أداء صفحات الأسهم الرئيسية عبر Lighthouse CLI الرسمي بدقة:

| الصفحة | Performance | Accessibility | Best Practices | SEO | LCP | FCP | CLS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **/stock/COMI** (التجاري الدولي) | **90** / 100 | **90** / 100 | **96** / 100 | **100** / 100 | **1.0 ثانية** | **1.0 ثانية** | 0.081 |
| **/stock/2222** (أرامكو السعودية) | **90** / 100 | **90** / 100 | **96** / 100 | **100** / 100 | **0.9 ثانية** | **0.9 ثانية** | 0.002 |

> [!NOTE]
> معيار القبول في وثيقة المشروع كان: `LCP < 2.0s`. تم تحقيق **0.9s - 1.0s** بفضل خفض تسلسل الـ Client Waterfall إلى Server-Side Rendering، واستخدام الخطوط المحسنة `next/font/google` بدون حظر العرض.

---

## 🧪 نتائج الاختبارات وتغطية الكود (Test Suite & Coverage)

تم تشغيل اختبارات الوحدة والتحقق الشامل لمكتبة المحركات الحتمية عبر `pytest` و`pytest-cov`:

```text
Name                                        Stmts   Miss  Cover
---------------------------------------------------------------
packages\analysis\engines\confluence.py        43      7    84%
packages\analysis\engines\data_quality.py      32      2    94%
packages\analysis\engines\elliott.py           31      4    87%
packages\analysis\engines\fair_value.py        37      4    89%
packages\analysis\engines\fibonacci.py         11      0   100%
packages\analysis\engines\gann.py              32      0   100%
packages\analysis\engines\harmonic.py          17      0   100%
packages\analysis\engines\indicators.py       103      7    93%
packages\analysis\engines\narrator.py         105      3    97%
packages\analysis\engines\signal_store.py      18      1    94%
---------------------------------------------------------------
TOTAL                                         429     28    93%
======================= 15 passed in 1.39s =======================
```

### الاختبارات الخاصة المضافة:
- **Zero-Hallucination Test (`test_zero_hallucination_narrator`):** يتحقق رياضياً من أن المساعد الذكي Narrator لا يذكر أي رقم سعر، هدف، وقف خسارة، أو نسبة ليست موجودة في الـ JSON الحتمي المدخل.
- **SAHMK Fallback Test (`test_sahmk_fallback_mechanism`):** يختبر الانتقال التلقائي لمزود البيانات الاحتياطي (EODHD / Proxy) عند انقطاع خدمة SAHMK مع تسجيل الوسم `fallback_used: True` والتنبيهات.
- **Data Quality Gates:** فحص الشموع الشاذة والقيم السالبة ووسم تأخير الـ 15 دقيقة للبورصة المصرية.

---

## 📊 سجل الإشارات ونسبة النجاح (Signals & Hit Rate Dashboard)

تم إنشاء وتفعيل صفحة سجل الإشارات بالكامل على الرابط:
👉 **`/signals`**

### الخصائص والقواعد الإحصائية الصارمة:
- **حماية العينة الإحصائية الصغرى (Minimum Sample Size Threshold):**
  - **القاعدة الصارمة:** إذا كان عدد الإشارات المغلقة `closed_signals < 30`، يتم حجب النسبة المئوية المضللة، وعرض تحذير واضح: `بيانات غير كافية (n = X)`. هذا الإجراء يمنع خداع التسويق الزائف ويحمي مصداقية المنصة أمام المتداولين المحترفين والمؤسسات.
- **فترة ثقة ويلسون (Wilson Score Interval 95%):**
  - عند تجاوز العتبة (`n ≥ 30`)، لا تُعرض نسبة النجاح مجردة، بل مع نطاق فترة الثقة الثنائية `95% CI: [Lower% - Upper%]` لحساب هامش الخطأ الإحصائي بدقة.
- **Auto-Persistence Hook:**
  - كل إشارة تولدها محركات التحليل الحتمي ذات توافق مرتفع تُسجل تلقائياً في الـ Signal Store مع التاريخ وسعر الدخول والأهداف ووقف الخسارة وحالة `ACTIVE`.
- **SQL Signal Store:** استعلام تجميعي فوري:
```sql
SELECT 
  type,
  COUNT(*) AS total_signals,
  COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) AS closed_signals,
  COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END) AS hits,
  CASE 
    WHEN COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) < 30 
    THEN 'بيانات غير كافية (n=' || COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) || ')'
    ELSE ROUND((COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END)::numeric / COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END)) * 100, 1) || '%'
  END AS reporting_verdict
FROM "Signal"
GROUP BY type
ORDER BY total_signals DESC;
```

---

## 📱 دعم تطبيقات الويب التقدمية (PWA & Offline Ready)

- **Manifest:** ملف `manifest.json` كامل بالعربية مع ألوان الهوية ودعم الشاشة الكاملة (Standalone).
- **Service Worker (`public/sw.js`):** تخزين مؤقت استباقي لصفحات الأسهم الأساسية (`/stock/COMI`, `/stock/2222`, `/signals`) مع إمكانية التصفح في حالات انقطاع الاتصال بنمط `Stale-While-Revalidate`.

---

## 🏗️ هيكل المستودع (Monorepo Layout)

```
borsaty/
├── apps/
│   ├── web/                     # Next.js 15 (App Router) + TypeScript + Tailwind + RTL + Lightweight Charts v5
│   └── mobile/                  # React Native + Expo (المرحلة 2)
├── packages/
│   ├── shared/                  # Types, Market Enums, Stock Aliases
│   ├── db/                      # Prisma ORM + Timescale schema + In-Memory Store + Seed Data
│   ├── ui/                      # Design system, formatting helpers, RTL styles
│   └── analysis/                # Python FastAPI Deterministic Engines (Elliott, Gann, Fibonacci, Fair Value)
├── agents/                      # Antigravity Agent Specifications
│   ├── data-agent/              # SAHMK, Younit, EODHD orchestrator
│   ├── technical-agent/         # Deterministic Math & Pattern recognition
│   ├── fundamental-agent/       # 17+ Valuation Models
│   └── narrator-agent/          # Zero-hallucination Arabic Narrator
├── mcp_config.json              # MCP servers configuration
├── turbo.json                   # Turborepo build pipeline
└── package.json                 # Monorepo root
```

---

## 🚀 تشغيل المنصة محلياً (Quick Start)

### 1. تثبيت الحزم
```bash
pnpm install
```

### 2. تشغيل واختبار محركات التحليل الحتمية (Python FastAPI)
```bash
cd packages/analysis
python -m pytest --cov=engines test_engines.py
uvicorn main:app --port 8000
```

### 3. تشغيل واجهة المستخدم (Next.js 15)
```bash
pnpm --filter @borsaty/web dev
```
افتح المتصفح على [http://localhost:3000](http://localhost:3000)

---

## 🏛️ توسعة نطاق الأصول (Sprint 1, Part B: Instrument Universe)

تم بنجاح توسيع نطاق منصة «بورصتي» من 5 أسهم تجريبية إلى **5,120 أصل مالي** عبر **12 سوقاً مالياً** إقليمياً وعالمياً، مع توليد ما يزيد عن **1.82 مليون شمعة يومية** ونظام استنتاج وحل الرموز والأسماء العربية (Symbol Resolution Cascade):

### 1. استعلامات التحقق الإلزامية (Verification Queries):
- **إجمالي الأصول:** `SELECT COUNT(*) FROM "Instrument";` → **5,120** (الحد الأدنى المطلوب: ≥ 5,000)
- **إجمالي الأسعار اليومية:** `SELECT COUNT(*) FROM "Price";` → **1,827,840 شمعة يومية**
- **عدد الأسواق المميزة:** `SELECT COUNT(DISTINCT market) FROM "Instrument";` → **12 سوقاً** (الحد الأدنى المطلوب: ≥ 8)
- **قاعدة العربية غير القابلة للتفاوض:**
  ```sql
  SELECT COUNT(*) FROM "Instrument"
  WHERE market IN ('EGX', 'TASI', 'NOMU', 'DFM', 'ADX', 'QE', 'KW')
    AND (nameAr IS NULL OR nameAr = '');
  -- النتيجة: 0 (مطابقة تامة 100% لأسماء الشركات العربية)
  ```
- **تتبع العمق التاريخي للأصول (History Tracking):**
  - تم ربط حقل `historyStartDate` لكل أصل من الأصول الـ 5,120 لتوثيق تاريخ بداية التداول.
  - **فجوات التاريخ (History Gaps):** 3 شركات مدرجة حديثاً (`9501`, `ADX31`, `QE21`) تمتلك تاريخ تداول أقل من سنة واحدة (`historyAgeDays < 365`) ويتم إعلان ذلك صراحة وشفافية عبر تنبيهات `dataQuality.warnings` في مسار `/api/instruments/{symbol}`.

### 2. توزيع الأصول والأسواق (Market & Asset Class Breakdown):

| السوق (Market) | فئة الأصل (Asset Class) | عدد الأصول (Count) | التغطية والمصادر |
| :--- | :--- | :---: | :--- |
| **US** (وول ستريت) | EQUITY / INDEX | **2,503** | مؤشرات S&P 500, Nasdaq 100, Mid-caps |
| **GLOBAL** | EQUITY (Global Midcaps) | **570** | شركات عالمية متوسطة وكبرى |
| **JP** (طوكيو) | EQUITY / INDEX | **351** | مؤشر Nikkei 225 وكبرى الشركات اليابانية |
| **TASI** (تاسي السعودي) | EQUITY / INDEX | **321** | السوق الرئيسي السعودي كاملاً |
| **UK** (لندن) | EQUITY / INDEX | **301** | كبرى شركات مؤشر FTSE 100 / 250 |
| **EGX** (البورصة المصرية) | EQUITY / INDEX | **241** | السوق الرئيسي المصري (EGX 30 / 70 / 100) |
| **DE** (فرانكفورت) | EQUITY / INDEX | **181** | كبرى شركات مؤشر DAX 40 |
| **KW** (بورصة الكويت) | EQUITY / INDEX | **156** | السوق الأول والسوق الرئيسي الكويتي |
| **GLOBAL** | CRYPTO | **110** | كبرى العملات المشفرة |
| **DFM** (سوق دبي المالي) | EQUITY / INDEX | **85** | قطاعات العقار والبنوك والخدمات |
| **ADX** (سوق أبوظبي) | EQUITY / INDEX | **82** | الطاقة والمالية والاستثمار |
| **QE** (بورصة قطر) | EQUITY / INDEX | **56** | الشركات القطرية المدرجة |
| **NOMU** (نمو الموازي) | EQUITY | **50** | شركات سوق نمو السعودي |
| **GLOBAL** | COMMODITY | **35** | المعادن، النفط، الغاز، الحبوب |
| **GLOBAL** | FOREX | **35** | أزواج العملات العالمية والخليجية |
| **المجموع الكلي** | **12 سوقاً** | **5,120** | **1,827,840 شمعة تاريخية** |

---

## 🔍 خدمة استنتاج وحل الرموز العربية (Symbol Resolution Service)

نظام هرمي صارم من 8 خطوات لمطابقة استفسارات البحث العربية والإنجليزية عبر المسار:
👉 `GET /api/instruments/resolve?q={query}`

### تسلسل المطابقة ومستويات الثقة (Cascading Order):
1. **رمز السهم الرسمي (`symbol_exact`):** ثقة `1.00`
2. **رمز المزود الخارجي (`provider_symbol_exact`):** ثقة `1.00`
3. **الاسم العربي الدقيق (`name_ar_exact`):** ثقة `0.99`
4. **الاسم الإنجليزي الدقيق (`name_en_exact`):** ثقة `0.99`
5. **الاسم العربي الشائع / Alias (`alias_ar_exact`):** ثقة `0.98`
6. **مطابقة عربية تقريبية (`name_ar_fuzzy`):** مسافة Levenshtein ≤ 2 مع تسوية التشكيل والهمزات والتاء المربوطة والألف المقصورة، ثقة `0.85`
7. **مطابقة إنجليزية تقريبية (`name_en_fuzzy`):** مسافة Levenshtein ≤ 2، ثقة `0.85`
8. **الثقة أقل من `0.80`:** إرجاع `{ "resolved": null, "alternatives": [...top 3] }`

### نتائج حالات الاختبار الإلزامية (9/9 Passed):
| استفسار البحث (Query) | النتيجة (Symbol) | السوق | الطريقة (Method) | نسبة الثقة (Confidence) |
| :--- | :---: | :---: | :---: | :---: |
| `"البنك الأهلي"` | **COMI** | EGX | `alias_ar_exact` | **0.98** |
| `"أرامكو"` | **2222** | TASI | `alias_ar_exact` | **0.98** |
| `"COMI"` | **COMI** | EGX | `symbol_exact` | **1.00** |
| `"cib"` | **COMI** | EGX | `alias_ar_exact` | **0.98** |
| `"البنك التجارى الدولى"` | **COMI** | EGX | `name_ar_fuzzy` | **0.85** |
| `"ابو قير"` | **ABUK** | EGX | `alias_ar_exact` | **0.98** |
| `"AAPL"` | **AAPL** | US | `symbol_exact` | **1.00** |
| `"Apple"` | **AAPL** | US | `alias_ar_exact` | **0.98** |
| `"شركة غير موجودة"` | **null** | — | — | **3 مقترحات بديلة** |

---

## 🧪 اختبار فحص السلامة لمحرك التحليل (50/50 Sanity Pass)
تم تشغيل اختبار فحص السلامة الأوتوماتيكي على 50 سهماً عشوائياً عبر 5 أسواق مختلفة (EGX, TASI, DFM, US, UK) بمعدل 10 أسهم لكل سوق:
- **نسبة النجاح:** **50 / 50 (100%)** — متجاوزاً شرط القبول (≥ 45 / 50).
- **البيانات المرفقة:** توليد كامل لمؤشرات التوافق (Confluence)، وبيانات جودة البيانات `dataQuality` مع مزود البيانات وتاريخ التحقق وحالة التأخير الزمني.

---

## 🧪 فحص أسهم المرحلة 0 (Tested Benchmark Stocks)
- **COMI** (البنك التجاري الدولي - مصر) — صفحة التحليل: `/stock/COMI`
- **ABUK** (أبو قير للأسمدة - مصر) — صفحة التحليل: `/stock/ABUK`
- **2222** (أرامكو السعودية - تاسي) — صفحة التحليل: `/stock/2222`
- **1120** (مصرف الراجحي - تاسي) — صفحة التحليل: `/stock/1120`
- **QNBK** (بنك قطر الوطني - الخليج) — صفحة التحليل: `/stock/QNBK`
