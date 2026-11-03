"""
PDF Report Generator (Borsaty Phase ي)
Generates high-fidelity 2-page institutional financial report:
Page 1: Arabic (RTL, authentic financial layout)
Page 2: English (LTR, institutional research layout)

Uses ReportLab with Arabic shaping (bidi + reshaper).
Performance: < 1.0 second per generation.
"""

from __future__ import annotations

import io
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def shape_ar(text: str) -> str:
    """Reshape and reorder Arabic text for PDF rendering."""
    if not text:
        return ""
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text


class PDFReportGenerator:
    """
    Generates exact 2-page PDF institutional reports.
    """

    VERSION = "1.0.0"

    def generate(
        self,
        symbol: str,
        company_name: str,
        current_price: float,
        currency: str,
        decision_data: Dict[str, Any],
        full_analysis: Optional[Dict[str, Any]] = None,
        market: str = "EGX",
    ) -> bytes:
        """
        Builds the 2-page report and returns binary bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=1.5 * cm,
            rightMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )

        styles = getSampleStyleSheet()
        story = []

        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        decision = decision_data.get("decision", "WAIT")
        conf_pct = int(float(decision_data.get("confidence_score", 0.5)) * 100)

        # Decision color theme
        if "BUY" in decision:
            dec_color = colors.HexColor("#059669")
            dec_bg = colors.HexColor("#ECFDF5")
            dec_ar = "شراء" if decision == "BUY" else "شراء قوي"
            dec_en = "BUY" if decision == "BUY" else "STRONG BUY"
        elif "SELL" in decision:
            dec_color = colors.HexColor("#DC2626")
            dec_bg = colors.HexColor("#FEF2F2")
            dec_ar = "بيع" if decision == "SELL" else "بيع قوي"
            dec_en = "SELL" if decision == "SELL" else "STRONG SELL"
        else:
            dec_color = colors.HexColor("#475569")
            dec_bg = colors.HexColor("#F8FAFC")
            dec_ar = "انتظار ومراقبة"
            dec_en = "WAIT & WATCH"

        entry_zone = decision_data.get("entry_zone", [0, 0])
        stop_loss = decision_data.get("stop_loss", 0)
        targets = decision_data.get("targets", [])
        primary_rr = decision_data.get("primary_rr", 0)
        t1 = targets[0] if len(targets) > 0 else 0
        t2 = targets[1] if len(targets) > 1 else (t1 * 1.05 if t1 > 0 else 0)

        # ═════════════════════════════════════════════════════════════════════
        # PAGE 1: ARABIC
        # ═════════════════════════════════════════════════════════════════════
        
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "logo.png"))
        has_logo = os.path.exists(logo_path)
        logo_elem_ar = RLImage(logo_path, width=4.5 * cm, height=1.0 * cm) if has_logo else Paragraph("<b><font size=14 color='#0A0A0A'>BORSATY</font></b>", styles["Normal"])

        # Header Table
        header_data_ar = [
            [
                Paragraph(f"<b>{date_str}</b> | {shape_ar('التقرير الفني والكمي الشامل')}", styles["Normal"]),
                logo_elem_ar,
            ]
        ]
        t_header_ar = Table(header_data_ar, colWidths=[10 * cm, 7 * cm])
        t_header_ar.setStyle(TableStyle([
            ("ALIGN", (0, 0), (0, 0), "LEFT"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_header_ar)
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

        # Stock Info Banner
        stock_banner_ar = [
            [
                Paragraph(f"<font size=18 color='#0F172A'><b>{symbol} — {shape_ar(company_name)}</b></font><br/><font size=10 color='#64748B'>{market} | {current_price:.2f} {currency}</font>", styles["Normal"]),
                Paragraph(f"<font size=12 color='#0F172A'><b>{shape_ar('الصفحة 1 من 2')}</b></font>", styles["Normal"]),
            ]
        ]
        t_stock_ar = Table(stock_banner_ar, colWidths=[13 * cm, 4 * cm])
        story.append(t_stock_ar)
        story.append(Spacer(1, 10))

        # Decision Card Box (Arabic)
        dec_box_ar = [
            [
                Paragraph(
                    f"<font size=16 color='{dec_color.hexval()}'><b>{shape_ar('القرار الفني:')} {shape_ar(dec_ar)}</b></font>"
                    f"&nbsp;&nbsp;<font size=11 color='#334155'>({shape_ar('درجة الثقة:')} {conf_pct}%)</font>",
                    styles["Normal"]
                )
            ]
        ]
        t_dec_ar = Table(dec_box_ar, colWidths=[17 * cm])
        t_dec_ar.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), dec_bg),
            ("BOX", (0, 0), (-1, -1), 1.5, dec_color),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(t_dec_ar)
        story.append(Spacer(1, 12))

        # Parameters Table (Arabic)
        params_ar = [
            [shape_ar("نسبة العائد:المخاطرة"), shape_ar("الهدف الثاني"), shape_ar("الهدف الأول"), shape_ar("وقف الخسارة"), shape_ar("نطاق الدخول")],
            [f"{primary_rr:.2f}:1", f"{t2:.2f} {currency}", f"{t1:.2f} {currency}", f"{stop_loss:.2f} {currency}", f"{entry_zone[0]:.2f} - {entry_zone[1]:.2f}"],
        ]
        t_params_ar = Table(params_ar, colWidths=[3.4 * cm] * 5)
        t_params_ar.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_params_ar)
        story.append(Spacer(1, 12))

        # Reasoning Section
        story.append(Paragraph(f"<b><font size=12 color='#0F172A'>{shape_ar('أسباب القرار والتوافق الفني:')}</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        for w in decision_data.get("why_ar", []):
            story.append(Paragraph(f"• {shape_ar(w)}", styles["Normal"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 8))
        # Risks Section
        story.append(Paragraph(f"<b><font size=12 color='#DC2626'>{shape_ar('المخاطر والتحذيرات:')}</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        for r in decision_data.get("risks_ar", []):
            story.append(Paragraph(f"• {shape_ar(r)}", styles["Normal"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 8))
        # Historical Evidence
        hist = decision_data.get("historical_evidence", {})
        story.append(Paragraph(f"<b><font size=12 color='#0F172A'>{shape_ar('الدليل الإحصائي التاريخي (Walk-Forward & Wilson CI):')}</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"{shape_ar(hist.get('message_ar', ''))}", styles["Normal"]))

        # Arabic Disclaimer
        story.append(Spacer(1, 18))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=6))
        story.append(Paragraph(f"<font size=8 color='#64748B'>{shape_ar(decision_data.get('disclaimer_ar', ''))}</font>", styles["Normal"]))

        # ═════════════════════════════════════════════════════════════════════
        # PAGE 2: ENGLISH (LTR)
        # ═════════════════════════════════════════════════════════════════════
        story.append(PageBreak())

        logo_elem_en = RLImage(logo_path, width=4.5 * cm, height=1.0 * cm) if has_logo else Paragraph("<b><font size=14 color='#0A0A0A'>BORSATY</font></b>", styles["Normal"])

        # Header Table (EN)
        header_data_en = [
            [
                logo_elem_en,
                Paragraph(f"<b>{date_str}</b> | Comprehensive Technical Report", styles["Normal"]),
            ]
        ]
        t_header_en = Table(header_data_en, colWidths=[10 * cm, 7 * cm])
        t_header_en.setStyle(TableStyle([
            ("ALIGN", (0, 0), (0, 0), "LEFT"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_header_en)
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

        # Stock Info Banner (EN)
        stock_banner_en = [
            [
                Paragraph(f"<font size=18 color='#0F172A'><b>{symbol} — Institutional Overview</b></font><br/><font size=10 color='#64748B'>{market} | {currency} {current_price:.2f}</font>", styles["Normal"]),
                Paragraph("<font size=12 color='#0F172A'><b>Page 2 of 2</b></font>", styles["Normal"]),
            ]
        ]
        t_stock_en = Table(stock_banner_en, colWidths=[13 * cm, 4 * cm])
        story.append(t_stock_en)
        story.append(Spacer(1, 10))

        # Decision Card Box (English)
        dec_box_en = [
            [
                Paragraph(
                    f"<font size=16 color='{dec_color.hexval()}'><b>TECHNICAL VERDICT: {dec_en}</b></font>"
                    f"&nbsp;&nbsp;<font size=11 color='#334155'>(Confidence: {conf_pct}%)</font>",
                    styles["Normal"]
                )
            ]
        ]
        t_dec_en = Table(dec_box_en, colWidths=[17 * cm])
        t_dec_en.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), dec_bg),
            ("BOX", (0, 0), (-1, -1), 1.5, dec_color),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(t_dec_en)
        story.append(Spacer(1, 12))

        # Parameters Table (English)
        params_en = [
            ["Entry Zone", "Stop Loss", "Target 1", "Target 2", "Risk/Reward"],
            [f"{entry_zone[0]:.2f} - {entry_zone[1]:.2f}", f"{currency} {stop_loss:.2f}", f"{currency} {t1:.2f}", f"{currency} {t2:.2f}", f"{primary_rr:.2f}:1"],
        ]
        t_params_en = Table(params_en, colWidths=[3.4 * cm] * 5)
        t_params_en.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_params_en)
        story.append(Spacer(1, 12))

        # Reasoning Section (EN)
        story.append(Paragraph("<b><font size=12 color='#0F172A'>Catalysts & Multi-Engine Confluence:</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        for w in decision_data.get("why_en", []):
            story.append(Paragraph(f"• {w}", styles["Normal"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 8))
        # Risks Section (EN)
        story.append(Paragraph("<b><font size=12 color='#DC2626'>Risk Factors & Invalidation:</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        for r in decision_data.get("risks_en", []):
            story.append(Paragraph(f"• {r}", styles["Normal"]))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 8))
        # Historical Evidence (EN)
        story.append(Paragraph("<b><font size=12 color='#0F172A'>Empirical Validation (Walk-Forward & Wilson CI):</font></b>", styles["Normal"]))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"{hist.get('message_en', '')}", styles["Normal"]))

        # English Disclaimer
        story.append(Spacer(1, 18))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=6))
        story.append(Paragraph(f"<font size=8 color='#64748B'>{decision_data.get('disclaimer_en', '')}</font>", styles["Normal"]))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


global_pdf_generator = PDFReportGenerator()
