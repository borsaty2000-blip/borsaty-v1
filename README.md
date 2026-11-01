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

### المتطلبات
- Node.js 20+
- pnpm 9+
- Python 3.10+

### 1. تثبيت الحزم
```bash
pnpm install
```

### 2. تشغيل محركات التحليل الحتمية (Python FastAPI)
```bash
cd packages/analysis
python test_engines.py      # فحص واختبار جميع المحركات الحتمية
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
