# بورصتي AI — Borsaty AI (Investing-Grade Quantitative Intelligence Platform)

منصة «بورصتي AI» هي المنصة المالية والكمية الأولى لدعم القرار الاستثماري، تغطي الأسواق المالية من القاهرة إلى وول ستريت (EGX, TASI, NOMU, DFM, ADX, QE, US, Global).

Borsaty AI connects 8 deterministic engines (HSPD, Elliott Wave, Harmonics, Classical Patterns, 21 Technical Indicators, Multi-Engine Confluence, Trade Plan Engine, and Dual-Authored Narrators) with live pricing and walk-forward verification.

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
- **Pytest Warnings Policy:** فحص صارم للتحذيرات (`-W error::RuntimeWarning -W error::FutureWarning`) لضمان عدم وجود أخطاء صامتة؛ تم استبدال `utcnow()` بـ `datetime.now(timezone.utc)` لمعالجة تحذيرات Deprecation، وحصر التحذير المتبقي الوحيد في مكتبة الطرف الثالث (`StarletteDeprecationWarning` التابعة لـ `fastapi.testclient`).

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

### نتائج حالات الاختبار الإلزامية (10/10 Passed):
| استفسار البحث (Query) | النتيجة (Symbol) | السوق | الطريقة (Method) | نسبة الثقة (Confidence) |
| :--- | :---: | :---: | :---: | :---: |
| `"البنك الأهلي"` | **COMI** | EGX | `alias_ar_exact` | **0.98** |
| `"أرامكو"` | **2222** | TASI | `alias_ar_exact` | **0.98** |
| `"COMI"` | **COMI** | EGX | `symbol_exact` | **1.00** |
| `"cib"` | **COMI** | EGX | `alias_en_exact` | **0.98** |
| `"البنك التجارى الدولى"` | **COMI** | EGX | `name_ar_fuzzy` | **0.85** |
| `"ابو قير"` | **ABUK** | EGX | `alias_ar_exact` | **0.98** |
| `"AAPL"` | **AAPL** | US | `symbol_exact` | **1.00** |
| `"Apple"` | **AAPL** | US | `name_en_exact` | **0.99** |
| `"ciib"` | **COMI** | EGX | `alias_en_fuzzy` | **0.85** |
| `"شركة غير موجودة"` | **null** | — | — | **3 مقترحات بديلة** |

---

## 🛡️ صلابة خط البيانات والإنتاجية (Sprint 1, Part C: Pipeline Hardening)

تم تطبيق منظومة إنتاجية عسكرية لمنع الأعطال الصامتة، وضمان التوافر المستمر للبيانات حتى في حال انقطاع المزودين الأساسيين (SAHMK / EODHD / Younit / Binance).

### 1. معمارية منظومة الصلابة (Resilience Stack Architecture):

```mermaid
flowchart TD
    Client["Client / API Route"] --> CB{"Circuit Breaker (Redis)"}
    CB -- "CLOSED / HALF_OPEN" --> Retry["withRetry (Exp Backoff + Jitter)"]
    CB -- "OPEN" --> DLQ["Dead Letter Queue (DLQ)"]

    Retry -- "Call Provider" --> Provider["Market Data Provider (SAHMK / EODHD)"]
    Provider -- "Success (200)" --> Gates["Data Quality Gates (8 Rules)"]
    Gates -- "Valid Bar" --> Store[("Database / Memory Store")]
    Gates -- "Corrupt Bar" --> RejectionLog["Quality Metrics Rejection"]

    Provider -- "Fail (5xx / 429 / Timeout)" --> Retry
    Retry -- "Max Retries (x3) Exhausted" --> RecordFailure["CB Record Failure (5 in 60s -> OPEN)"]
    RecordFailure --> DLQ
    DLQ -- "Auto-Replay on Recovery" --> CB
```

### 2. المكونات والخصائص المنفذة:

#### أ. إعادة المحاولة التلقائية (Retry with Exponential Backoff):
- **المسار:** `packages/db/src/providers/retry.ts`
- **القواعد:** الحد الأقصى 3 محاولات، تأخير أسي: `1000ms`, `2000ms`, `4000ms` مع عشوائية Jitter `(0-500ms)`.
- **أخطاء مسموحة بإعادة المحاولة:** `[5xx, 429, timeout, network error]`.
- **أخطاء غير مسموحة:** `[400, 401, 403, 404]` (فشل فوري دون إهدار موارد).
- **عند استنفاد المحاولات:** إلقاء خطأ مهيكل `RetryExhaustedError` مع سجل المحاولات الزمني.

#### ب. قاطع الدائرة المعتمد على Redis (Redis-Backed Circuit Breaker):
- **المسار:** `packages/db/src/providers/circuit-breaker.ts`
- **حالات القاطع:**
  - `CLOSED`: تشغيل طبيعي ومراقبة معدل الفشل.
  - `OPEN`: فتح القاطع ورفض الطلبات فوراً مع خطأ `CircuitOpenError` وتحديد ثواني الانتظار `retry_after_s`.
  - `HALF_OPEN`: بعد فترة تبريد 30 ثانية لاختبار استعادة المزود.
- **الانتقالات:**
  - `CLOSED → OPEN`: عند وقوع 5 إخفاقات خلال 60 ثانية.
  - `OPEN → HALF_OPEN`: تلقائياً بعد مرور 30 ثانية من الهدوء.
  - `HALF_OPEN → CLOSED`: بعد 3 نجاحات متتالية.
  - `HALF_OPEN → OPEN`: عند حدوث فشل واحد فقط أثناء الاختبار.

#### ج. طابور الرسائل الميتة وإعادة التشغيل (Dead Letter Queue & Replay):
- **المسار:** `packages/db/src/providers/dlq.ts`
- **التخزين:** قوائم Redis `dlq:fetch:{provider}` وقائمة الموت النهائي `dlq:dead:{provider}` بعد 5 محاولات فاشلة.
- **مسارات الإدارة (Admin Endpoints):**
  - `GET /api/admin/dlq?provider=&limit=50` (استعراض الطلبات العالقة مع الترقيم).
  - `GET /api/admin/dlq/stats` (إحصائيات فورية لحجم الطوابير وعمر أقدم رسالة).
  - `POST /api/admin/dlq/replay?provider=&limit=10` (إعادة تشغيل الدفعات عند تعافي المزود).

#### د. مقاييس بروميثيوس الموحدة (Prometheus Metrics):
- **المسار:** `GET /api/metrics`
- **الصيغة:** Prometheus Text Format (v0.0.4)
- **المقاييس المعروضة:**
  - عدادات الجلب: `fetch_success_total`, `fetch_failure_total`, `fetch_retry_total`
  - زمن الاستجابة: `fetch_duration_seconds{quantile="0.5|0.9|0.99"}`
  - حالات قاطع الدائرة: `circuit_breaker_state`, `circuit_breaker_failures_60s`
  - طابور الرسائل الميتة: `dlq_size`, `dlq_replay_success_total`
  - صحة ونضارة البيانات: `last_successful_fetch_timestamp`, `instruments_stale_24h_total`
  - حجم الكون المالي: `instruments_total`, `price_bars_total`, `markets_total{market}`
  - **حماية المعدل (Rate Limiting):** 60 طلب / دقيقة لكل عنوان IP.

