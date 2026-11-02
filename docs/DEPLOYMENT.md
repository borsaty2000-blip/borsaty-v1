# 🚀 BORSATY — Production Deployment Guide (دليل النشر والتشغيل)

This guide provides end-to-end instructions for deploying the **Borsaty Platform** across production cloud providers:
- **Python Deterministic Analysis Engine** on **Render** (Docker containerized)
- **Next.js Web Application & BFF** on **Vercel**
- **PostgreSQL Database** on **Neon / Supabase / Render Postgres**
- **Redis Cache** on **Upstash Redis**

---

## 🏗️ Architectural Topology

```mermaid
flowchart TD
    User["🌐 End User / Browser"]
    Vercel["⚡ Vercel (Next.js 15 App Router & BFF)"]
    Render["🐍 Render (FastAPI Analysis Engine + Docker)"]
    Postgres[("🗄️ PostgreSQL (Neon / Supabase)")]
    Redis[("⚡ Upstash Redis (Cache & Rate Limiter)")]
    ExternalData["📈 Live Feeds (yfinance / EODHD API)"]

    User -->|HTTPS| Vercel
    Vercel -->|Internal / Cache Fetch| Redis
    Vercel -->|Prisma ORM| Postgres
    Vercel -->|Microservice HTTP| Render
    Render -->|Real Quotes & History| ExternalData
```

---

## Part 1: Deploy Python Analysis Engine on Render

The Python analysis engine provides the 8 deterministic engines (HSPD, Elliott, Harmonic, Classical, Indicators, Confluence, Trade Plan, Narrator, Decision, and PDF Generation).

### Method A: Docker Deployment (Recommended)

Using Docker guarantees that Cairo, Pango, and Arabic typography libraries (`fonts-noto-core`, `fonts-dejavu-core`) are pre-installed for institutional PDF rendering.

1. **Log in to [Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`Borsaty`).
4. Configure the Web Service settings:
   - **Name**: `borsaty-analysis`
   - **Region**: Choose closest to your users (e.g., `Frankfurt` or `Oregon`).
   - **Runtime**: **Docker**
   - **Root Directory**: `packages/analysis` (or leave blank if using repo root `Dockerfile`)
   - **Dockerfile Path**: `packages/analysis/Dockerfile` (or `Dockerfile`)
   - **Instance Type**: **Starter** or **Free**
5. Add **Environment Variables** (in the Environment tab):
   | Variable | Value / Description | Required? |
   | :--- | :--- | :--- |
   | `PORT` | `8000` (Render will inject its own port automatically) | Auto |
   | `HOST` | `0.0.0.0` | Yes |
   | `ENV` | `production` | Yes |
   | `EODHD_API_KEY` | Your EODHD API Token (Free tier or Paid) | Recommended |
   | `GEMINI_API_KEY` | Optional: Gemini API Key for AI enhancements | Optional |
   | `CORS_ORIGINS` | `https://your-borsaty-app.vercel.app,http://localhost:3000,*` | Yes |
6. Set **Health Check Path**: `/health`
7. Click **Create Web Service**.
8. Once deployed, note down your service URL, e.g.:
   ```
   https://borsaty-analysis.onrender.com
   ```

---

## Part 2: Deploy Next.js Web Application on Vercel

The Next.js 15 application handles SSR, i18n localization, live charts, client state, and secure server routes.

1. **Log in to [Vercel](https://vercel.com/)**.
2. Click **Add New...** → **Project**.
3. Import your `Borsaty` Git repository.
4. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `apps/web`.
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
5. Configure **Environment Variables**:
   | Variable | Value / Example | Description |
   | :--- | :--- | :--- |
   | `PYTHON_SERVICE_URL` | `https://borsaty-analysis.onrender.com` | Primary URL of Render Python Service |
   | `NEXT_PUBLIC_API_URL` | `https://borsaty-analysis.onrender.com` | Fallback / Public API URL |
   | `DATABASE_URL` | `postgresql://user:pass@host/borsaty?sslmode=require` | PostgreSQL Connection string |
   | `DIRECT_URL` | `postgresql://user:pass@host/borsaty?sslmode=require` | Direct connection for Prisma migrations |
   | `REDIS_URL` | `rediss://default:token@host.upstash.io:6379` | Upstash Redis TLS connection |
   | `ADMIN_SECRET_KEY` | `your_secure_random_admin_key_here` | Secret for admin & DLQ operations |
   | `NODE_ENV` | `production` | Environment mode |
6. Click **Deploy**.
7. Vercel will build and assign your production domain, e.g.:
   ```
   https://borsaty.vercel.app
   ```

---

## Part 3: Database & Cache Setup

### 1. PostgreSQL (Neon or Supabase)
1. Create a serverless PostgreSQL database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Copy the pooled connection string into `DATABASE_URL`.
3. In your local terminal, push the database schema:
   ```bash
   pnpm --filter @borsaty/db prisma db push
   # Optional: Seed initial companies and instruments
   pnpm --filter @borsaty/db prisma db seed
   ```

### 2. Redis Cache (Upstash)
1. Create a Redis database on [Upstash](https://console.upstash.com/).
2. Enable TLS (rediss).
3. Copy the `UPSTASH_REDIS_REST_URL` or standard Redis connection string `rediss://...` to `REDIS_URL`.

---

## Part 4: Production Verification Checklist

Once both services are running, run these smoke checks:

| Target Endpoint | Method | Expected Response |
| :--- | :--- | :--- |
| `https://borsaty-analysis.onrender.com/health` | `GET` | `{"status": "healthy"}` |
| `https://borsaty-analysis.onrender.com/market/indices` | `GET` | `{"indices": [...]}` (EGX30, TASI, S&P 500, Gold, BTC) |
| `https://borsaty-analysis.onrender.com/quote/COMI` | `GET` | Live price, change, change_pct |
| `https://borsaty-analysis.onrender.com/report/COMI/pdf` | `GET` | Valid institutional 2-page PDF file |
| `https://borsaty.vercel.app/` | `GET` | Home page loaded with live indices ticker |
| `https://borsaty.vercel.app/stock/COMI` | `GET` | Stock detail page with live price & Decision card |
| `https://borsaty.vercel.app/screener` | `GET` | AI Screener ready for natural language queries |

---

## Part 5: Troubleshooting & Production Tips

### 1. Render Free Tier Cold Starts
- **Behavior**: Free tier web services on Render spin down after 15 minutes of inactivity. The first request may take 30–50 seconds to wake up.
- **Solution**: The Next.js BFF includes generous timeouts (`AbortSignal.timeout`) and deterministic fallbacks with cached database candles, so the UI will never display a white screen even during cold starts. For instant sub-second response times, upgrade the Render instance to Starter ($7/month).

### 2. CORS Errors
- If you notice CORS errors in browser dev tools, verify that `CORS_ORIGINS` on Render contains your Vercel deployment URL (e.g. `https://borsaty.vercel.app`).
- Note that all standard frontend pages query `/api/...` on Next.js, which proxies requests server-to-server and avoids browser CORS entirely.

### 3. Font / Arabic PDF Rendering in Docker
- If generating Arabic PDFs inside custom Docker images, ensure `fonts-noto-core` and `fonts-dejavu-core` are installed (handled automatically in [`packages/analysis/Dockerfile`](file:///c:/Projects/Borsaty/packages/analysis/Dockerfile)).
