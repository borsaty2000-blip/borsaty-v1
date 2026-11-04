"""Parallel RSS news collection, normalization, sentiment, and caching."""

from __future__ import annotations

import hashlib
import html
import json
import logging
import os
import re
import threading
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import quote, urlencode

import requests

logger = logging.getLogger("borsaty.news")

CACHE_TTL_SECONDS = 15 * 60
MAX_ARTICLE_LIMIT = 100


@dataclass(frozen=True)
class RSSSource:
    name: str
    url: str
    language: str


def _google_news(query: str, language: str, region: str) -> str:
    return "https://news.google.com/rss/search?" + urlencode({
        "q": query,
        "hl": language,
        "gl": region,
        "ceid": f"{region}:{language}",
    })


RSS_SOURCES: Tuple[RSSSource, ...] = (
    RSSSource("Enterprise Egypt", "https://enterprise.news/feed", "en"),
    RSSSource("Argaam", "https://www.argaam.com/ar/rss", "ar"),
    RSSSource("Al Borsa", "https://www.alborsanews.com/feed/", "ar"),
    RSSSource("Mubasher", "https://www.mubasher.info/rss", "ar"),
    RSSSource("Yahoo Finance", "https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US", "en"),
    RSSSource("Zawya", "https://www.zawya.com/en/rss", "en"),
    RSSSource("Google News Egypt", _google_news("Egypt stocks business", "en-US", "EG"), "en"),
    RSSSource("Google News Egypt Arabic", _google_news("أخبار اقتصاد وأسهم مصر", "ar", "EG"), "ar"),
    RSSSource("Google News Saudi", _google_news("Saudi stocks business", "en-US", "SA"), "en"),
    RSSSource("Google News Saudi Arabic", _google_news("أخبار الأسهم السعودية", "ar", "SA"), "ar"),
    RSSSource("Google News US", _google_news("US stock market finance", "en-US", "US"), "en"),
    RSSSource("Google News Crypto", _google_news("cryptocurrency markets", "en-US", "US"), "en"),
    RSSSource("Google News Forex and commodities", _google_news("forex commodities markets", "en-US", "US"), "en"),
)

CATEGORY_KEYWORDS: Dict[str, Tuple[str, ...]] = {
    "EGX": ("egypt", "egyptian", "cairo", "egx", "مصر", "المصري", "القاهرة", "البورصة المصرية"),
    "TASI": ("saudi", "saudi arabia", "riyadh", "tadawul", "tasi", "السعودية", "سعودي", "تداول", "الرياض"),
    "US": ("united states", "u.s.", "us stocks", "wall street", "nasdaq", "s&p 500", "dow jones", "federal reserve"),
    "crypto": ("crypto", "bitcoin", "ethereum", "blockchain", "cryptocurrency", "بتكوين", "بيتكوين", "عملات رقمية"),
    "forex": ("forex", "currency", "currencies", "exchange rate", "fx market", "فوركس", "العملات", "سعر الصرف"),
    "commodities": ("commodit", "gold", "silver", "oil", "crude", "copper", "natural gas", "الذهب", "النفط", "السلع"),
}

POSITIVE_KEYWORDS = (
    "surge", "jump", "beat", "record", "growth", "rise", "gain", "profit", "strong",
    "زيادة", "ربح", "نمو", "ارتفاع", "مكاسب", "قياسي", "قوي", "تجاوز",
)
NEGATIVE_KEYWORDS = (
    "plunge", "fall", "miss", "loss", "decline", "drop", "weak", "cut", "crash",
    "خسارة", "انخفاض", "تراجع", "هبوط", "ضعف", "تخفيض",
)

STOCK_ALIASES: Dict[str, Tuple[str, ...]] = {
    "COMI": ("commercial international bank", "cib egypt", "البنك التجاري الدولي", "التجاري الدولي"),
    "SWDY": ("elsewedy electric", "السويدي إليكتريك", "السويدي للكابلات"),
    "TMGH": ("talaat mostafa", "طلعت مصطفى", "مجموعة طلعت مصطفى"),
    "FWRY": ("fawry", "فوري"),
    "EAST": ("eastern company", "الشرقية للدخان"),
    "2222": ("saudi aramco", "أرامكو السعودية"),
    "1120": ("al rajhi bank", "مصرف الراجحي"),
}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


