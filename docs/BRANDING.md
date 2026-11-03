# 🏛️ Borsaty Brand Identity & Logo System

## 1. Overview & Philosophy
Borsaty’s visual identity is designed for an **institutional financial terminal** comparable to Bloomberg, Reuters, or Goldman Sachs. It moves decisively away from "AI startup" tropes (no floating gradients, no neon greens, no 3D globes, no version badges).

### Core Pillars:
1. **Minimalist**: Strictly monochrome (`#0A0A0A` black & `#FFFFFF` white). No shadows, no gradients, no decorative chrome.
2. **Typographic**: The geometric "B" inside a rounded square anchors the visual weight, paired with an authoritative Inter Bold wordmark.
3. **Timeless**: Built to remain contemporary for decades.
4. **Institutional**: Solid, structured, high-contrast, data-first.
5. **Versatile**: Flawless legibility from 16×16 px (browser favicon) to 512×512 px (PWA app icon) and 720 px (PDF research reports).

---

## 2. Logo Mark Geometry & Anatomy

```
┌──────┐
│  ██  │  BORSATY
│  ███ │  ──────────────────────────
│  ██  │  INSTITUTIONAL QUANTITATIVE TERMINAL
└──────┘
```

- **Icon Container**: Rounded square with 20% corner radius (`rx="8"` at 40×40 px; `rx="102.4"` at 512×512 px).
- **Icon Letterform "B"**: Geometric humanist uppercase "B", centered with optical balance (taking 55% of the container height).
- **Wordmark**: `BORSATY` set in tight-tracking Inter / Segoe UI Bold (`tracking-tight`, cap-height = 20 px for 40 px mark).
- **Proportions**: 40 px height × 178 px width (approx. 180×40 px standard).

---

## 3. The 6 SVG Deliverables

All SVG assets are fully vectorized (pure `<path>` geometry), optimized via SVGO, contain `<title>` accessibility tags, and are under 3 KB each.

| Variant | File Path | Dimensions | Background / Theme |
| :--- | :--- | :--- | :--- |
| **Primary (Light Mode)** | `/branding/logo-primary.svg` | `178×40` px | `#0A0A0A` icon + `#FFFFFF` "B" + `#0A0A0A` text |
| **White (Dark Mode)** | `/branding/logo-white.svg` | `178×40` px | `#FFFFFF` icon + `#0A0A0A` "B" + `#FFFFFF` text |
| **Icon Only (PWA / Favicon)** | `/branding/logo-icon-only.svg` | `512×512` px | `#0A0A0A` square + `#FFFFFF` "B" |
| **Monochrome Black** | `/branding/logo-monochrome-black.svg` | `178×40` px | Single-color `#0A0A0A` with transparent "B" cutout |
| **Monochrome White** | `/branding/logo-monochrome-white.svg` | `178×40` px | Single-color `#FFFFFF` with transparent "B" cutout |
| **Horizontal Compact** | `/branding/logo-horizontal-compact.svg` | `110×24` px | 24 px icon + 18 px text for compact headers |

---

## 4. React Logo Component (`<Logo />`)

Located at `apps/web/src/components/branding/Logo.tsx`.
Renders optimized vector SVG inline for **instant, zero-network latency** and zero layout shift.

### Component API:
```tsx
import Logo from '@/components/branding/Logo';

// 1. Primary Full Logo (Light Header)
<Logo variant="primary" size={40} showText={true} />

// 2. Dark Mode Header Logo
<Logo variant="white" size={32} showText={true} />

// 3. Compact Mobile Header
<Logo variant="compact" size={24} showText={true} />

// 4. Standalone Icon (e.g. Nav Drawer, Button)
<Logo variant="icon" size={32} showText={false} />

// 5. Monochrome Print / Watermark
<Logo variant="monochrome-black" size={40} />
```

---

## 5. Favicon, PWA & Print Assets

| Asset | Location | Format / Sizes |
| :--- | :--- | :--- |
| **Favicon** | `apps/web/public/favicon.ico` | Multi-size ICO (16×16, 32×32, 48×48) |
| **SVG Favicon** | `apps/web/public/favicon.svg` | Modern browser vector favicon |
| **PWA App Icon** | `apps/web/public/icon.svg` | Scalable vector maskable PWA icon |
| **Apple Touch Icon** | `apps/web/public/apple-touch-icon.png` | 180×180 px iOS home screen icon |
| **PWA 192 Icon** | `apps/web/public/icon-192.png` | 192×192 px Android install icon |
| **PWA 512 Icon** | `apps/web/public/icon-512.png` | 512×512 px Splash screen / store icon |
| **PDF Report Logo** | `packages/analysis/assets/logo.png` | 720×160 px transparent PNG for ReportLab |

---

## 6. Non-Negotiable Brand Rules

1. **NO Green, NO Purple, NO Neon**: Only institutional Black (`#0A0A0A`), White (`#FFFFFF`), and muted neutral slate borders.
2. **NO Gradients or 3D**: Strictly flat surfaces.
3. **NO "AI" Branding**: Never display "AI", "Borsaty AI", "v2.0", or version badges in brand assets. The name is exclusively **Borsaty** or **BORSATY**.
4. **NO Embedded Taglines**: Taglines must live in semantic HTML body copy, never baked into the logo image.