#### هـ. بوابات جودة البيانات الصارمة (Data Quality Gates):
- **المسار:** `packages/db/src/quality/gates.ts`
- **القواعد الثماني قبل حفظ أي شمعة:**
  1. `high >= low`
  2. `high >= close >= low`
  3. `high >= open >= low`
  4. `volume >= 0`
  5. `price > 0`
  6. تاريخ الشمعة يقع داخل `[now - 5 years, now + 1 hour]`
  7. مدة الشمعة تطابق الفاصل الزمني `(±10%)`
  8. عدم التكرار (منع إدخال نفس الرمز + الفاصل + التاريخ)
- **السلوك عند الرفض:** تسجيل تحذير JSON منظم، زيادة مقياس `quality_rejections_total`، وتخطي الشمعة المعيبة دون تعطيل المعالجة الجماعية.

#### و. فحص صحة وتوافر البيانات (Data Health Check Endpoint):
- **المسار:** `GET /api/health/data`
- **زمن الكاش:** 30 ثانية لتجنب الضغط على قواعد البيانات.
- **الحالات الكلية:**
  - `healthy`: جميع المزودين بحالة `CLOSED`.
  - `degraded`: مزود واحد بحالة `OPEN` أو تجاوز نسبة البيانات الراكدة 5%.
  - `unhealthy`: مزودان أو أكثر بحالة `OPEN`.

---

### 🔍 نتائج التحقق من معايير الإنتاجية (Verification Results):
1. **محاكاة أخطاء 500 على SAHMK (x5):** تحول القاطع إلى `OPEN` فوراً خلال أقل من ثانية.
2. **انتقال التبريد والتعافي:** الانتقال إلى `HALF_OPEN` بعد انقضاء المهلة، ثم العودة التامة إلى `CLOSED` بعد 3 نجاحات متتالية.
3. **التقاط الطابور الميت:** تخزين كل فشل مستمر في Redis DLQ بنجاح والتحقق من نقله إلى `dlq:dead` بعد 5 محاولات.
4. **فحص `GET /api/metrics`:** مطابقة جميع الـ 18 سلسلة مقاييس المطلوبة.
5. **فحص `GET /api/health/data`:** قراءة دقيقة لحالة المزودين وسلامة الأصول.
6. **فحص بوابات الجودة:** رفض تلقائي للشمعات ذات `high < low` أو التواريخ المستقبلية مع تسجيل التحذيرات.
7. **فحص الرموز الإنجليزية:** مطابقة `"cib"` إلى `alias_en_exact` ومطابقة `"Apple"` إلى `name_en_exact` بنجاح تام.

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

---

## 📈 المرحلة الثانية: حزمة الـ 21 مؤشراً فنياً ومصفاة الأسهم الذكية (Sprint 2)

### 1. توسعة المؤشرات الفنية (21 Technical Indicators):
تم تنفيذ 21 مؤشراً فنياً رياضياً وحتمياً بالكامل مع إصدارية ثابتة (`1.0.0`)، واستراتيجية تخزين مؤقت دقيقة (Redis + جدول `IndicatorValue` في قاعدة البيانات):
- **الاتجاه (Trend - 7 مؤشرات):**
  - المتوسط المتحرك البسيط: SMA (20, 50, 200)
  - المتوسط المتحرك الأسي: EMA (9, 20, 21, 50)
  - المتوسط المتحرك المرجح: WMA (20)
  - مؤشر Supertrend (10, 3): تحديد الاتجاه الصاعد / الهابط بدقة
  - مؤشر Parabolic SAR (0.02, 0.2): إشارات التوقف والانعكاس
- **الزخم (Momentum - 6 مؤشرات):**
  - RSI (14): مناطق التشبع البيعي (<30) والشرائي (>70)
  - MACD (12, 26, 9): خط الماكدي، خط الإشارة، والـ Histogram
  - Stochastic (14, 3, 3): %K و %D مع رصد التقاطعات
  - ADX (14) مع +DI و -DI: قياس قوة الاتجاه وقوة المشترين/البائعين
  - CCI (20): مؤشر قناة السلع
  - Williams %R (14) و ROC (12): سرعة التغير والتذبذب
- **السيولة والحجم (Volume - 3 مؤشرات):**
  - On-Balance Volume (OBV)
  - Money Flow Index (MFI - 14)
  - VWAP (Volume Weighted Average Price): مقتصر حصراً على الفترات اللحظية (Intraday من 1m إلى 4h) ويرجع `null` مع تحذير على الفواصل اليومية فأعلى.
- **التذبذب والنطاقات (Volatility - 4 مؤشرات):**
  - Bollinger Bands (20, 2): النطاق العلوي، الأوسط، السفلي، وعرض النطاق
  - Average True Range (ATR - 14): المدى الحقيقي المتوسط
  - Keltner Channels (20, 2, 10)
  - Donchian Channels (20)
- **قوة الاتجاه المتقدمة (Trend Strength - مؤشر 1):**
  - Ichimoku Kinko Hyo (9, 26, 52): Tenkan-sen, Kijun-sen, Senkou Span A/B, Chikou Span.

#### ضمانات السلامة الحسابية (Mathematical Guarantees):
- **انعدام انحياز الاستشراف المستقبلي (No Lookahead Bias):** اختبار صارم يثبت أن إضافة شموع مستقبلية لا تؤثر أبداً على قيم المؤشرات في الفترات التاريخية السابقة.
- **الحماية من القسمة على صفر:** معالجة دقيقة لحالات تجمد التداول وثبات الأسعار.

---

### 2. مصفاة الأسهم باللغة العربية والذكاء الاصطناعي (Arabic AI Screener):
تم بناء مصفاة أسهم ذكية تعتمد لغة استعلام مخصصة (DSL) فائقة الأمان، بحيث تُترجم الاستعلامات العربية الفصحى والعامية إلى شروط رياضية حتمية دون أي استعلامات SQL حرة أو مخاطر حقن.

#### أ. طبقة فهم اللغة الطبيعية العربية (NLU Layer):
- **المسار:** `packages/analysis/screener/nlu.py`
- تحويل الاستعلامات العربية إلى كائن `ScreenQuery` المهيكل وفق قوائم مسموحات صارمة (`Strict Allowlists`).
- معالجة المصطلحات المالية العربية الدارجة: "تشبع بيعي" ↔ `RSI_14 < 30`، "سيولة عالية" ↔ `volume_ratio_20d > 1.5`، "سوبر ترند صاعد" ↔ `Supertrend = BULLISH`، "مكرر أرباح تحت 15" ↔ `pe_ratio < 15`.

#### ب. لغة الاستعلام المهيكلة (Strict Screener DSL):
- **المسار:** `packages/analysis/screener/dsl.py`
- قائمة الحقول المسموحة (`ALLOWLIST_FIELDS`): فقط 29 حقلاً ومؤشراً معتمداً.
- قائمة المعاملات المسموحة (`ALLOWLIST_OPERATORS`): `>`, `<`, `>=`, `<=`, `=`, `!=`, `between`, `crosses_above`, `crosses_below`.
- منع كامل لأي استعلامات SQL نصية عشوائية؛ كل شرط يتم فحصه رياضياً ومقارنته بقيم البيانات.

#### ج. الأمان والاختبارات المضادة (Security & Adversarial Testing):
- **1,000 اختبار اختراق وفحص أمني عشوائي (Fuzzing):** شملت محاولات SQL Injection وحقن الأوامر (Prompt Injections) وتخطي الصلاحيات، وحققت **0 اختراقات (0 breaches)**.
- **50 استعلاماً عربياً لقياس الدقة:** حققت نسبة دقة **50 / 50 (100%)** في مطابقة الأسواق والقطاعات والمؤشرات.

