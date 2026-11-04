"""
Borsaty 4-Page PDF Report Generator
Architecture:
- Page 1: Cover + Hero Decision Card (Massive decision word, subtitle, 4 numbers)
- Page 2: Trade Plan (4-box grid, position sizing, risk/reward)
- Page 3: Technical Evidence (6-card grid, support & resistance levels)
- Page 4: Narrative Summary + Key Risks + Legal Disclaimer
- Logo on every page
- ReportLab renderer with RTL Arabic shaping and LTR English support
"""

from __future__ import annotations

import io
import logging
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ReportLab provides the same renderer on Windows and Linux.
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

import arabic_reshaper
from bidi.algorithm import get_display

CURRENT_DIR = Path(__file__).resolve().parent
ASSETS_DIR = CURRENT_DIR.parent / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"
logger = logging.getLogger(__name__)

# Register fonts if available
FONTS_REGISTERED = False
def register_custom_fonts():
    global FONTS_REGISTERED
    if FONTS_REGISTERED:
        return
    try:
        cairo_reg = FONTS_DIR / "Cairo-Regular.ttf"
        cairo_bold = FONTS_DIR / "Cairo-Bold.ttf"
        inter_reg = FONTS_DIR / "Inter-Regular.ttf"
        inter_bold = FONTS_DIR / "Inter-Bold.ttf"

        if cairo_reg.exists():
            pdfmetrics.registerFont(TTFont("Cairo", str(cairo_reg)))
        if cairo_bold.exists():
            pdfmetrics.registerFont(TTFont("Cairo-Bold", str(cairo_bold)))
        if inter_reg.exists():
            pdfmetrics.registerFont(TTFont("Inter", str(inter_reg)))
        if inter_bold.exists():
            pdfmetrics.registerFont(TTFont("Inter-Bold", str(inter_bold)))
        FONTS_REGISTERED = True
    except Exception:
        logger.exception("Could not register custom fonts for PDF reports")

register_custom_fonts()


def shape_ar(text: str) -> str:
    """Reshape and reorder Arabic text for PDF rendering."""
    if not text:
        return ""
    try:
        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except Exception:
        logger.exception("Could not shape Arabic text for PDF report")
        return str(text)


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for exact total page count and professional header/footer on every page."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer line
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.8)
        self.line(1.5 * cm, 1.2 * cm, A4[0] - 1.5 * cm, 1.2 * cm)

        # Footer Text
        footer_text = f"Borsaty Institutional Research Terminal  ·  Page {self._pageNumber} of {total_pages}"
        self.drawString(1.5 * cm, 0.8 * cm, footer_text)
        self.drawRightString(A4[0] - 1.5 * cm, 0.8 * cm, "borsatyai.com")

        self.restoreState()


