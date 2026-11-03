import io
import time
import pytest
from pypdf import PdfReader
from reports.pdf_generator import PdfReportGenerator, global_pdf_generator

SAMPLE_DECISION = {
    "action": "BUY",
    "strength": "STRONG",
    "confidence": 0.88,
    "horizon": "SWING",
    "entry_low": 85.0,
    "entry_high": 87.5,
    "stop_loss": 81.2,
    "tp1": 94.0,
    "tp2": 102.5,
    "risk_reward": 2.35,
    "confluence_score": 88,
    "rsi": 44.5,
    "macd_signal": "BULLISH_CROSS",
    "adx_trend": "STRONG_TREND (32.4)",
    "support": 82.0,
    "resistance": 96.0,
    "risk_grade": "A",
    "summary_bullets": [
        "اختراق نموذج فني إيجابي مدعوم بحجم تداول مؤسسي",
        "مؤشرات الزخم تؤكد استمرار الاتجاه الصاعد نحو الأهداف المعلنة",
        "نسبة العائد إلى المخاطرة تفوق 2.3 مع نقطة وقف خسارة صارمة",
    ],
}

def test_arabic_pdf_generation():
    generator = PdfReportGenerator()
    start_time = time.time()
    pdf_bytes = generator.generate(
        symbol="COMI",
        company_name="البنك التجاري الدولي",
        current_price=86.5,
        currency="EGP",
        decision_data=SAMPLE_DECISION,
        market="EGX",
        lang="ar",
    )
    elapsed = time.time() - start_time

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    
    # Check page count is exactly 4
    reader = PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) == 4, f"Expected 4 pages, got {len(reader.pages)}"
    
    # Check size < 500KB
    size_kb = len(pdf_bytes) / 1024
    assert size_kb < 500, f"Expected size < 500KB, got {size_kb:.2f}KB"
    
    # Check generation time < 3.0s
    assert elapsed < 3.0, f"Expected time < 3.0s, got {elapsed:.2f}s"

def test_english_pdf_generation():
    generator = PdfReportGenerator()
    start_time = time.time()
    pdf_bytes = generator.generate(
        symbol="AAPL",
        company_name="Apple Inc.",
        current_price=234.5,
        currency="USD",
        decision_data={
            "action": "BUY",
            "strength": "MODERATE",
            "confidence": 0.82,
            "horizon": "SWING",
            "entry_low": 230.0,
            "entry_high": 235.0,
            "stop_loss": 222.0,
            "tp1": 255.0,
            "tp2": 270.0,
            "risk_reward": 2.1,
            "confluence_score": 82,
            "rsi": 54.0,
            "macd_signal": "BULLISH_CONVERGENCE",
            "adx_trend": "DEVELOPING_TREND (26.8)",
            "support": 225.0,
            "resistance": 260.0,
            "risk_grade": "A-",
            "summary_bullets": [
                "Breakout supported by strong institutional volume",
                "Momentum oscillators confirm continuation to targets",
                "Favorable 2.1+ risk/reward setup with tight invalidation",
            ],
        },
        market="NASDAQ",
        lang="en",
    )
    elapsed = time.time() - start_time

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    
    reader = PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) == 4, f"Expected 4 pages, got {len(reader.pages)}"
    assert len(pdf_bytes) / 1024 < 500
    assert elapsed < 3.0

def test_missing_fields_validation():
    generator = PdfReportGenerator()
    with pytest.raises(ValueError):
        generator.generate(
            symbol="",
            company_name="Invalid Test",
            current_price=10.0,
            decision_data={},
        )