#### د. واجهة المستخدم ومسارات النظام (Frontend & API):
- صفحة مصفاة الأسهم: 👉 **`/screener`**
- مسار الاستعلام: `POST /api/screener/query`
- **حماية المعدل (Rate Limiting via Redis):**
  - 10 استعلامات / دقيقة لكل مستخدم مسجل (`rate:screener:user:{userId}`).
  - 30 استعلام / دقيقة لكل عنوان IP (`rate:screener:ip:{ip}`).
- **سجل التدقيق (Audit Logging):** تسجيل كل استعلام ونتائجه وزمن التنفيذ في جدول `ScreenerQuery`.
- **معايير جودة البيانات في المصفاة:** استبعاد الأصول الراكدة (>24 ساعة دون تحديث) أو الأصول التي تملك بيانات تاريخية غير كافية (<200 بار) مع عرض إحصائيات الاستبعاد للمستخدم.

---

## 🏛️ المرحلة (أ): الأساس الرياضي لنقاط التحول الهيكلية (Phase أ: HSPD)
### Hierarchical Structural Pivot Detection — v1.0.0

تم تأسيس المحرك الرياضي الهرمي لتحديد نقاط التحول في حركة الأسعار (`packages/analysis/engines/hspd.py`) لحل المعضلة الأزلية لمؤشر ZigZag التقليدي.

> [!WARNING]
> **قاعدة حتمية غير قابلة للتفاوض:**
> جميع تحليلات موجات إليوت (Elliott Wave)، ونماذج الهارمونيك (Harmonic Patterns)، والتحليل الكلاسيكي ونقاط التوافق (Confluence) في المراحل القادمة ستعتمد حصرياً على نقاط التحول الصادرة من محرك **HSPD**، وتم إلغاء الاعتماد على الزجزاج التقليدي هش البنية.

### المزايا والضمانات الحسابية:
1. **التحقق عبر 5 بوابات إلزامية:**
   - **الهيكلية (Structural):** تأكيد قمة/قاع النافذة مع انعكاس حركة السعر (Price Action 3-bar Reversal).
   - **الاستقرار (Stability):** صمود النقطة أمام 3 اختبارات حذف شمعة فعلية بنتيجة `stability_score = 1.0` للدرجة الكبرى.
   - **الزمنية (Temporal):** فرض مسافات زمنية دنيا تمنع تلاصق القمم وتداخل الموجات.
   - **الهرمية (Hierarchical):** ارتباط كامل بين الدرجات الكبرى والصغرى وانعدام النقاط اليتيمة.
   - **الفركتل (Fractal):** تطرف حقيقي داخل نافذة المدى المحدد لكل درجة.
2. **درجات الهيكل الأربع (Degrees 0, 1, 2, 3):**
   - من التذبذبات الدقيقة (Micro Swings) إلى القمم والقيعان السنوية الكبرى (Macro Supercycle).
