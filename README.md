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
Name                      Stmts   Miss  Cover
---------------------------------------------
engines\confluence.py        43      7    84%
engines\data_quality.py      32      2    94%
engines\elliott.py           31      4    87%
engines\fair_value.py        37      7    81%
engines\fibonacci.py         11      0   100%
engines\gann.py              32      0   100%
engines\harmonic.py          17      0   100%
engines\indicators.py       103      7    93%
---------------------------------------------
TOTAL                       306     27    91%
======================= 10 passed in 0.27s =======================
```

### الاختبارات الخاصة المضافة:
- **Zero-Hallucination Test (`test_zero_hallucination_narrator`):** يتحقق رياضياً من أن المساعد الذكي Narrator لا يذكر أي رقم سعر، هدف، وقف خسارة، أو نسبة ليست موجودة في الـ JSON الحتمي المدخل.
- **SAHMK Fallback Test (`test_sahmk_fallback_mechanism`):** يختبر الانتقال التلقائي لمزود البيانات الاحتياطي (EODHD / Proxy) عند انقطاع خدمة SAHMK مع تسجيل الوسم `fallback_used: True` والتنبيهات.
- **Data Quality Gates:** فحص الشموع الشاذة والقيم السالبة ووسم تأخير الـ 15 دقيقة للبورصة المصرية.

---

## 📊 سجل الإشارات ونسبة النجاح (Signals & Hit Rate Dashboard)

تم إنشاء وتفعيل صفحة سجل الإشارات بالكامل على الرابط:
👉 **`/signals`**

### الخصائص:
- **Hit Rate Dashboard:** عرض النسبة المئوية للنجاح لكل نوع إشارة (`STRONG_BULLISH`, `BULLISH`, `NEUTRAL`, `BEARISH`, `STRONG_BEARISH`).
- **Signal History:** تتبع كل إشارة وسعر الدخول، الأهداف المعلنة، وقف الخسارة، النتيجة الفعلية المحققة (`result_pct`)، وحالتها (`ACTIVE`, `HIT_T1`, `HIT_T2`, `STOPPED`).
- **SQL Signal Store:** استعلام تجميعي فوري:
```sql
SELECT 
  type AS signal_type,
  COUNT(*) AS total_signals,
  COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END) AS successful_hits,
  ROUND(
    (COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END)::numeric / NULLIF(COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END), 0)) * 100, 
    1
  ) AS hit_rate_pct,
  ROUND(AVG(result_pct)::numeric, 2) AS avg_result_pct
FROM "Signal"
GROUP BY type;
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

## 🧪 فحص أسهم المرحلة 0 (Tested Benchmark Stocks)
- **COMI** (البنك التجاري الدولي - مصر) — صفحة التحليل: `/stock/COMI`
- **ABUK** (أبو قير للأسمدة - مصر) — صفحة التحليل: `/stock/ABUK`
- **2222** (أرامكو السعودية - تاسي) — صفحة التحليل: `/stock/2222`
- **1120** (مصرف الراجحي - تاسي) — صفحة التحليل: `/stock/1120`
- **QNBK** (بنك قطر الوطني - الخليج) — صفحة التحليل: `/stock/QNBK`