class NewsEngine:
    """Fetches real articles from public RSS feeds; never synthesizes article content."""

    def __init__(
        self,
        http_get: Optional[Callable[..., Any]] = None,
        cache_ttl_seconds: int = CACHE_TTL_SECONDS,
    ) -> None:
        self._http_get = http_get or requests.get
        self._cache_ttl_seconds = max(CACHE_TTL_SECONDS, cache_ttl_seconds)
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._cache_lock = threading.Lock()

    @staticmethod
    def _clean_text(value: Optional[str]) -> str:
        if not value:
            return ""
        extractor = _TextExtractor()
        extractor.feed(html.unescape(value))
        text = " ".join(extractor.parts)
        if re.search(r"[\u0080-\u009f]", text) and re.search(r"[\u00c0-\u00ff]", text):
            try:
                text = text.encode("latin-1").decode("utf-8")
            except UnicodeError:
                logger.debug("RSS text contains unrepairable encoding artifacts")
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _local_name(tag: str) -> str:
        return tag.rsplit("}", 1)[-1].split(":")[-1].lower()

    @classmethod
    def _children(cls, element: ET.Element, name: str) -> List[ET.Element]:
        return [child for child in list(element) if cls._local_name(child.tag) == name.lower()]

    @classmethod
    def _child_text(cls, element: ET.Element, name: str) -> Optional[str]:
        children = cls._children(element, name)
        if not children:
            return None
        child = children[0]
        return "".join(child.itertext()).strip() or None

    @staticmethod
    def _parse_date(value: Optional[str]) -> str:
        if value:
            try:
                dt = parsedate_to_datetime(value)
            except (TypeError, ValueError, OverflowError):
                try:
                    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                except (TypeError, ValueError, OverflowError):
                    dt = None
            if dt is not None:
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat()
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _language(text: str, fallback: str = "en") -> str:
        return "ar" if any("\u0600" <= char <= "\u06ff" for char in text) else fallback

    @classmethod
    def analyze_sentiment(cls, title: str, summary: str) -> Dict[str, Any]:
        text = f"{title} {summary}".lower()
        positive = sum(text.count(word) for word in POSITIVE_KEYWORDS)
        negative = sum(text.count(word) for word in NEGATIVE_KEYWORDS)
        total = positive + negative
        score = (positive - negative) / total if total else 0.0
        label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
        return {"label": label, "score": round(max(-1.0, min(1.0, score)), 2)}

    @staticmethod
    def _market_for_text(text: str, symbols: Optional[List[str]] = None) -> str:
        if symbols and any(symbol in {"COMI", "SWDY", "TMGH", "FWRY", "EAST"} for symbol in symbols):
            return "EGX"
        if symbols and any(symbol in {"2222", "1120"} for symbol in symbols):
            return "TASI"
        lowered = text.lower()
        for market, words in CATEGORY_KEYWORDS.items():
            if any(word in lowered for word in words):
                return market
        return "US"

    @classmethod
    def _article_from_element(cls, element: ET.Element, source: RSSSource) -> Optional[Dict[str, Any]]:
        title_raw = cls._child_text(element, "title")
        link = cls._child_text(element, "link")
        if not link:
            for child in cls._children(element, "link"):
                link = child.attrib.get("href")
                if link:
                    break
        title = cls._clean_text(title_raw)
        if not title or not link or not link.startswith(("http://", "https://")):
            return None
        summary = cls._clean_text(
            cls._child_text(element, "description")
            or cls._child_text(element, "summary")
            or cls._child_text(element, "encoded")
            or ""
        )
        pub_date = (
            cls._child_text(element, "pubDate")
            or cls._child_text(element, "published")
            or cls._child_text(element, "updated")
        )
        image_url = None
        for child in element.iter():
            local = cls._local_name(child.tag)
            if local in {"thumbnail", "content"} and child.attrib.get("url"):
                image_url = child.attrib["url"]
                break
        if not image_url:
            for enclosure in cls._children(element, "enclosure"):
                if enclosure.attrib.get("type", "").startswith("image/"):
                    image_url = enclosure.attrib.get("url")
                    break

        publisher = cls._child_text(element, "source")
        source_name = cls._clean_text(publisher) if publisher else source.name
        source_url = source.url
        source_element = next((child for child in cls._children(element, "source") if child.attrib.get("url")), None)
        if source_element is not None:
            source_url = source_element.attrib["url"]

        identifier = hashlib.sha256(f"{link}|{title}".encode("utf-8")).hexdigest()[:16]
        market_text = f"{title} {summary}"
        symbols = sorted({
            symbol for symbol in STOCK_ALIASES
            if re.search(rf"(?<![A-Z0-9]){re.escape(symbol)}(?![A-Z0-9])", market_text.upper())
            or any(alias.lower() in market_text.lower() for alias in STOCK_ALIASES[symbol])
        })
        return {
            "id": identifier,
            "title": title,
            "summary": summary,
            "source": source_name,
            "source_url": source_url,
            "url": link,
            "image_url": image_url,
            "published_at": cls._parse_date(pub_date),
            "language": cls._language(f"{title} {summary}", source.language),
            "sentiment": cls.analyze_sentiment(title, summary),
            "symbols": symbols,
            "market": cls._market_for_text(market_text, symbols),
        }

    def _fetch_source(self, source: RSSSource) -> Tuple[RSSSource, List[Dict[str, Any]], Optional[str]]:
        try:
            response = self._http_get(
                source.url,
                timeout=12,
                headers={"User-Agent": "BorsatyNews/1.0 (+https://borsatyai.com)"},
            )
            response.raise_for_status()
            root = ET.fromstring(response.content)
            elements = [
                node for node in root.iter()
                if self._local_name(node.tag) in {"item", "entry"}
            ]
            articles = [
                article for node in elements
                if (article := self._article_from_element(node, source)) is not None
            ]
            return source, articles, None
        except Exception as exc:
            logger.warning("News RSS source %s failed: %s", source.name, exc)
            return source, [], str(exc)

    @staticmethod
    def _deduplicate(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        articles.sort(key=lambda item: item["published_at"], reverse=True)
        unique: List[Dict[str, Any]] = []
        seen_urls = set()
        for article in articles:
            if article["url"] in seen_urls:
                continue
            title = re.sub(r"[\W_]+", " ", article["title"].lower()).strip()
            if any(SequenceMatcher(None, title, re.sub(r"[\W_]+", " ", item["title"].lower()).strip()).ratio() > 0.9 for item in unique):
                continue
            seen_urls.add(article["url"])
            unique.append(article)
        return unique

    @classmethod
    def _matches_category(cls, article: Dict[str, Any], category: str) -> bool:
        if category == "all":
            return True
        text = f"{article['title']} {article['summary']}".lower()
        keywords = CATEGORY_KEYWORDS.get(category)
        if not keywords:
            return False
        return any(keyword in text for keyword in keywords) or article.get("market") == category

    def _request_sources(self, sources: Tuple[RSSSource, ...]) -> Tuple[List[Dict[str, Any]], List[str], List[str]]:
        articles: List[Dict[str, Any]] = []
        fetched: List[str] = []
        failed: List[str] = []
        with ThreadPoolExecutor(max_workers=min(12, len(sources) or 1)) as executor:
            futures = {executor.submit(self._fetch_source, source): source for source in sources}
            for future in as_completed(futures):
                source, source_articles, error = future.result()
                if error is None:
                    fetched.append(source.name)
                    articles.extend(source_articles)
                else:
                    failed.append(source.name)
        return self._deduplicate(articles), sorted(fetched), sorted(failed)

    def _redis_request(self, command: List[Any]) -> Optional[Any]:
        base_url = os.environ.get("UPSTASH_REDIS_REST_URL", "").rstrip("/")
        token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        if not base_url or not token:
            return None
        try:
            response = requests.post(
                f"{base_url}/pipeline",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=[command],
                timeout=3,
            )
            response.raise_for_status()
            result = response.json()
            return result[0].get("result") if result else None
        except Exception as exc:
            logger.warning("News Redis cache request failed: %s", exc)
            return None

    def _cache_get(self, key: str) -> Optional[Dict[str, Any]]:
        cached = self._redis_request(["GET", key])
        if isinstance(cached, str):
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                logger.warning("Ignoring invalid cached news payload for %s", key)
        now = time.time()
        with self._cache_lock:
            local = self._cache.get(key)
            if local and local[0] > now:
                return local[1]
            self._cache.pop(key, None)
        return None

    def _cache_set(self, key: str, value: Dict[str, Any]) -> None:
        self._redis_request(["SETEX", key, self._cache_ttl_seconds, json.dumps(value, ensure_ascii=False)])
        with self._cache_lock:
            self._cache[key] = (time.time() + self._cache_ttl_seconds, value)

    def _fetch_market_payload(self, category: str, limit: int) -> Dict[str, Any]:
        articles, fetched, failed = self._request_sources(RSS_SOURCES)
        filtered = [article for article in articles if self._matches_category(article, category)]
        for article in filtered:
            article["market"] = category if category != "all" else article["market"]
        data_quality: Dict[str, Any] = {
            "sources_fetched": fetched,
            "sources_failed": failed,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
        if not fetched:
            data_quality["error"] = "All RSS sources failed"
        return {"market": category, "articles": filtered[:limit], "count": min(len(filtered), limit), "data_quality": data_quality}

    @staticmethod
    def _normalize_category(category: str) -> str:
        normalized = category.strip().lower()
        aliases = {
            "egypt": "EGX",
            "egx": "EGX",
            "saudi": "TASI",
            "tasi": "TASI",
            "us": "US",
            "crypto": "crypto",
            "forex": "forex",
            "commodities": "commodities",
            "all": "all",
        }
        return aliases.get(normalized, "all")

    def get_market_news(self, category: str = "all", limit: int = 20) -> Dict[str, Any]:
        normalized_category = self._normalize_category(category)
        bounded_limit = max(1, min(int(limit), MAX_ARTICLE_LIMIT))
        key = f"news:market:{normalized_category}"
        cached = self._cache_get(key)
        if cached is not None:
            payload = dict(cached)
            payload["articles"] = payload["articles"][:bounded_limit]
            payload["count"] = len(payload["articles"])
            return payload
        payload = self._fetch_market_payload(normalized_category, MAX_ARTICLE_LIMIT)
        self._cache_set(key, payload)
        payload = dict(payload)
        payload["articles"] = payload["articles"][:bounded_limit]
        payload["count"] = len(payload["articles"])
        return payload

    def fetch_market_news(self, category: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
        """Return deduplicated market articles, newest first."""
        return self.get_market_news(category, limit)["articles"]

    @staticmethod
    def _stock_market(market: str) -> str:
        normalized = market.strip().upper()
        return {"EGX": "EGX", "TASI": "TASI", "US": "US"}.get(normalized, "all")

    def _fetch_stock_payload(self, symbol: str, market: str, limit: int) -> Dict[str, Any]:
        sym = symbol.strip().upper()
        news_market = self._stock_market(market)
        market_payload = self.get_market_news(news_market, MAX_ARTICLE_LIMIT)
        aliases = (sym, *STOCK_ALIASES.get(sym, ()))
        matched = [
            article for article in market_payload["articles"]
            if any(alias.lower() in f"{article['title']} {article['summary']}".lower() for alias in aliases)
        ]
        direct_source = RSSSource(
            "Yahoo Finance",
            "https://feeds.finance.yahoo.com/rss/2.0/headline?" + urlencode({
                "s": sym,
                "region": "US",
                "lang": "en-US",
            }),
            "en",
        )
        direct_articles, fetched, failed = self._request_sources((direct_source,))
        matched.extend(direct_articles)
        merged = self._deduplicate(matched)
        for article in merged:
            article["symbols"] = sorted(set(article.get("symbols", [])) | {sym})
            if not article["symbols"]:
                article["symbols"] = [sym]
        quality = dict(market_payload["data_quality"])
        quality["sources_fetched"] = sorted(set(quality.get("sources_fetched", [])) | set(fetched))
        quality["sources_failed"] = sorted(
            (set(quality.get("sources_failed", [])) | set(failed))
            - set(quality["sources_fetched"])
        )
        if not quality["sources_fetched"]:
            quality["error"] = "All RSS sources failed"
        return {"market": market, "symbol": sym, "articles": merged[:limit], "count": min(len(merged), limit), "data_quality": quality}

    def get_stock_news(self, symbol: str, market: str = "US", limit: int = 10) -> Dict[str, Any]:
        sym = symbol.strip().upper()
        normalized_market = market.strip().upper()
        bounded_limit = max(1, min(int(limit), MAX_ARTICLE_LIMIT))
        key = f"news:stock:{sym}"
        cached = self._cache_get(key)
        if cached is not None:
            payload = dict(cached)
            payload["articles"] = payload["articles"][:bounded_limit]
            payload["count"] = len(payload["articles"])
            return payload
        payload = self._fetch_stock_payload(sym, normalized_market, MAX_ARTICLE_LIMIT)
        self._cache_set(key, payload)
        payload = dict(payload)
        payload["articles"] = payload["articles"][:bounded_limit]
        payload["count"] = len(payload["articles"])
        return payload

    def fetch_stock_news(self, symbol: str, market: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Return market and direct-symbol RSS results matching a stock."""
        return self.get_stock_news(symbol, market, limit)["articles"]

    def fetch_article_details(self, url: str) -> Dict[str, Any]:
        """Return full fields already published by RSS, without scraping publisher sites."""
        for key in list(self._cache):
            payload = self._cache_get(key)
            if payload:
                for article in payload.get("articles", []):
                    if article.get("url") == url:
                        return {**article, "available": True}
        return {"url": url, "available": False}


global_news_engine = NewsEngine()