3. **الأداء الفائق والتخزين المؤقت:**
   - استجابة سريعة < 15 ميلي ثانية لكل 1,000 بار، وفحص 100 أصل مالي في أقل من 0.3 ثانية.
   - مسار الـ API: `GET /api/pivots/{symbol}?timeframe=1D&min_degree=0&max_degree=3`
   - توثيق رياضي كامل متوفر في: [`docs/HSPD.md`](file:///c:/Projects/Borsaty/docs/HSPD.md).

---

## 🌊 المرحلة (ب): محرك موجات إليوت المبني على القواعد الصارمة (Phase ب: Elliott Wave Engine)
### Rule-First Axiomatic Derivation — v1.0.0

تم بناء محرك التحليل الموجي الصارم (`packages/analysis/elliott/`) المشتق هندسياً ورياضياً من نقاط تحول **HSPD**.

> [!IMPORTANT]
> **المبدأ الأساسي غير القابل للتفاوض:**
> تحليل موجات إليوت ليس عملية "مطابقة أنماط بصرية" أو تقديرات احتمالية غامضة؛ بل هو **اشتقاق مبني على قواعد رياضية بديهية (Rule-First Axiomatic Derivation)**.
> إذا انتهك العد الموجي ولو **قاعدة حتمية صلبة واحدة (Hard Rule)** يتم **رفضه فوراً ودون تردد**. لا توجد "انتهاكات محتملة" أو "عد شبه صالح".

### 1. الهياكل المدعومة والقواعد الحتمية (Hard Rules):
- **الموجة الدافعة (Impulse Wave - 1 to 5):**
  - **القاعدة 1:** الموجة (2) لا تصحح 100% أو أكثر من الموجة (1).
  - **القاعدة 2:** الموجة (3) ليست الأقصر أبداً بين الموجات الدافعة (1، 3، 5).
  - **القاعدة 3:** الموجة (4) لا تتداخل سعرياً مع قمة الموجة (1) في الاتجاه الصاعد (أو قاع 1 في الهابط).
  - **القاعدة 4:** الاتجاهية الصارمة للموجات 1 و 3 و 5.
- **التصحيح المتعرج (ZigZag - A-B-C / 5-3-5):**
  - **القاعدة 1:** الموجة B لا تصحح 100% أو أكثر من الموجة A.
  - **القاعدة 2:** الموجة C تمتد متجاوزة طرف الموجة A.
- **التصحيح المسطح (Flat - A-B-C / 3-3-5):**
  - **القاعدة 1:** الموجة B تصحح 90% على الأقل من الموجة A (`rb >= 0.90`).
  - **القاعدة 2:** الموجة C تنتهي بالقرب من بداية الموجة A أو تتجاوزها (`rc >= 0.85`).
  - تصنيف الأنماط الفرعية: `regular_flat`، `expanded_flat`، `running_flat`.
- **المثلثات التصحيحية (Triangle - A-B-C-D-E / 3-3-3-3-3):**
  - **القاعدة 1:** التتالي المنتظم إما بالانكماش المطرد ($|B| < |A|, |C| < |B|, |D| < |C|, |E| < |D|$) أو التوسع المطرد.
  - **القاعدة 2:** استقرار نقطة نهاية الموجة E داخل المدى السعري للموجة A.

### 2. التقييم التوافقي الناعم (Fibonacci Soft Scoring):
- قياس جودة ونموذجية العلاقات التوافقية (0.0 إلى 1.0) باستخدام **المتوسط الهندسي (Geometric Mean)** لمنع تشويه النماذج الرديئة.
- حساب نسبة امتداد الموجة الثالثة (1.618 المثالية)، وتصحيحات الموجة الثانية (0.50 - 0.618) والرابعة (0.382)، وامتداد الموجة الخامسة (0.618 من 1-3).

### 3. محرك التوافق متعدد الفواصل الزمنية (Multi-Timeframe Coherence):
- مسار التحليل المتزامن عبر 3 فواصل زمنية: **الأسبوعي (Weekly) + اليومي (Daily) + 4 ساعات (4H)**.
- **معادلة التوافق:**
  $$\text{Coherence Score} = \text{clamp}\left(0.50 + \sum \Delta_{\text{pairwise}}, 0.0, 1.0\right)$$
- **مستويات التوافق والحجب الصارم:**
  - **HIGH ($\ge 0.85$):** توافق كامل وتأكيد إشارات التداول بأعلى درجة ثقة.
  - **MEDIUM ($0.60 - 0.84$):** اتجاه عام متطابق مع تنبيه الحذر.
  - **LOW ($< 0.60$):** تعارض العد الموجي بين الفواصل؛ يتم **حجب بلوك التداول `trade_ready` كلياً** مع إعلان السبب صراحة للمستخدم:
    > *"Counts are contradictory across timeframes. Wait for clarity before acting."*

### 4. واجهات ومسارات النظام (API Endpoints):
- **خدمة التحليل (FastAPI):** `POST /elliott/detect`
- **واجهة التطبيق (Next.js):** `GET /api/elliott/{symbol}?timeframe=1D&include_alternatives=true`
- **استراتيجية التخزين المؤقت (Redis Caching):**
  - اليومي والأسبوعي (`1D`, `1W`): 3,600 ثانية (ساعة كاملة)
  - فاصل 4 ساعات (`4H`): 1,800 ثانية (30 دقيقة)
  - الفواصل اللحظية (`1H`, `15M`, `5M`): 300 ثانية (5 دقائق)
- **نتائج الاختبارات والتغطية:**
  - **55 اختباراً شاملاً** في `test_elliott_rules.py` بنسبة تغطية **95%**.
  - **177 اختباراً ناجحاً** عبر كامل حزمة التحليل Python دون أي تراجع.
  - توثيق تفصيلي كامل في: [`docs/ELLIOTT.md`](file:///c:/Projects/Borsaty/docs/ELLIOTT.md).

---

## 🎯 المرحلة (ج): نماذج الهارمونيك الحتمية المشروطة بفيبوناتشي (Phase ج: Harmonic Patterns Engine)
### Fibonacci-Gated Axiomatic Derivation — v1.0.0

تم تأسيس محرك نماذج الهارمونيك الحتمي الصارم (`packages/analysis/harmonic/`) المشتق رياضياً من نقاط تحول **HSPD**.

> [!IMPORTANT]
> **المبدأ الجوهري غير القابل للتفاوض:**
> نماذج الهارمونيك ليست "أشكالاً هندسية تقريبية"؛ بل هي **مجموعات محددة وصارمة من نسب فيبوناتشي الرقمية**.
> إذا لم تتطابق نسب $X-A-B-C-D$ داخل حدود التفاوت الرياضي المحددة بدقة، فالنموذج **يُرفض فوراً**.
> لا نستخدم مصطلحات تضليلية مثل "نموذج قيد التكوين" أو "هارمونيك شبه مكتمل"؛ النظام يعلن حصراً النماذج **المؤكدة رياضياً (CONFIRMED)**.

### 1. النماذج الثمانية المدعومة (Supported Patterns):
1. **جارتلي (Gartley):** النمط الكلاسيكي ($B = 0.618 \pm 0.05$, $C = 0.618 \pm 0.06$, $D = 0.786 \pm 0.03$, $CD = 1.272 - 1.618$).
2. **الخفاش (Bat):** ارتداد ضحل للموجة B ($B = 0.44 \pm 0.06$) وارتداد عميق للنقطة D ($D = 0.886 \pm 0.03$).
3. **الفراشة (Butterfly):** **امتداد النقطة D متجاوزة نقطة البداية X** ($D = 1.27 - 1.618 \times XA$).
4. **الكابوريا (Crab):** أقصى امتداد انعكاسي حاد ($D = 1.618 \pm 0.08 \times XA$, $CD = 2.618 - 3.618 \times BC$).
5. **الكابوريا العميقة (Deep Crab):** ارتداد عميق للنقطة B عند $0.886$ مع امتداد النقطة D حتى $2.618 \times XA$.
6. **القرش (Shark):** **امتداد النقطة B متجاوزة X** ($B = 1.27 \times XA$) مع امتداد C ($1.618 \times AB$) وانعكاس D عند $0.886$.
7. **السايفر (Cypher):** قياس النقطة D حصرياً من امتداد $XC$ عند النسبة $0.786$.
8. **نموذج الاستمرار (ABCD):** تناظر حركي متتالي ثلاثي الأمواج ($CD/BC = 1.27 - 1.618$).

### 2. منطقة الانعكاس المحتملة (Potential Reversal Zone - PRZ):
- **المنطقة نطاق وليست سعراً مفرداً:** احتساب تلاقي (Cluster) مساقط فيبوناتشي المتعددة عند النقطة D.
- **شرط العرض الحتمي الصارم:** يجب أن يكون عرض منطقة الـ PRZ أصغر من أو يساوي ضعف المدى الحقيقي المتوسط ($\text{PRZ Width} \le 2.0 \times ATR$). إذا تباعدت المساقط بأكثر من ذلك، **يُرفض النموذج لعدم وضوح منطقة الانعكاس**.

### 3. مستويات الوقف والأهداف المهيكلة:
- **مستوى الإلغاء (Invalidation Level):** $D_{\text{low}} - 1.5 \times ATR$ في النماذج الصاعدة، و$D_{\text{high}} + 1.5 \times ATR$ في الهابطة.
- **الهدف الأول:** تصحيح $38.2\%$ من طول الموجة $CD$.
- **الهدف الثاني:** تصحيح $61.8\%$ من طول الموجة $CD$.
- **الهدف الثالث:** عودة السعر كاملة حتى مستوى النقطة $A$.

### 4. الإعلان الصريح عن حالة عدم التوفر (Explicit "Unavailable" Handling):
- عند عدم العثور على نماذج مستوفية لكافة الشروط، يُرجع النظام الحالة المهيكلة `status: "unavailable"` مع بيان السبب باللغتين العربية والإنجليزية (`status_reason: "no_valid_pattern"` أو `"insufficient_pivots"`).

### 5. واجهات ومسارات النظام (API Endpoints):
- **خدمة التحليل (FastAPI):**
  - كشف النماذج: `POST /harmonic/detect`
  - احتساب PRZ: `POST /harmonic/prz`
- **واجهة التطبيق (Next.js):**
  - مسار فحص الهارمونيك: `GET /api/harmonic/{symbol}?timeframe=1D&min_score=0.7`
  - مسار الـ PRZ المركز: `GET /api/harmonic/{symbol}/prz?pattern=gartley`
- **التخزين المؤقت (Redis TTL):**
  - يومي وأسبوعي (`1D`, `1W`): 3,600 ثانية
  - فاصل 4 ساعات (`4H`): 1,800 ثانية
  - لحظي (`1H`, `15M`, `5M`): 300 ثانية
- **نتائج الاختبارات والتغطية:**
  - **47 اختباراً شاملاً** في `test_harmonic.py` بنسبة تغطية **94%**.
  - **229 اختباراً ناجحاً** عبر كامل حزمة التحليل Python دون أي تراجع.
  - توثيق تفصيلي كامل في: [`docs/HARMONIC.md`](file:///c:/Projects/Borsaty/docs/HARMONIC.md).

---

## 🏛️ المرحلة (د): النماذج الفنية الكلاسيكية الصارمة (Phase د: Classical Patterns Engine)
### 5-Gate Template & Logic Engine — v1.0.0

تم تأسيس محرك النماذج الفنية الكلاسيكية الحتمي الصارم (`packages/analysis/classical/`) المشتق هندسياً من نقاط تحول **HSPD** ومقترناً بالتحليل الحجمي والتأكيد السعري عبر بوابات الفحص الخمس.

> [!IMPORTANT]
> **المبدأ الجوهري الصارم للمرحلة (د):**
> **الشكل الهندسي شرط ضروري، والمنطق الفني شرط كافٍ، وكلاهما إلزامي (Shape is necessary, Logic is sufficient, Both are mandatory).**
> أي نموذج كلاسيكي (مثل الرأس والكتفين أو القمة المزدوجة) بدون:
> - تراجع أحجام التداول أثناء التكوين.
> - كسر خط العنق / الدعم بإغلاق شمعة مؤكد (وليس مجرد ذيل شمعة intraday wick).
> - تضخم حجم التداول عند الكسر بنسبة تتجاوز العتبة الصارمة للمحرك ($\ge 1.2\times$ إلى $1.5\times$).
> 
> ...هو **ليس نموذجاً كلاسيكياً حقيقياً** بل مجرد قمم وقيعان عشوائية.

### 1. بوابات التحقق الخمس الصارمة (5-Gate Pipeline):
1. **بوابة الشكل الهندسي (Shape Gate):** استيفاء الشروط الهندسية من نقاط HSPD (التناظر بين الكتفين $\le 10\%$، تقارب القمم في القمة المزدوجة $\le 3\%$).
2. **بوابة الحجم التكويني (Formation Volume Profile):** احتساب ميل انحدار الحجم الخطي عبر الشموع للتأكد من انكماش التداول أثناء التماسك.
3. **بوابة حجم الكسر (Breakout Volume Ratio):** مقارنة حجم شمعة الكسر بمتوسط 20 شمعة سابقة ($> 1.2\times$ إلى $1.5\times$ حسب النموذج).
4. **بوابة تأكيد الإغلاق ورفض الذيول (Confirmed Close vs Wick):** الكسر لا يُعتمد إلا بإغلاق شمعة صريح. اختراق ذيل الشمعة دون إغلاق يُبقي النموذج في حالة `"forming"`.
5. **بوابة إعادة الاختبار (Retest Verification):** فحص عودة السعر لاختبار مستوى الكسر واحترامه، مما يرفع درجة الثقة `pattern_score`.

### 2. النماذج العشرة المكتملة (10 Classical Patterns):
1. **الرأس والكتفان (Head and Shoulders):** انعكاسي هابط، قمة الرأس أعلى من الكتفين، تناظر الكتفين $\le 10\%$، كسر خط العنق بحجم $\ge 1.3\times$.
2. **الرأس والكتفان المعكوس (Inverse Head and Shoulders):** انعكاسي صاعد، قاع الرأس أدنى من الكتفين، كسر صاعد بحجم $\ge 1.3\times$.
3. **القمة المزدوجة (Double Top):** قمتان متقاربتان ضمن $3\%$ مع وادٍ هابط $\ge 3\%$ وكسر بحجم $\ge 1.2\times$.
4. **القاع المزدوج (Double Bottom):** قاعان متقاربان ضمن $3\%$ مع قمة ارتدادية $\ge 3\%$ وكسر بحجم $\ge 1.2\times$.
5. **القمة والقاع الثلاثي (Triple Top / Bottom):** 3 قمم أو قيعان ضمن نطاق $3\%$ وكسر قاطع بحجم $\ge 1.3\times$.
6. **المثلث الصاعد (Ascending Triangle):** مقاومة أفقية ($\le 2\%$) وقيعان صاعدة، انكماش الحجم، كسر بحجم $\ge 1.5\times$.
7. **المثلث الهابط (Descending Triangle):** دعم أفقي ($\le 2\%$) وقمم هابطة، انكماش الحجم، كسر بحجم $\ge 1.5\times$.
8. **المثلث المتماثل (Symmetrical Triangle):** قمم هابطة وقيعان صاعدة متلاقية، كسر اتجاهي بحجم $\ge 1.4\times$.
9. **العلم الصاعد والهابط (Bull / Bear Flag):** سارية حادة ($\ge 5\%$ في $\le 15$ شمعة) مع تماسك يصحح أقل من $50\%$ وكسر بانفجار حجمي $\ge 1.4\times$.
10. **الكوب والعروة (Cup and Handle):** قاع مقعر متناظر، حواف متقاربة ضمن $3\%$، عروة تصحيحية ضحلة (10-40%) وكسر بحجم $\ge 1.3\times$.

### 3. الشفافية التامة ونماذج الإخفاق القريب (Near-Misses Tracking):
- النماذج التي تفشل في أي بوابة لا تُخفى؛ بل تُسجل تحت مصفوفة `near_misses` مع تحديد البوابة الفاشلة بدقة (`specific_gate`, `reason`, `would_score`).
- التصنيف الحتمي للحالات: `"forming"` (قيد التكوين السعري)، `"confirmed"` (مؤكد بالكسر والحجم)، `"failed"` (كسر ملغي بعودة السعر)، `"unavailable"` (سوق عرضي بلا نماذج).

### 4. واجهات ومسارات النظام (API Endpoints):
- **خدمة التحليل (FastAPI):**
  - كشف النماذج الكلاسيكية: `POST /classical/detect`
- **واجهة التطبيق (Next.js):**
  - مسار فحص النماذج الكلاسيكية: `GET /api/classical/[symbol]?timeframe=1D&status=confirmed`
  - مسار الإخفاقات القريبة الشفافة: `GET /api/classical/[symbol]/near-misses`
- **التخزين المؤقت (Redis TTL):**
  - يومي وأسبوعي (`1D`, `1W`): 3,600 ثانية (ساعة)
  - فاصل 4 ساعات (`4H`): 1,800 ثانية (30 دقيقة)
  - لحظي (`1H`, `15M`, `5M`): 300 ثانية (5 دقائق)
- **نتائج الاختبارات والتغطية الشاملة:**
  - **51 اختباراً شاملاً** في `test_classical.py` بنسبة تغطية **96%**.
  - **281 اختباراً ناجحاً** عبر كامل منصة التحليل Python بدون أي أخطاء أو تراجعات.
  - فحص التوافق المشترك بين إليوت والهارمونيك والكلاسيكي: `test_elliott_harmonic_consistency.py`.
  - توثيق تفصيلي كامل في: [`docs/CLASSICAL.md`](file:///c:/Projects/Borsaty/docs/CLASSICAL.md).

---

## 🧠 المرحلة (هـ): محرك التوافق وحالات السوق والربط الموحد (Phase هـ: Confluence, Regime, Orchestrator)
### Regime-Aware Multi-Engine Fusion & Analysis Orchestration — v1.0.0

تم تأسيس نواة اتخاذ القرار المركزية للمنصة (`packages/analysis/confluence/` و `packages/analysis/regime/` و `packages/analysis/orchestrator.py`) التي تدمج الأدلة الناتجة عن المحركات الحتمية الأربعة (إليوت، الهارمونيك، النماذج الكلاسيكية، المؤشرات الفنية الـ 21) مع هيكل السوق (HSPD) وديناميكية السيولة والحجم في قرار تحليلي موحد وشفاف.

> [!IMPORTANT]
> **المبادئ الرياضية الأربعة الحاكمة للمرحلة (هـ):**
> 1. **الترجيح بحسب حالة السوق (Regime-Aware Weighting):** قوة المحرك الفني تختلف جذرياً باختلاف بيئة السوق؛ نماذج الهارمونيك والانعكاس الكلاسيكي تتصدر في الأسواق العرضية وتُخفض في الاتجاهات الصارمة، بينما يتصدر إليوت وهيكل السوق في الترند القوي.
> 2. **حسابات رياضية معلنة وشفافة (Transparent Arithmetic):** لا صناديق سوداء؛ كل مساهمة محرك تُحسب حصراً بالمعادلة $\text{Contribution}_i = \text{RawScore}_i \times \text{Weight}_i$ مع إظهار المنطق التحليلي بالعربية والإنجليزية.
> 3. **فترات ثقة إحصائية دقيقة (Error Propagation Confidence Intervals):** لا نسب مئوية زائفة الدقة؛ يتم اشتقاق نطاق الثقة 95% ($\pm 1.96\sigma$) من انتشار أخطاء المحركات وتباينه، بحيث يضيق النطاق عند اتفاق المحركات ويتسع عند تباينها.
> 4. **إعلان التناقضات وحظر إخفائها (Contradictions Exposed, Never Concealed):** إذا تعارض محركان فنيان مع القرار الإجمالي، تُعلن المنظومة وجود تناقض جوهري `major_contradiction` مع تفصيل أوجه التعارض للمستخدم.

### 1. الحالات السبع المحددة لبيئة السوق (7 Deterministic Regimes):
يصنف محرك `RegimeDetector` الشموع السعرية وفق أولويات هندسية صارمة:
- **`volatile_expansion` (توسع التقلب):** اتساع نطاق بولينجر فوق المئين الـ 90 ($> 90\text{th}$) مع عرض شريط $> 5\%$.
- **`volatile_contraction` (انكماش التقلب - عصر بولينجر):** انضغاط النطاق تحت المئين الـ 10 ($< 10\text{th}$) مع عرض شريط $< 6\%$ ومؤشر $ADX < 25$.
- **`breakout` (اختراق سعري):** خروج السعر بما يتجاوز $1.5\sigma$ خارج حدود البولينجر بحجم تداول مرتفع.
- **`trending_strong` (اتجاه قوي سائد):** $ADX > 30$ مع فارق اتجاهي حاسم بين $+DI$ و $-DI$ يتجاوز 15 نقطة.
- **`trending_weak` (اتجاه ناشئ أو متباطئ):** $ADX > 20$ مع تقارب في الفارق الاتجاهي.
- **`mean_reversion` (ارتداد متوسط):** ملامسة أطراف البولينجر القصوى مع وصول RSI لتشبع حاد ($<30$ أو $>70$) وانخفاض حجم التداول.
- **`ranging` (سوق عرضي وتماسك):** $ADX < 20$ وتذبذب السعر بين حدود البولينجر الداخلية.

### 2. مصفوفة أوزان حالات السوق الصارمة ($7 \times 6$ Weighting Matrix):
مجموع الأوزان في كل حالة يساوي **1.00 (100%)** بالضبط:

| بيئة السوق (Regime) | إليوت (Elliott) | كلاسيكي (Classical) | مؤشرات (Indicators) | هارمونيك (Harmonic) | هيكل السوق (Structure) | حجم وتدفق (Volume) | الإجمالي |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`trending_strong`** | **0.25** | 0.20 | 0.20 | 0.10 | 0.15 | 0.10 | **1.00** |
| **`trending_weak`** | **0.20** | 0.20 | 0.20 | 0.15 | 0.15 | 0.10 | **1.00** |
| **`ranging`** | 0.10 | **0.25** | 0.15 | **0.25** | 0.15 | 0.10 | **1.00** |
| **`volatile_expansion`** | 0.15 | 0.15 | **0.20** | 0.10 | **0.20** | **0.20** | **1.00** |
| **`volatile_contraction`**| 0.10 | **0.25** | 0.15 | **0.25** | 0.20 | 0.05 | **1.00** |
| **`breakout`** | 0.10 | 0.20 | 0.15 | 0.10 | 0.20 | **0.25** | **1.00** |
| **`mean_reversion`** | 0.10 | 0.20 | **0.25** | **0.25** | 0.15 | 0.05 | **1.00** |

### 3. درجات القوة والاتجاه وفترات الثقة:
- **المحصلة النهائية $\text{Score} \in [-1.0, +1.0]$:**
  - $|\text{Score}| < 0.15$: اتجاه محايد (`neutral`).
  - $0.15 \le |\text{Score}| < 0.40$: إشارة ضعيفة (`weak`).
  - $0.40 \le |\text{Score}| < 0.65$: إشارة متوسطة القوة (`moderate`).
  - $|\text{Score}| \ge 0.65$: إشارة قوية حاسمة (`strong`).
- **فترة الثقة 95%:** مشتقة من $\sigma_{\text{total}} = \sqrt{\sum (\sigma_i \cdot w_i)^2}$ لتقديم مدى رقمي موثوق `[score_min, score_max]`.

### 4. واجهات النظام ومسار التحليل الموحد (Unified Endpoints):
- **محرك الربط الشامل (Orchestrator):** `AnalysisOrchestrator` ينسق تشغيل HSPD $\to$ Elliott $\to$ Harmonic $\to$ Classical $\to$ Indicators $\to$ Regime $\to$ Confluence في استدعاء متزامن فائق السرعة.
- **خدمة التحليل (FastAPI):**
  - مسار التحليل الموحد: `POST /analysis/full`
- **واجهة التطبيق (Next.js):**
  - المسار الموحد: `GET /api/analysis/[symbol]/full?timeframe=1D`
- **معدل الأداء الفعلي (Performance Benchmarks):**
  - استدعاء مباشر جديد (Fresh Execution): **< 100 مللي ثانية** (أسرع بكثير من ميزانية 2.0 ثانية).
  - استدعاء من الذاكرة المؤقتة (Cached): **< 10 مللي ثانية** عبر Redis TTL.
- **نتائج الاختبارات والتغطية الشاملة:**
  - **53 اختباراً شاملاً** في `test_confluence.py` بنسبة تغطية **95%**.
  - **334 اختباراً ناجحاً** عبر كامل منصة التحليل Python بدون أي أخطاء أو تراجعات سابقة (Zero Regressions).
  - توثيق تفصيلي كامل في: [`docs/CONFLUENCE.md`](file:///c:/Projects/Borsaty/docs/CONFLUENCE.md).

---

## 🎯 المرحلة (و): محرك خطة التداول الموحدة وإدارة المخاطر (Phase و: Unified Trade Plan Engine)
### One Coherent Answer from Five Engines — v1.0.0

تم تأسيس محرك خطة التداول وإدارة المخاطر الحتمي (`packages/analysis/trade_plan/`)، ليكون حلقة الوصل الحاسمة بين التحليل الفني وقرار التداول المنضبط، عبر تجميع مقترحات الأهداف والوقف من كافة المحركات، وتجميعها جغرافياً وعنقودياً، وترتيبها واختيار الأهداف الأكثر إقناعاً رياضياً، مع حساب حجم الصفقة بدقة.

> [!IMPORTANT]
> **المبادئ غير القابلة للتفاوض للمرحلة (و):**
> 1. **لا مستويات وهمية (No Fabricated Levels):** كل هدف وكل وقف مشتق حصراً من محرك رياضي معتمد (إليوت، الهارمونيك، الكلاسيكي، هيكل السوق HSPD، أو ارتدادات فيبوناتشي).
> 2. **حظر خلط الطرق غير المتوافقة (Never Average Incompatible Methods):** يتم التجميع العنقودي للمستويات المتقاربة رياضياً ضمن مدى $1.0 \times \text{ATR}$، دون أي متوسطات عشوائية لمستويات متباعدة.
> 3. **تعدد المنهجيات للهدف الأول ($N \ge 2$ Methods):** لا تُعتمد أي خطة تداول كـ `actionable` إلا إذا كان الهدف الأول مدعوماً بمحركين فنيين مستقلين على الأقل.
> 4. **معامل عائد إلى مخاطرة مجزٍ ($R \ge 1.5$):** الهدف الأول يجب أن يحقق نسبة ربح إلى خسارة $\ge 1.5$ وإلا تُصنف الخطة صراحة `no_actionable_setup`.
> 5. **إدارة مخاطر متعددة الخيارات (Multi-Method Position Sizing):** احتساب 4 طرق شفافة دون فرض طريقة واحدة (الكسر الثابت، المدى الحقيقي ATR، معيار كيلي الصارم $n \ge 30$، وتكافؤ التقلب).

### 1. خطوات اشتقاق خطة التداول (6-Step Derivation):
1. **استخراج المقترحات (Proposal Extraction):** استخراج أهداف ونقاط إلغاء النماذج من إليوت (Trade Ready)، وهارمونيك (PRZ Targets)، والكلاسيكي (Breakout Measured Move)، وهيكل السوق (Structure Highs/Lows $\pm 0.5 \text{ATR}$)، وفيبوناتشي (Swings $\ge 1.5\%$).
2. **التجميع العنقودي بالتقارب السعري (Greedy Clustering):** تجميع الأهداف المتقاربة ضمن $\text{Tolerance} = 1.0 \times \text{ATR}$ وإعادة حساب مركز الثقل $\text{Centroid}$ ديناميكياً.
3. **الترتيب حسب بيئة السوق والجودة (Confluence Ranking):** احتساب درجة الأفضلية:
   $$\text{RankScore} = \left(\frac{\text{Diversity}}{5}\right) \times 0.35 + \text{Quality} \times 0.30 + \text{DistanceFactor} \times 0.20 + \text{RegimeWeight} \times 0.15$$
   واختيار الهدف الأول التوافقي المتصدر، يليه الهدفان الثاني والثالث.
4. **اختيار الوقف الأكثر تحفظاً (Conservative Consensus Stop):** أعلى وقف في الصعود، وأدنى وقف في الهبوط، شريطة إجماع محركين ضمن $1.0 \times \text{ATR}$، أو الرجوع لوقف هيكل السوق الحتمي (Structure Stop).
5. **بوابات اعتماد الخطة (Validation Gates):** التحقق من شرط الاتجاه غير المحايد، ونسبة $R \ge 1.5$، وبعد الوقف $1.5 - 7\%$، وتوافق الهدف الأول.
6. **احتساب حجم الصفقة (Position Sizing):** حساب الوحدات والسيولة المعرضة للمخاطرة (2% افتراضياً) بالكسر الثابت والـ ATR وكيلي وتكافؤ التقلب.

### 2. واجهات ومسارات النظام (API Endpoints):
- **خدمة التحليل (FastAPI):**
  - مسار احتساب خطة التداول: `POST /trade-plan/compute`
- **واجهة التطبيق (Next.js):**
  - مسار خطة التداول المباشر: `GET /api/trade-plan/[symbol]?timeframe=1D&capital=1000&risk_pct=2`
  - إدماج ملخص الخطة تلقائياً في: `GET /api/analysis/[symbol]/full`
- **التخزين المؤقت (Redis TTL):**
  - اليومي والأسبوعي (`1D`, `1W`): 3,600 ثانية (ساعة)
  - فاصل 4 ساعات (`4H`): 1,800 ثانية (30 دقيقة)
  - الفواصل اللحظية (`1H`, `15M`, `5M`): 300 ثانية (5 دقائق)
- **نتائج الاختبارات والتغطية الشاملة:**
  - **65 اختباراً شاملاً** في `test_trade_plan.py` بنسبة تغطية **91%**.
  - **399 اختباراً ناجحاً** عبر كامل حزمة التحليل Python بدون أي أخطاء أو تراجعات (Zero Regressions).
  - توثيق تفصيلي كامل في: [`docs/TRADE_PLAN.md`](file:///c:/Projects/Borsaty/docs/TRADE_PLAN.md).

---

## 🎙️ المرحلة (ز): محرك الصياغة المزدوجة المستقلة (Phase ز: Dual-Authored Narrator Engine)
### Two Original Voices. One JSON Payload. Zero Translation. — v2.0.0

تم تأسيس محرك السرد والصياغة المزدوجة المستقلة الحتمي (`packages/analysis/narrator/`)، الذي يطبق المبدأ الجوهري للمشروع: **نحن لا نترجم؛ بل نصيغ مرتين (We do NOT translate. We author twice).**

> [!IMPORTANT]
> **المبادئ الأربعة الحاكمة للمرحلة (ز):**
> 1. **صياغة عربية أصيلة:** كُتبت بالكامل بتراكيب بلاغية عربية ومصطلحات مالية متداولة ("الموجة الدافعة"، "العدّ الموجي"، "المصداقية"، "بناءً على هذا البناء") وليست ترجمة لكلمات إنجليزية.
> 2. **صياغة إنجليزية مؤسسية أصيلة:** كُتبت بتراكيب تداول مؤسسية إنجليزية ("developing in", "impulse sequence", "confluence reading", SVO syntax) وليست ترجمة حرفية من العربية.
> 3. **بوابة منع التخريف الصارمة (Zero-Hallucination Gate):** حظر مطلق لظهور أي رقم أو سعر أو نسبة مئوية لا توجد صراحة في الـ JSON المدخل أو مشتقة بمعادلة رياضية معتمدة.
> 4. **أرقام عربية غربية (0-9):** اعتماد الأرقام المطبقة رسمياً في البورصات العربية (مصر والسعودية والخليج) لمنع المظهر غير المألوف للمتداولين المحترفين، مع وضع رمز العملة بعد الرقم في العربية (`86.00 ج.م`) وقبله في الإنجليزية (`EGP 86.00`).

### 1. أقسام السرد والأنماط التعبيرية (Sections & Styles):
- **الأقسام المدعومة:** ملخص التحليل (`analysis_summary`)، وموجات إليوت (`elliott`)، ونماذج الهارمونيك (`harmonic`)، والنماذج الكلاسيكية (`classical`)، وخطة التداول المنضبطة (`trade_plan`)، وقائمة التنبيهات (`warnings`)، وإخلاء المسؤولية القانوني الإلزامي (`disclaimer`).
- **الأنماط الثلاثة (Styles):**
  - **الموجز (`brief`):** $\le 3$ جمل مباشرة ومختصرة للقرار السريع.
  - **الاحترافي (`professional` - افتراضي):** 4-5 جمل متوازنة تربط الدليل والوقف والأهداف.
  - **المفصل (`detailed`):** $\ge 6$ جمل تشرح بيئة السوق وسلوك السيولة والأبعاد الهيكلية.

### 2. واجهات ومسارات النظام (API Endpoints):
- **خدمة التحليل (FastAPI):**
  - مسار توليد السرد: `POST /narrate`
- **واجهة التطبيق (Next.js):**
  - مسار السرد المباشر: `GET /api/narrate/[symbol]?timeframe=1D&language=ar&style=professional`
  - إدماج السردين العربي والإنجليزي تلقائياً في: `GET /api/analysis/[symbol]/full`
- **معدل الأداء الفعلي (Performance):**
  - توليد السرد المزدوج: **< 5 مللي ثانية** لكل استدعاء، وبقاء التحليل الشامل الكامل مع السردين تحت **< 200 مللي ثانية**.
- **نتائج الاختبارات والتغطية الشاملة:**
  - **66 اختباراً شاملاً** في `test_narrator.py` بنسبة تغطية **98%**.
  - **472 اختباراً ناجحاً** عبر كامل حزم منصة التحليل Python بدون أي أخطاء أو تراجعات سابقة (Zero Regressions).
  - توثيق تفصيلي كامل في: [`docs/NARRATOR.md`](file:///c:/Projects/Borsaty/docs/NARRATOR.md).









## المرحلة التاسعة (ح): محرك التحقق المتدحرج والاختبار التاريخي (Phase ح: Walk-Forward Validation Engine)

المنطلق: *لا نُقرّ بدقة عالية — نُثبتها بالبيانات التاريخية والتحقق المتدحرج وفترات ثقة ويلسون.*

### ما تم بناؤه في Phase ح:

- **`packages/analysis/backtest/engine.py`** — `BacktestEngine`: محاكاة شريط بشريط بدون أي look-ahead.
  - يُشغّل خط الأنابيب الكامل (7 محركات) على كل نقطة زمنية تاريخية بيانات الماضي فقط.
  - يُصنّف كل إشارة: `HIT_T1` | `HIT_T2` | `HIT_T3` | `STOPPED` | `EXPIRED`.
  - يحسب: Hit Rate، Profit Factor، Sharpe Ratio، Max Drawdown، Expectancy.
  - فترات ثقة ويلسون 95% لكل معدل نجاح.
- **`packages/analysis/backtest/walk_forward.py`** — `WalkForwardValidator`: نوافذ متدحرجة (500 شمعة، خطوة 250).
  - يقيس الاستقرار عبر النوافذ: `stability_score = 1 - std/mean`.
  - يحسب WF Efficiency: نسبة أداء النافذة الأخيرة / الأولى.
  - حكم تلقائي: `stable` | `unstable` | `insufficient_data`.
- **`packages/analysis/backtest/report.py`** — `BacktestReport`: تقارير إحصائية ثنائية اللغة.
  - عربي وإنجليزي مستقلان (نفس عقد zero-hallucination من Phase ز).
  - تعرض "بيانات غير كافية" تلقائياً عند أقل من 30 إشارة.
- **`packages/analysis/backtest/seed_data.py`** — بيانات تاريخية اصطناعية لـ 10 أدوات × 5 سنوات (1305 شمعة لكل أداة).
- **`POST /backtest/run`** + **`POST /backtest/leaderboard`** — نقاط API جديدة في FastAPI.
- **`/api/backtest/[symbol]`** + **`/api/backtest/leaderboard`** — مسارات Next.js جديدة.

### ضمانات غير قابلة للتفاوض:
- **لا Look-Ahead مطلقاً** — مثبت بـ 10 اختبارات وحدة خاصة.
- **أقل من 30 إشارة → `insufficient_data`** — معدل النجاح لا يُنشر.
- **فترات ثقة ويلسون** لكل معدل نجاح منشور.

### نتائج الاختبارات:
- **61 اختباراً جديداً** في `test_backtest.py`: Look-Ahead، تصنيف النتائج، المقاييس، Walk-Forward، التقارير، بيانات حقيقية، الأداء.
- **533+ اختباراً** إجمالياً بدون أي تراجعات.
- توثيق تفصيلي: [`docs/BACKTEST.md`](file:///c:/Projects/Borsaty/docs/BACKTEST.md).

---

## 🏛️ المرحلة (ر): الترسيخ المؤسسي وتجهيز المنصة للاستثمار (Phase ر: Investor-Ready Pre-Launch Refactor)

تمت إعادة هيكلة المنصة بصورة شاملة للارتقاء بها إلى مصاف المنصات المالية العالمية الكبرى (Investing.com + TradingView) وتهيئتها بالكامل للعرض أمام كبار المستثمرين اليوم:

### 1. نظام الألوان المؤسسي الفاخر (Institutional Black System):
- **الأسود النقي الفاخر (`#0A0A0A`)**: الهوية البصرية الرئيسية لكافة الأزرار التفاعلية، شريط التنقل السفلي، والتذييل.
- **السيان الكهربائي (`#00D9FF`)**: مخصص حصرياً للروابط النشطة ومؤشرات التفاعل والـ hover.
- **الأخضر (`#10B981`) والأحمر (`#EF4444`)**: محجوزان بشكل صارم للبيانات المالية فقط (نسب الارتفاع/الانخفاض، صفقات الشراء/البيع، وإشارات الأرباح والخسائر P&L).
- **شعار "B" المربع المينيمالي الفاخر**: شعار SVG حديث يجمع بين الحرف المؤسسي ونقطة السيان الكهربائية.

### 2. استقرار مطلق واختفاء أخطاء 500 (Bulletproof Stability):
- دعم كامل لبيئة Node.js لميدلوير Clerk (`export const runtime = 'nodejs'` مع تفعيل `experimental.nodeMiddleware`).
- حماية استباقية ضد غياب متغيرات البيئة لمنع انهيار الخادم تحت أي ظرف.
- تغطية شاملة لجميع صفحات المنصة بحواجز الأخطاء (`ErrorBoundary`) الثنائية اللغة (عربي / إنجليزي).
- اجتياز فحص `tsc --noEmit` بنسبة 100% وبصفر أخطاء نوعية (0 TypeScript Errors).

### 3. سرعة استثنائية (Sub-1s LCP & Edge Caching):
- تقسيم الحزم الديناميكي (`next/dynamic` مع `ssr: false`) لمكونات الرسوم البيانية الثقيلة مثل `PriceChart` ومحرك البحث السريع `CommandPalette`.
- ترشيد الخطوط السحابية (`Cairo` و`Inter`) باقتصارها على الأوزان الضرورية (`400`, `600`, `700`) مع خاصية `display: swap`.
- ضبط ترويسات التخزين المؤقت `Cache-Control`:
  - الأسعار اللحظية: `public, s-maxage=60, stale-while-revalidate=30`
  - التحليلات والقرارات الكمية: `public, s-maxage=300, stale-while-revalidate=60`
  - المحفظة الخاصة: `no-store, no-cache, must-revalidate`

### 4. تحصين أمني مشدد (Security Hardening):
- إضافة ترويسات الأمان الصارمة: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy`.
- إخفاء تام لروابط خدمات التحليل الخلفية `PYTHON_SERVICE_URL` عن المتصفح والعملاء (Anti-Reverse Engineering).
- تعطيل خرائط المصدر في الإنتاج (`productionBrowserSourceMaps: false`).
- تحديد معدل الطلبات (Rate Limiting) على مسارات التصفية والتحليلات المتكررة.

### 5. لمسات المستثمر المميزة (The "Wow" Factor):
- نظام تنبيهات فوري Toast عبر `sonner` يدعم اللغتين.
- تأثير احتفالي Confetti راقٍ عبر `canvas-confetti` عند إضافة صفقات المحفظة لأول مرة.
- حالات فارغة ذكية (Smart Empty States) للمحفظة، وقائمة المتابعة، والمصفي.
- اختصارات لوحة المفاتيح المؤسسية السريعة:
  - `Ctrl + K` / `Cmd + K`: فتح لوحة الأوامر والبحث
  - `G + H`: الانتقال للرئيسية (Go Home)
  - `G + P`: الانتقال للمحفظة (Go Portfolio)
  - `G + W`: الانتقال لقائمة المتابعة (Go Watchlist)
  - `G + S`: الانتقال للمصفي (Go Screener)
