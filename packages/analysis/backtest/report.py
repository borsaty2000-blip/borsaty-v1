"""
BacktestReport — Dual-Language Statistical Narrative (Borsaty Phase ح)
Version 1.0.0

Generates deterministic Arabic and English reports from BacktestResult
and WalkForwardResult. Follows the same zero-hallucination contract as
the Narrator Engine (Phase ز): numbers only from payload.
"""

from __future__ import annotations

from typing import Optional, Tuple, List, Dict, Any, Union

from backtest.engine import BacktestResult
from backtest.walk_forward import WalkForwardResult


DISCLAIMER_AR = (
    "هذا التحليل تعليمي وكمي بحت، ولا يُعتبر توصية استثمارية مباشرة بالبيع أو الشراء. "
    "الأداء التاريخي لا يضمن نتائج مستقبلية. القرارات الاستثمارية هي مسؤولية المستخدم بالكامل."
)

DISCLAIMER_EN = (
    "This analysis is strictly educational and quantitative in nature, and does not constitute "
    "financial or investment advice. Past performance does not guarantee future results. "
    "All trading decisions remain the sole responsibility of the user."
)


class BacktestReport:
    """
    Generates human-readable Arabic + English statistical reports
    from a BacktestResult and optional WalkForwardResult.

    Zero-hallucination: every number in the report comes from the
    payload — no invented figures, no approximated statistics.
    """

    VERSION = "1.0.0"

    def generate(
        self,
        backtest: BacktestResult,
        walk_forward: Optional[WalkForwardResult] = None,
        language: str = "ar",
    ) -> str:
        """
        Generate a statistical narrative report.

        Parameters
        ----------
        backtest     : BacktestResult from BacktestEngine.run()
        walk_forward : WalkForwardResult (optional)
        language     : "ar" or "en"

        Returns
        -------
        Human-readable report string.
        """
        lang = language.lower().strip()
        if lang not in ("ar", "en"):
            lang = "ar"

        if lang == "ar":
            return self._generate_ar(backtest, walk_forward)
        return self._generate_en(backtest, walk_forward)

    # ------------------------------------------------------------------
    # Arabic report
    # ------------------------------------------------------------------

    def _generate_ar(
        self,
        bt: BacktestResult,
        wf: Optional[WalkForwardResult],
    ) -> str:
        m = bt.metrics
        dq = bt.data_quality
        sym = bt.symbol
        tf = bt.timeframe
        n_signals = bt.total_signals

        # ── Header ─────────────────────────────────────────────────────
        lines = [
            f"═══════════════════════════════════════════════════",
            f"تقرير الاختبار التاريخي — {sym} ({tf})",
            f"الفترة: {bt.date_range.get('from', '—')} إلى {bt.date_range.get('to', '—')}",
            f"إجمالي الشموع المحللة: {bt.total_bars}",
            f"═══════════════════════════════════════════════════",
            "",
        ]

        # ── Insufficient data guard ─────────────────────────────────────
        if n_signals < 30 or not dq.get("sample_size_adequate"):
            lines += [
                "⚠️  بيانات غير كافية",
                f"   عدد الإشارات المولّدة: {n_signals} (الحد الأدنى المطلوب: 30)",
                "   لا يمكن نشر معدل النجاح لعدم كفاية البيانات.",
                "",
                DISCLAIMER_AR,
            ]
            return "\n".join(lines)

        # ── Main narrative ──────────────────────────────────────────────
        hr_t1_pct = round(m.hit_rate_t1 * 100, 1)
        hr_t2_pct = round(m.hit_rate_t2 * 100, 1)
        ci_lo_pct = round(m.wilson_ci_95_t1[0] * 100, 1)
        ci_hi_pct = round(m.wilson_ci_95_t1[1] * 100, 1)
        stopped_pct = round(m.stopped_rate * 100, 1)
        expired_pct = round(m.expired_rate * 100, 1)

        lines.append(
            f"على مدار {bt.total_bars} شمعة من البيانات التاريخية، ولّد المحرك "
            f"{n_signals} إشارة قابلة للتنفيذ."
        )
        lines.append("")
        lines.append("📊 مقاييس الأداء الرئيسية:")
        lines.append(
            f"   • نسبة النجاح للهدف الأول: {hr_t1_pct}% "
            f"(فاصل ثقة 95%: {ci_lo_pct}% — {ci_hi_pct}%)"
        )
        lines.append(f"   • نسبة النجاح للهدف الثاني: {hr_t2_pct}%")
        lines.append(f"   • نسبة الوقف: {stopped_pct}%")
        lines.append(f"   • نسبة الانتهاء بلا قرار: {expired_pct}%")
        lines.append(f"   • متوسط عائد المخاطرة: {m.avg_r_multiple}×")
        lines.append(f"   • معامل الربح: {m.profit_factor}")
        lines.append(f"   • نسبة شارب: {m.sharpe_ratio}")
        lines.append(f"   • العائد المتوقع لكل صفقة: {m.expectancy_per_trade}×")
        lines.append(f"   • الحد الأقصى للتراجع: {m.max_drawdown_pct}%")
        lines.append("")

        # ── Regime breakdown ────────────────────────────────────────────
        if m.by_regime:
            lines.append("📈 الأداء حسب بيئة السوق:")
            for regime_name, rd in m.by_regime.items():
                count = rd.get("count", 0)
                hr = round(rd.get("hit_rate_t1", 0.0) * 100, 1)
                ci = rd.get("ci", [0.0, 1.0])
                regime_label = _regime_label_ar(regime_name)

                if not rd.get("sample_adequate", False):
                    lines.append(
                        f"   • {regime_label}: {count} صفقة — "
                        f"بيانات غير كافية للحكم"
                    )
                else:
                    lines.append(
                        f"   • {regime_label}: {hr}% نجاح "
                        f"({count} صفقة | CI: {round(ci[0]*100,1)}%–{round(ci[1]*100,1)}%)"
                    )
            lines.append("")

        # ── Walk-forward summary ─────────────────────────────────────────
        if wf and wf.verdict != "insufficient_data":
            lines.append("🔄 التحقق المتدحرج (Walk-Forward):")
            lines.append(f"   {wf.message_ar}")
            ov = wf.overall
            lines.append(
                f"   • متوسط نسبة النجاح عبر النوافذ: "
                f"{round(ov.get('hit_rate_mean',0)*100,1)}%"
            )
            lines.append(
                f"   • كفاءة الاختبار الخارجي (WF Efficiency): "
                f"{round(ov.get('walk_forward_efficiency',0)*100,1)}%"
            )
            lines.append(f"   • الحكم: {_verdict_label_ar(wf.verdict)}")
            lines.append("")
        elif wf and wf.verdict == "insufficient_data":
            lines.append("🔄 التحقق المتدحرج: بيانات غير كافية للتحليل.")
            lines.append("")

        # ── Disclaimer ──────────────────────────────────────────────────
        lines.append("─" * 51)
        lines.append(DISCLAIMER_AR)

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # English report
    # ------------------------------------------------------------------

    def _generate_en(
        self,
        bt: BacktestResult,
        wf: Optional[WalkForwardResult],
    ) -> str:
        m = bt.metrics
        dq = bt.data_quality
        sym = bt.symbol
        tf = bt.timeframe
        n_signals = bt.total_signals

        lines = [
            f"═══════════════════════════════════════════════════",
            f"Backtest Report — {sym} ({tf})",
            f"Period: {bt.date_range.get('from', '—')} to {bt.date_range.get('to', '—')}",
            f"Total bars analysed: {bt.total_bars}",
            f"═══════════════════════════════════════════════════",
            "",
        ]

        # ── Insufficient data guard ─────────────────────────────────────
        if n_signals < 30 or not dq.get("sample_size_adequate"):
            lines += [
                "⚠️  Insufficient Data",
                f"   Signals generated: {n_signals} (minimum required: 30)",
                "   Hit rate not published — insufficient sample size.",
                "",
                DISCLAIMER_EN,
            ]
            return "\n".join(lines)

        hr_t1_pct = round(m.hit_rate_t1 * 100, 1)
        hr_t2_pct = round(m.hit_rate_t2 * 100, 1)
        ci_lo_pct = round(m.wilson_ci_95_t1[0] * 100, 1)
        ci_hi_pct = round(m.wilson_ci_95_t1[1] * 100, 1)
        stopped_pct = round(m.stopped_rate * 100, 1)
        expired_pct = round(m.expired_rate * 100, 1)

        lines.append(
            f"Over {bt.total_bars} historical bars, the engine generated "
            f"{n_signals} actionable signals."
        )
        lines.append("")
        lines.append("📊 Key Performance Metrics:")
        lines.append(
            f"   • Target 1 Hit Rate: {hr_t1_pct}% "
            f"(95% CI: {ci_lo_pct}% — {ci_hi_pct}%)"
        )
        lines.append(f"   • Target 2 Hit Rate: {hr_t2_pct}%")
        lines.append(f"   • Stop-Out Rate: {stopped_pct}%")
        lines.append(f"   • Expired Rate: {expired_pct}%")
        lines.append(f"   • Average R-Multiple: {m.avg_r_multiple}×")
        lines.append(f"   • Profit Factor: {m.profit_factor}")
        lines.append(f"   • Sharpe Ratio: {m.sharpe_ratio}")
        lines.append(f"   • Expectancy per Trade: {m.expectancy_per_trade}×")
        lines.append(f"   • Maximum Drawdown: {m.max_drawdown_pct}%")
        lines.append("")

        # ── Regime breakdown ────────────────────────────────────────────
        if m.by_regime:
            lines.append("📈 Performance by Market Regime:")
            for regime_name, rd in m.by_regime.items():
                count = rd.get("count", 0)
                hr = round(rd.get("hit_rate_t1", 0.0) * 100, 1)
                ci = rd.get("ci", [0.0, 1.0])
                label = _regime_label_en(regime_name)

                if not rd.get("sample_adequate", False):
                    lines.append(
                        f"   • {label}: {count} trades — "
                        f"insufficient sample size"
                    )
                else:
                    lines.append(
                        f"   • {label}: {hr}% hit rate "
                        f"({count} trades | CI: {round(ci[0]*100,1)}%–{round(ci[1]*100,1)}%)"
                    )
            lines.append("")

        # ── Walk-forward summary ─────────────────────────────────────────
        if wf and wf.verdict != "insufficient_data":
            lines.append("🔄 Walk-Forward Validation:")
            lines.append(f"   {wf.message_en}")
            ov = wf.overall
            lines.append(
                f"   • Cross-window mean hit rate: "
                f"{round(ov.get('hit_rate_mean',0)*100,1)}%"
            )
            lines.append(
                f"   • Walk-Forward Efficiency: "
                f"{round(ov.get('walk_forward_efficiency',0)*100,1)}%"
            )
            lines.append(f"   • Verdict: {wf.verdict.upper()}")
            lines.append("")
        elif wf and wf.verdict == "insufficient_data":
            lines.append("🔄 Walk-Forward Validation: Insufficient data for analysis.")
            lines.append("")

        # ── Disclaimer ──────────────────────────────────────────────────
        lines.append("─" * 51)
        lines.append(DISCLAIMER_EN)

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Label helpers
# ---------------------------------------------------------------------------


def _regime_label_ar(name: str) -> str:
    labels = {
        "trending_strong": "اتجاه قوي",
        "trending_weak": "اتجاه ضعيف",
        "ranging": "سوق عرضي",
        "volatile_expansion": "توسع متذبذب",
        "volatile_contraction": "انكماش متذبذب",
        "breakout": "اختراق",
        "mean_reversion": "عودة للمتوسط",
    }
    return labels.get(name, name.replace("_", " "))


def _regime_label_en(name: str) -> str:
    labels = {
        "trending_strong": "Strong Trend",
        "trending_weak": "Weak Trend",
        "ranging": "Ranging Market",
        "volatile_expansion": "Volatile Expansion",
        "volatile_contraction": "Volatile Contraction",
        "breakout": "Breakout",
        "mean_reversion": "Mean Reversion",
    }
    return labels.get(name, name.replace("_", " ").title())


def _verdict_label_ar(verdict: str) -> str:
    return {"stable": "مستقر ✅", "unstable": "غير مستقر ⚠️"}.get(verdict, verdict)
