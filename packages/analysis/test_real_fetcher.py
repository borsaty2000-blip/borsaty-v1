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
