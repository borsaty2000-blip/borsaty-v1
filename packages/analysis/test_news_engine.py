"""Tests for the RSS news engine and its FastAPI endpoints."""

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from main import app
from news.news_engine import NewsEngine, RSSSource


class FakeResponse:
    def __init__(self, content):
        self.content = content

    def raise_for_status(self):
        return None


@pytest.fixture
def rss_xml():
    return b"""<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel><item>
    <title>COMI reports record growth and strong profit</title>
    <description><![CDATA[Commercial International Bank announces growth]]></description>
    <link>https://example.test/comi-story</link>
    <pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate>
    <source url="https://example.test">Example Finance</source>
    <enclosure url="https://example.test/image.jpg" type="image/jpeg"/>
    </item></channel></rss>"""


def test_positive_sentiment_score_is_bounded():
    result = NewsEngine.analyze_sentiment("Record growth and profit surge", "")
    assert result == {"label": "positive", "score": 1.0}


def test_negative_sentiment_supports_arabic():
    result = NewsEngine.analyze_sentiment("خسارة وانخفاض", "الأسعار تراجعت")
    assert result["label"] == "negative"
    assert result["score"] == -1.0


def test_neutral_sentiment_is_default():
    assert NewsEngine.analyze_sentiment("Company issues quarterly update", "") == {
        "label": "neutral",
        "score": 0.0,
    }


def test_clean_text_repairs_misdecoded_arabic():
    arabic = "\u0627\u0644\u0628\u0648\u0631\u0635\u0629 \u0627\u0644\u0645\u0635\u0631\u064a\u0629"
    mojibake = arabic.encode("utf-8").decode("latin-1")
    assert NewsEngine._clean_text(mojibake) == arabic


def test_rss_article_parsing_normalizes_fields_and_detects_symbols(rss_xml):
    source = RSSSource("Example Feed", "https://example.test/feed", "en")
    engine = NewsEngine(http_get=lambda *_args, **_kwargs: FakeResponse(rss_xml))
    parsed_source, articles, error = engine._fetch_source(source)
    assert parsed_source == source
    assert error is None
    assert len(articles) == 1
    article = articles[0]
    assert article["title"] == "COMI reports record growth and strong profit"
    assert article["source"] == "Example Finance"
    assert article["source_url"] == "https://example.test"
    assert article["image_url"] == "https://example.test/image.jpg"
    assert article["symbols"] == ["COMI"]
    assert article["language"] == "en"
    assert article["sentiment"]["label"] == "positive"
    assert datetime.fromisoformat(article["published_at"]).tzinfo == timezone.utc


def test_articles_are_deduplicated_by_url_and_similar_title():
    base = {
        "published_at": "2026-11-04T10:00:00+00:00",
        "url": "https://example.test/1",
        "title": "Market shares show record growth after earnings",
    }
    duplicate_url = {**base, "title": "A different story, same URL"}
    similar_title = {
        **base,
        "url": "https://example.test/2",
        "title": "Market shares show record growth after earnings!",
    }
    assert NewsEngine._deduplicate([base, duplicate_url, similar_title]) == [base]


def test_market_category_filters_relevant_titles(monkeypatch, rss_xml):
    source = RSSSource("Example Feed", "https://example.test/feed", "en")
    engine = NewsEngine(http_get=lambda *_args, **_kwargs: FakeResponse(rss_xml))
    monkeypatch.setattr("news.news_engine.RSS_SOURCES", (source,))
    result = engine.get_market_news("EGX", 20)
    assert result["market"] == "EGX"
    assert result["count"] == 1
    assert result["articles"][0]["market"] == "EGX"
    assert result["data_quality"]["sources_fetched"] == ["Example Feed"]


def test_market_news_limit_is_applied_and_cache_is_reused(monkeypatch):
    engine = NewsEngine()
    payload = {
        "market": "all",
        "articles": [{"id": str(index)} for index in range(4)],
        "count": 4,
        "data_quality": {"sources_fetched": ["Feed"], "sources_failed": []},
    }
    fetches = []

    def fetch(_category, _limit):
        fetches.append(True)
        return payload

    monkeypatch.setattr(engine, "_fetch_market_payload", fetch)
    assert engine.get_market_news(limit=2)["count"] == 2
    assert engine.get_market_news(limit=3)["count"] == 3
    assert len(fetches) == 1


def test_stock_news_filters_market_and_direct_symbol_results(monkeypatch, rss_xml):
    source = RSSSource("Yahoo Finance", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=COMI", "en")
    calls = []

    def get(url, **_kwargs):
        calls.append(url)
        return FakeResponse(rss_xml)

    engine = NewsEngine(http_get=get)
    monkeypatch.setattr("news.news_engine.RSS_SOURCES", (source,))
    articles = engine.fetch_stock_news("COMI", "EGX", limit=10)
    assert len(articles) == 1
    assert articles[0]["symbols"] == ["COMI"]
    assert any("s=COMI" in call for call in calls)


def test_all_sources_failed_returns_empty_payload_with_error(monkeypatch):
    engine = NewsEngine(http_get=lambda *_args, **_kwargs: (_ for _ in ()).throw(OSError("offline")))
    monkeypatch.setattr("news.news_engine.RSS_SOURCES", (RSSSource("Offline", "https://example.test", "en"),))
    result = engine.get_market_news()
    assert result["articles"] == []
    assert result["count"] == 0
    assert result["data_quality"]["error"] == "All RSS sources failed"
    assert result["data_quality"]["sources_failed"] == ["Offline"]


def test_fetch_article_details_uses_cached_rss_article(rss_xml):
    engine = NewsEngine(http_get=lambda *_args, **_kwargs: FakeResponse(rss_xml))
    articles, fetched, failed = engine._request_sources((RSSSource("Example Feed", "https://example.test/feed", "en"),))
    payload = {
        "articles": articles,
        "data_quality": {"sources_fetched": fetched, "sources_failed": failed},
    }
    engine._cache["news:market:all"] = (9999999999, payload)
    details = engine.fetch_article_details("https://example.test/comi-story")
    assert details["available"] is True
    assert details["title"] == "COMI reports record growth and strong profit"


def test_fastapi_news_routes_return_expected_envelopes(monkeypatch):
    class StubNewsEngine:
        def get_market_news(self, category="all", limit=20):
            return {"market": category, "articles": [], "count": 0, "data_quality": {"sources_fetched": []}}

        def get_stock_news(self, symbol, market="US", limit=10):
            return {"market": market, "symbol": symbol.upper(), "articles": [], "count": 0, "data_quality": {"sources_fetched": []}}

    monkeypatch.setattr("main.global_news_engine", StubNewsEngine())
    client = TestClient(app)
    market_result = client.get("/news/market?category=EGX&limit=5")
    stock_result = client.get("/news/COMI?market=EGX&limit=5")
    assert market_result.status_code == 200
    assert market_result.json()["market"] == "EGX"
    assert stock_result.status_code == 200
    assert stock_result.json()["symbol"] == "COMI"