class PdfReportGenerator:
    """
    Generates four-page financial reports with real supplied market and analysis data.
    """

    VERSION = "2.0.0"

    def generate(
        self,
        symbol: str,
        company_name: str,
        current_price: float,
        currency: str = "EGP",
        decision_data: Optional[Dict[str, Any]] = None,
        full_analysis: Optional[Dict[str, Any]] = None,
        market: str = "EGX",
        lang: str = "ar",
    ) -> bytes:
        """
        Builds the complete 4-page institutional report.
        """
        if not symbol:
            raise ValueError("Stock symbol is required for report generation")

        if current_price is None or current_price <= 0:
            raise ValueError(f"Invalid current price for {symbol}: {current_price}")

        decision_data = decision_data or {}

        def valid_number(value: Any) -> Optional[float]:
            try:
                number = float(value)
                return number if math.isfinite(number) and number > 0 else None
            except (TypeError, ValueError):
                return None

        raw_entry = decision_data.get("entry_zone")
        if not raw_entry and decision_data.get("entry_low") and decision_data.get("entry_high"):
            raw_entry = [decision_data["entry_low"], decision_data["entry_high"]]
        entry_zone = None
        if isinstance(raw_entry, (list, tuple)) and len(raw_entry) >= 2:
            low, high = valid_number(raw_entry[0]), valid_number(raw_entry[1])
            if low is not None and high is not None:
                entry_zone = [low, high]

        stop_loss = valid_number(decision_data.get("stop_loss"))
        raw_targets = decision_data.get("targets")
        parsed_targets = []
        if isinstance(raw_targets, (list, tuple)):
            for target in raw_targets:
                parsed = valid_number(target.get("price") if isinstance(target, dict) else target)
                if parsed is not None:
                    parsed_targets.append(parsed)
        if not parsed_targets:
            for key in ("tp1", "tp2"):
                parsed = valid_number(decision_data.get(key))
                if parsed is not None:
                    parsed_targets.append(parsed)
        target_1 = parsed_targets[0] if parsed_targets else None
        target_2 = parsed_targets[1] if len(parsed_targets) > 1 else None

        risk_reward = valid_number(decision_data.get("primary_rr") or decision_data.get("risk_reward"))

        # Position Sizing calculations
        capital = 100000.0
        max_risk_cash = capital * 0.02 # 2%
        is_short = "SELL" in str(decision_data.get("decision") or decision_data.get("action") or "").upper()
        risk_distance = (
            stop_loss - entry_zone[1]
            if is_short and entry_zone and stop_loss is not None
            else entry_zone[0] - stop_loss
            if entry_zone and stop_loss is not None
            else None
        )
        per_share_risk = max(0.01, risk_distance) if risk_distance is not None and risk_distance > 0 else None
        suggested_shares = int(max_risk_cash / per_share_risk) if per_share_risk else None

        # Decision text formatting
        raw_decision = str(decision_data.get("decision") or decision_data.get("action") or "WAIT").upper()
        is_buy = "BUY" in raw_decision
        is_sell = "SELL" in raw_decision
        is_strong_buy = "STRONG" in raw_decision and is_buy

        if is_buy:
            decision_class = "buy"
            decision_word_ar = "اشترِ بقوة" if is_strong_buy else "شراء"
            decision_word_en = "STRONG BUY" if is_strong_buy else "BUY"
            decision_subtitle_ar = "إشارة التحليل الكمي"
            decision_subtitle_en = "Quantitative analysis signal"
        elif is_sell:
            decision_class = "sell"
            decision_word_ar = "بيع"
            decision_word_en = "SELL"
            decision_subtitle_ar = "إشارة التحليل الكمي"
            decision_subtitle_en = "Quantitative analysis signal"
        else:
            decision_class = "wait"
            decision_word_ar = "ترقّب"
            decision_word_en = "WAIT"
            decision_subtitle_ar = "لا تتوفر خطة تداول مكتملة حالياً"
            decision_subtitle_en = "No complete trade plan is currently available"

        currency_ar = "ج.م" if currency == "EGP" else "ر.س" if currency == "SAR" else currency
        change_pct = decision_data.get("change_pct")
        change_pct = float(change_pct) if isinstance(change_pct, (int, float)) and math.isfinite(change_pct) else None
        date_str = str(decision_data.get("data_as_of") or datetime.now(timezone.utc).strftime("%Y-%m-%d"))

        supports = []
        resistances = []
        raw_support = valid_number(decision_data.get("support"))
        raw_resistance = valid_number(decision_data.get("resistance"))
        if raw_support:
            supports.append({"price": raw_support, "type": "مستوى دعم مقدم" if lang == "ar" else "Provided support level"})
        if raw_resistance:
            resistances.append({"price": raw_resistance, "type": "مستوى مقاومة مقدم" if lang == "ar" else "Provided resistance level"})

        why_ar = decision_data.get("why_ar") or decision_data.get("summary_bullets") or []
        why_en = decision_data.get("why_en") or decision_data.get("summary_bullets") or []
        narrative_paragraphs_ar = [str(item) for item in why_ar if item]
        narrative_paragraphs_en = [str(item) for item in why_en if item]
        if not narrative_paragraphs_ar:
            narrative_paragraphs_ar = ["لا تتوفر تفاصيل تحليلية إضافية لهذا التقرير."]
        if not narrative_paragraphs_en:
            narrative_paragraphs_en = ["No additional analysis details are available for this report."]

        key_risks_ar = [str(item) for item in decision_data.get("risks_ar", []) if item]
        key_risks_en = [str(item) for item in decision_data.get("risks_en", []) if item]
        if not key_risks_ar:
            key_risks_ar = ["لا تتوفر مخاطر خاصة من محرك التحليل؛ راجع إخلاء المسؤولية."]
        if not key_risks_en:
            key_risks_en = ["No specific risks were returned by the analysis engine; see disclaimer."]

        # ReportLab is the canonical renderer to keep all report values data-backed.
        return self._generate_reportlab_4page(
            symbol=symbol,
            company_name=company_name,
            current_price=current_price,
            currency=currency,
            currency_ar=currency_ar,
            market=market,
            decision_word=decision_word_ar if lang == "ar" else decision_word_en,
            decision_subtitle=decision_subtitle_ar if lang == "ar" else decision_subtitle_en,
            decision_class=decision_class,
            entry_zone=entry_zone,
            stop_loss=stop_loss,
            target_1=target_1,
            target_2=target_2,
            risk_reward=risk_reward,
            suggested_shares=suggested_shares,
            per_share_risk=per_share_risk,
            supports=supports,
            resistances=resistances,
            narrative=narrative_paragraphs_ar if lang == "ar" else narrative_paragraphs_en,
            key_risks=key_risks_ar if lang == "ar" else key_risks_en,
            date_str=date_str,
            change_pct=change_pct,
            decision_data=decision_data,
            is_ar=(lang == "ar"),
        )

    def _generate_reportlab_4page(
        self,
        symbol: str,
        company_name: str,
        current_price: float,
        currency: str,
        currency_ar: str,
        market: str,
        decision_word: str,
        decision_subtitle: str,
        decision_class: str,
        entry_zone: Optional[List[float]],
        stop_loss: Optional[float],
        target_1: Optional[float],
        target_2: Optional[float],
        risk_reward: Optional[float],
        suggested_shares: Optional[int],
        per_share_risk: Optional[float],
        supports: List[Dict[str, Any]],
        resistances: List[Dict[str, Any]],
        narrative: List[str],
        key_risks: List[str],
        date_str: str,
        change_pct: Optional[float],
        decision_data: Dict[str, Any],
        is_ar: bool,
    ) -> bytes:
        """
        Renders exact 4-page Goldman Sachs layout using ReportLab.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=1.5 * cm,
            rightMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.8 * cm,
        )

        font_name = "Cairo" if is_ar else "Inter"
        font_bold = "Cairo-Bold" if is_ar else "Inter-Bold"

        def display_number(value: Optional[float]) -> str:
            return f"{value:.2f}" if value is not None else ("غير متاح" if is_ar else "Unavailable")

        def display_text(value: Any) -> str:
            return str(value) if value not in (None, "") else ("غير متاح" if is_ar else "Unavailable")

        # Check font availability
        available_fonts = pdfmetrics.getRegisteredFontNames()
        if font_name not in available_fonts:
            font_name = "Helvetica"
            font_bold = "Helvetica-Bold"

        story = []

        # Color mapping
        if decision_class == "buy":
            dec_color = colors.HexColor("#059669")
            dec_bg = colors.HexColor("#059669")
        elif decision_class == "sell":
            dec_color = colors.HexColor("#DC2626")
            dec_bg = colors.HexColor("#DC2626")
        else:
            dec_color = colors.HexColor("#F59E0B")
            dec_bg = colors.HexColor("#F59E0B")

        logo_path = ASSETS_DIR / "logo.png"

        def get_header_row(badge_text: str):
            badge = shape_ar(badge_text) if is_ar else badge_text
            p_badge = Paragraph(
                f"<font color='#64748B' size=8><b>{badge.upper()}</b></font>",
                ParagraphStyle("Hdr", fontName=font_bold, alignment=2 if is_ar else 0)
            )
            logo_img = RLImage(str(logo_path), width=3.5 * cm, height=0.77 * cm) if logo_path.exists() else Paragraph("<b>BORSATY</b>", ParagraphStyle("Logo", fontName=font_bold))
            t = Table([[logo_img, p_badge]], colWidths=[6 * cm, 12 * cm])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT" if not is_ar else "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            return t

        # ═══════════════════════════════════════════════════════════════
        # PAGE 1: COVER + HERO DECISION CARD
        # ═══════════════════════════════════════════════════════════════
        story.append(get_header_row("تقرير بحثي مالي مؤسسي" if is_ar else "EQUITY RESEARCH REPORT"))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceBefore=4, spaceAfter=14))

        # Company title & price block
        comp_disp = shape_ar(company_name) if is_ar else company_name
        curr_disp = shape_ar(currency_ar) if is_ar else currency
        story.append(Paragraph(
            f"<font size=24><b>{symbol}</b></font>  <font size=12 color='#64748B'>| {market} | {comp_disp}</font>",
            ParagraphStyle("Sym", fontName=font_bold, spaceAfter=8)
        ))
        story.append(Paragraph(
            f"{shape_ar('البيانات حتى') if is_ar else 'Market data as of'}: {date_str}",
            ParagraphStyle("AsOf", fontName=font_name, fontSize=8, textColor=colors.HexColor("#64748B"), spaceAfter=6),
        ))

        price_tbl = Table(
            [[
                Paragraph(f"<font size=32><b>{current_price:.2f}</b></font> <font size=14 color='#64748B'>{curr_disp}</font>", ParagraphStyle("Pr", fontName=font_bold)),
                Paragraph(
                    f"<font size=12 color='{'#059669' if change_pct is not None and change_pct >= 0 else '#DC2626'}'><b>{f'{change_pct:+.2f}%' if change_pct is not None else ('غير متاح' if is_ar else 'Unavailable')}</b></font>",
                    ParagraphStyle("Chg", fontName=font_bold, alignment=2),
                ),
            ]],
            colWidths=[12 * cm, 6 * cm]
        )
        price_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(price_tbl)
        story.append(Spacer(1, 16))

        # Massive Hero Decision Card
        dec_disp = shape_ar(decision_word) if is_ar else decision_word
        sub_disp = shape_ar(decision_subtitle) if is_ar else decision_subtitle

        card_content = [
            [Paragraph(f"<font size=56 color='#FFFFFF'><b>{dec_disp}</b></font>", ParagraphStyle("DW", fontName=font_bold, alignment=1))],
            [Paragraph(f"<font size=11 color='#FFFFFF'>{sub_disp}</font>", ParagraphStyle("DS", fontName=font_name, alignment=1))],
            [Spacer(1, 8)],
            [
                Table([
                    [
                        Paragraph(f"<font size=8 color='#FFFFFF'><b>{shape_ar('نطاق الدخول') if is_ar else 'ENTRY'}</b><br/><font size=14><b>{display_number(entry_zone[0] if entry_zone else None)}</b></font></font>", ParagraphStyle("B1", fontName=font_bold, alignment=1)),
                        Paragraph(f"<font size=8 color='#FFFFFF'><b>{shape_ar('وقف الخسارة') if is_ar else 'STOP LOSS'}</b><br/><font size=14><b>{display_number(stop_loss)}</b></font></font>", ParagraphStyle("B2", fontName=font_bold, alignment=1)),
                        Paragraph(f"<font size=8 color='#FFFFFF'><b>{shape_ar('الهدف 1') if is_ar else 'TARGET 1'}</b><br/><font size=14><b>{display_number(target_1)}</b></font></font>", ParagraphStyle("B3", fontName=font_bold, alignment=1)),
                        Paragraph(f"<font size=8 color='#FFFFFF'><b>{shape_ar('الهدف 2') if is_ar else 'TARGET 2'}</b><br/><font size=14><b>{display_number(target_2)}</b></font></font>", ParagraphStyle("B4", fontName=font_bold, alignment=1)),
                    ]
                ], colWidths=[4.2 * cm] * 4, style=[
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF25")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#FFFFFF50")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ])
            ]
        ]
        decision_tbl = Table(card_content, colWidths=[18 * cm])
        decision_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), dec_bg),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 22),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(decision_tbl)
        story.append(PageBreak())

        # ═══════════════════════════════════════════════════════════════
        # PAGE 2: TRADE PLAN & POSITION SIZING
        # ═══════════════════════════════════════════════════════════════
        story.append(get_header_row(f"{symbol} · خطة التداول المؤسسية" if is_ar else f"{symbol} · INSTITUTIONAL TRADE PLAN"))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceBefore=4, spaceAfter=14))

        story.append(Paragraph(
            f"<b>{shape_ar('خطة التداول وإدارة المخاطر (TRADE PLAN)') if is_ar else 'TRADE PLAN & RISK FRAMEWORK'}</b>",
            ParagraphStyle("SH2", fontName=font_bold, fontSize=14, spaceAfter=10)
        ))

        # 4-Box Grid
        b1_lbl = shape_ar("نطاق الدخول المقترح") if is_ar else "SUGGESTED ENTRY"
        b2_lbl = shape_ar("مستوى وقف الخسارة الصارم") if is_ar else "STRICT STOP LOSS"
        b3_lbl = shape_ar("الهدف الأول لجني الأرباح (T1)") if is_ar else "PRIMARY TARGET (T1)"
        b4_lbl = shape_ar("الهدف الثاني الممتد (T2)") if is_ar else "EXTENDED TARGET (T2)"

        boxes_tbl = Table([
            [
                Paragraph(f"<font size=8 color='#64748B'><b>{b1_lbl}</b></font><br/><br/><font size=18 color='#0F172A'><b>{(display_number(entry_zone[0]) + ' - ' + display_number(entry_zone[1])) if entry_zone else display_number(None)} {curr_disp}</b></font>", ParagraphStyle("BX1", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#991B1B'><b>{b2_lbl}</b></font><br/><br/><font size=18 color='#DC2626'><b>{display_number(stop_loss)} {curr_disp}</b></font>", ParagraphStyle("BX2", fontName=font_bold)),
            ],
            [
                Paragraph(f"<font size=8 color='#166534'><b>{b3_lbl}</b></font><br/><br/><font size=18 color='#059669'><b>{display_number(target_1)} {curr_disp}</b></font>", ParagraphStyle("BX3", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#166534'><b>{b4_lbl}</b></font><br/><br/><font size=18 color='#059669'><b>{display_number(target_2)} {curr_disp}</b></font>", ParagraphStyle("BX4", fontName=font_bold)),
            ]
        ], colWidths=[8.8 * cm, 8.8 * cm])
        boxes_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F8FAFC")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FEF2F2")),
            ("BACKGROUND", (0, 1), (1, 1), colors.HexColor("#F0FDF4")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(boxes_tbl)
        story.append(Spacer(1, 14))

        # Position Sizing Table
        story.append(Paragraph(
            f"<b>{shape_ar('جدول حجم المركز المالي المقترح (محفظة افتراضية 100,000)') if is_ar else 'Position Sizing Model (100,000 Portfolio)'}</b>",
            ParagraphStyle("PosT", fontName=font_bold, fontSize=11, spaceAfter=6)
        ))

        sizing_data = [
            [
                Paragraph(f"<b>{shape_ar('رأس المال') if is_ar else 'Capital'}</b>", ParagraphStyle("TH1", fontName=font_bold)),
                Paragraph(f"<b>{shape_ar('أقصى مخاطرة (2%)') if is_ar else 'Max Risk (2%)'}</b>", ParagraphStyle("TH2", fontName=font_bold)),
                Paragraph(f"<b>{shape_ar('مخاطرة السهم') if is_ar else 'Per Share Risk'}</b>", ParagraphStyle("TH3", fontName=font_bold)),
                Paragraph(f"<b>{shape_ar('الأسهم المقترحة') if is_ar else 'Suggested Shares'}</b>", ParagraphStyle("TH4", fontName=font_bold)),
            ],
            [
                f"100,000 {curr_disp}",
                f"2,000 {curr_disp}",
                f"{display_number(per_share_risk)} {curr_disp}",
                f"{suggested_shares if suggested_shares is not None else ('غير متاح' if is_ar else 'Unavailable')} shares",
            ]
        ]
        sizing_tbl = Table(sizing_data, colWidths=[4.5 * cm] * 4)
        sizing_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(sizing_tbl)
        story.append(Spacer(1, 14))

        # Risk/Reward callout
        rr_box = Table([[
            Paragraph(f"<b>{shape_ar('نسبة العائد إلى المخاطرة (R:R Ratio):') if is_ar else 'Risk / Reward Ratio (R:R):'}</b> <font size=14 color='#059669'><b>{display_number(risk_reward)}{'' if risk_reward is None else ' : 1'}</b></font>", ParagraphStyle("RR", fontName=font_name))
        ]], colWidths=[18 * cm])
        rr_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(rr_box)
        story.append(PageBreak())

        # ═══════════════════════════════════════════════════════════════
        # PAGE 3: TECHNICAL EVIDENCE & CONFLUENCE
        # ═══════════════════════════════════════════════════════════════
        story.append(get_header_row(f"{symbol} · الأدلة الفنية والمستويات" if is_ar else f"{symbol} · TECHNICAL EVIDENCE"))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceBefore=4, spaceAfter=14))

        story.append(Paragraph(
            f"<b>{shape_ar('التحليل الفني والأدلة الكمية (TECHNICAL ANALYSIS)') if is_ar else 'TECHNICAL EVIDENCE & CONFLUENCE METRICS'}</b>",
            ParagraphStyle("SH3", fontName=font_bold, fontSize=14, spaceAfter=10)
        ))

        # 6-Card Grid
        rsi = decision_data.get("rsi")
        rsi_text = f"{float(rsi):.1f}" if isinstance(rsi, (int, float)) and math.isfinite(rsi) else display_text(None)
        cards_data = [
            [
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('الاتجاه العام') if is_ar else 'PRIMARY TREND'}</b></font><br/><br/><font size=12 color='#475569'><b>{shape_ar(display_text(decision_data.get('direction'))) if is_ar else display_text(decision_data.get('direction'))}</b></font>", ParagraphStyle("C1", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('مؤشر الزخم') if is_ar else 'MOMENTUM (RSI)'}</b></font><br/><br/><font size=12 color='#475569'><b>{rsi_text}</b></font>", ParagraphStyle("C2", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('التذبذب السعري') if is_ar else 'VOLATILITY'}</b></font><br/><br/><font size=12 color='#475569'><b>{display_text(decision_data.get('atr'))}</b></font>", ParagraphStyle("C3", fontName=font_bold)),
            ],
            [
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('أحجام التداول') if is_ar else 'VOLUME'}</b></font><br/><br/><font size=12 color='#475569'><b>{display_text(decision_data.get('volume'))}</b></font>", ParagraphStyle("C4", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('الهيكل السعري') if is_ar else 'PRICE STRUCTURE'}</b></font><br/><br/><font size=12 color='#475569'><b>{display_text(decision_data.get('price_structure'))}</b></font>", ParagraphStyle("C5", fontName=font_bold)),
                Paragraph(f"<font size=8 color='#64748B'><b>{shape_ar('النماذج الفنية') if is_ar else 'PATTERNS'}</b></font><br/><br/><font size=12 color='#475569'><b>{display_text(decision_data.get('patterns'))}</b></font>", ParagraphStyle("C6", fontName=font_bold)),
            ]
        ]
        cards_tbl = Table(cards_data, colWidths=[5.8 * cm] * 3)
        cards_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(cards_tbl)
        story.append(Spacer(1, 14))

        # Support & Resistance Tables
        s_data = [[shape_ar("مستويات الدعم") if is_ar else "SUPPORT", shape_ar("السعر") if is_ar else "PRICE", shape_ar("النوع") if is_ar else "TYPE"]]
        for s in supports:
            s_data.append([shape_ar(s["type"]) if is_ar else s["type"], f"{s['price']:.2f}", "—"])
        if len(s_data) == 1:
            s_data.append([display_text(None), "—", "—"])
        s_tbl = Table(s_data, colWidths=[3.5 * cm, 2.5 * cm, 2.5 * cm])
        s_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F0FDF4")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#15803D")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#DCFCE7")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        r_data = [[shape_ar("مستويات المقاومة") if is_ar else "RESISTANCE", shape_ar("السعر") if is_ar else "PRICE", shape_ar("النوع") if is_ar else "TYPE"]]
        for r in resistances:
            r_data.append([shape_ar(r["type"]) if is_ar else r["type"], f"{r['price']:.2f}", "—"])
        if len(r_data) == 1:
            r_data.append([display_text(None), "—", "—"])
        r_tbl = Table(r_data, colWidths=[3.5 * cm, 2.5 * cm, 2.5 * cm])
        r_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FEF2F2")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#B91C1C")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#FEE2E2")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        sr_tbl = Table([[s_tbl, r_tbl]], colWidths=[8.8 * cm, 8.8 * cm])
        story.append(sr_tbl)

        story.append(Spacer(1, 10))
        story.append(Paragraph(
            f"<b>{shape_ar('التقييم الجوهري والقيمة العادلة') if is_ar else 'INTRINSIC FAIR VALUE'}</b>",
            ParagraphStyle("FVH", fontName=font_bold, fontSize=11, spaceAfter=6)
        ))
        story.append(Paragraph(
            display_text(None),
            ParagraphStyle("FVNA", fontName=font_name, fontSize=9, textColor=colors.HexColor("#64748B"))
        ))

        story.append(PageBreak())

        # ═══════════════════════════════════════════════════════════════
        # PAGE 4: NARRATIVE + KEY RISKS + LEGAL DISCLAIMER
        # ═══════════════════════════════════════════════════════════════
        story.append(get_header_row(f"{symbol} · ملخص التحليل والمخاطر" if is_ar else f"{symbol} · EXECUTIVE SUMMARY"))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceBefore=4, spaceAfter=14))

        story.append(Paragraph(
            f"<b>{shape_ar('ملخص التحليل الفني والقرار (EXECUTIVE SUMMARY)') if is_ar else 'EXECUTIVE ANALYSIS SUMMARY'}</b>",
            ParagraphStyle("SH4", fontName=font_bold, fontSize=14, spaceAfter=8)
        ))

        # 3 Narrative paragraphs
        for p in narrative:
            p_text = shape_ar(p) if is_ar else p
            story.append(Paragraph(p_text, ParagraphStyle("NP", fontName=font_name, fontSize=9.5, leading=13, spaceAfter=8)))

        # Key Risks Box
        risk_lines = "<br/>".join([f"• {shape_ar(r) if is_ar else r}" for r in key_risks])
        risk_box = Table([[
            Paragraph(
                f"<font color='#991B1B'><b>{shape_ar('المخاطر والتحذيرات الرئيسية (KEY RISKS)') if is_ar else 'KEY STRUCTURAL RISKS'}</b></font><br/><br/>"
                f"<font color='#7F1D1D' size=9>{risk_lines}</font>",
                ParagraphStyle("Rsk", fontName=font_name)
            )
        ]], colWidths=[18 * cm])
        risk_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#FCA5A5")),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(Spacer(1, 10))
        story.append(risk_box)
        story.append(Spacer(1, 14))

        # Institutional Disclaimer Block
        disc_text = (
            "هذا التقرير هو نتاج خوارزميات كمية وتحليل فني حتمي قائم على بيانات السوق التاريخية واللحظية، ولا يُعتبر بأي شكل من الأشكال توصية استثمارية أو مشورة مالية مباشرة بشراء أو بيع أي أصل مالي. الاستثمار في الأوراق المالية ينطوي على مخاطر خسارة رأس المال."
            if is_ar else
            "This research document is an automated product of deterministic quantitative algorithms, pattern-recognition engines, and historical market data feeds. It does not constitute investment, financial, or trading advice. Trading in equities, derivatives, and financial instruments involves substantial risk of capital loss."
        )
        disc_box = Table([[
            Paragraph(
                f"<font color='#334155'><b>{shape_ar('إخلاء مسؤولية قانوني ومؤسسي:') if is_ar else 'Institutional Legal Disclaimer:'}</b></font><br/>"
                f"<font color='#64748B' size=8>{shape_ar(disc_text) if is_ar else disc_text}</font>",
                ParagraphStyle("Disc", fontName=font_name)
            )
        ]], colWidths=[18 * cm])
        disc_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(disc_box)

        # Build with NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()


# Aliases for compatibility
PDFReportGenerator = PdfReportGenerator
global_pdf_generator = PdfReportGenerator()
