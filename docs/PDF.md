# PDF Report Generator Specification (Phase ي)

## Overview
Generates an institutional 2-page PDF financial analysis report:
- **Page 1: Arabic (RTL)** — Authentic Arabic financial phrasing, right-to-left layout.
- **Page 2: English (LTR)** — Institutional research presentation.

## Technical Details
- Engine: ReportLab with Arabic text reshaping (`arabic_reshaper` + `python-bidi`).
- Performance: $< 1.0$ second generation time (tested at $\approx 0.05$s).
- Endpoint: `/api/report/{symbol}/pdf` returning `application/pdf`.
