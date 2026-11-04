# PDF Report Generation

## Overview
The web application generates a four-page, localized stock report in the browser:
- **Page 1:** Company cover, quote, and quantitative decision.
- **Page 2:** Trade levels and risk-management guidance.
- **Page 3:** Technical, valuation, financial, analyst, and dividend evidence.
- **Page 4:** Narrative summary and disclaimer.

## Technical Details
- Route: `/stock/{symbol}/report`.
- PDF rendering: `html2pdf.js` in the browser, with Arabic and English text rendered by the browser.
- Report data: Existing quote, decision, analysis, technical-score, and fundamental API routes.
- The retired `/api/report/{symbol}/pdf` endpoint returns HTTP 410.
