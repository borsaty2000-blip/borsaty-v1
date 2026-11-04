"""
test_real_fetcher.py — Tests for RealDataFetcher
Verifies yfinance ticker mapping, quote retrieval, history fetching, and indices benchmark.
"""

from unittest.mock import MagicMock, patch
import pytest
from data.real_fetcher import RealDataFetcher


@pytest.fixture
def fetcher():
    return RealDataFetcher(eodhd_api_key="mock_key")


class TestRealDataFetcher:
    def test_map_yfinance_symbol_egx(self, fetcher):
        assert fetcher.map_yfinance_symbol("COMI", "EGX") == "COMI.CA"
        assert fetcher.map_yfinance_symbol("ABUK", "EGX") == "ABUK.CA"

    def test_map_yfinance_symbol_tasi(self, fetcher):
        assert fetcher.map_yfinance_symbol("2222", "TASI") == "2222.SR"
        assert fetcher.map_yfinance_symbol("1120", "TASI") == "1120.SR"

    def test_map_yfinance_symbol_us(self, fetcher):
        assert fetcher.map_yfinance_symbol("AAPL", "US") == "AAPL"
        assert fetcher.map_yfinance_symbol("MSFT", "NASDAQ") == "MSFT"

    @patch("data.real_fetcher.requests.post")
    def test_fetch_tradingview_quote_includes_52w_range(self, mock_post, fetcher):
        response = MagicMock()
        response.status_code = 200
        response.text = '{"data":[{"d":[331.9,-1.89,-6.42,63159216,351.73,243.42]}]}'
        response.json.return_value = {
            "data": [{"d": [331.9, -1.89, -6.42, 63159216, 351.73, 243.42]}
            ]
        }
        mock_post.return_value = response

        quote = fetcher._fetch_tradingview_scanner("AAPL", "US")

        assert quote is not None
        assert quote["price"] == 331.9
        assert quote["high_52w"] == 351.73
        assert quote["low_52w"] == 243.42
        assert mock_post.call_args.kwargs["json"]["symbols"]["tickers"] == ["NASDAQ:AAPL"]
        assert mock_post.call_args.kwargs["json"]["columns"][-2:] == [
            "price_52_week_high",
            "price_52_week_low",
        ]

    @patch.object(RealDataFetcher, "_fetch_eodhd")
    @patch.object(RealDataFetcher, "_fetch_tradingview_scanner")
    @patch.object(RealDataFetcher, "_fetch_yfinance")
    def test_fetch_quote_rejects_price_outside_provider_range(
        self, mock_yfinance, mock_tradingview, mock_eodhd, fetcher
    ):
        mock_yfinance.return_value = {
            "symbol": "AAPL",
            "price": 400.0,
            "high_52w": 351.73,
            "low_52w": 243.42,
            "source": "yfinance",
        }
        mock_tradingview.return_value = {
            "symbol": "AAPL",
            "price": 331.9,
            "high_52w": 351.73,
            "low_52w": 243.42,
            "source": "tradingview_scanner",
        }

        quote = fetcher.fetch_quote("AAPL", "US")

        assert quote["source"] == "tradingview_scanner"
        mock_eodhd.assert_not_called()

    def test_fetch_quote_fallback_graceful(self, fetcher):
        # Even if network is blocked or ticker invalid, must not raise and return valid dict
        quote = fetcher.fetch_quote("INVALID_TICKER_XYZ", "EGX")
        assert isinstance(quote, dict)
        assert "price" in quote
        assert "symbol" in quote
        assert quote["price"] > 0

    @patch("yfinance.Ticker")
    def test_fetch_quote_mocked_yfinance(self, mock_ticker_cls, fetcher):
        mock_ticker = MagicMock()
        mock_fast = MagicMock()
        mock_fast.last_price = 88.5
        mock_fast.previous_close = 86.0
        mock_fast.last_volume = 1500000.0
        mock_ticker.fast_info = mock_fast
        mock_ticker_cls.return_value = mock_ticker

        quote = fetcher.fetch_quote("COMI", "EGX")
        assert quote["price"] == 88.5
        assert quote["change"] == 2.5
        assert quote["source"] == "yfinance"

    def test_fetch_indices_structure(self, fetcher):
        indices = fetcher.fetch_indices()
        assert isinstance(indices, list)
        assert len(indices) == 6
        symbols = [idx["symbol"] for idx in indices]
        assert "EGX30" in symbols
        assert "TASI" in symbols
        assert "SPX" in symbols
        assert "BTCUSD" in symbols

    def test_fetch_history_fallback_not_empty(self, fetcher):
        # Should gracefully return valid candle list from fallback
        candles = fetcher.fetch_history("COMI", "EGX")
        assert isinstance(candles, list)
        assert len(candles) >= 5
        assert "close" in candles[0]
