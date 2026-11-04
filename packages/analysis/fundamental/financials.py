"""
Borsaty Financial Statements & 20 Ratios Engine
Provides 3-year annual and quarterly financial statements:
- Income Statement (Revenue, COGS, Gross Profit, Operating Income, Net Income, EPS, EBITDA)
- Balance Sheet (Total Assets, Total Liabilities, Total Equity, Cash, Total Debt)
- Cash Flow (Operating CF, Investing CF, Financing CF, Free CF)
- 20 Institutional Ratios (Profitability, Liquidity, Leverage, Efficiency, Valuation)
"""

from __future__ import annotations

import logging
import math
import time
from typing import Dict, Any, List, Optional
import requests

logger = logging.getLogger("borsaty.financials")

class FinancialsEngine:
    """
    Institutional Financial Statements and Fundamental Ratios Engine.
    Fetches official timeseries and summary fundamentals with session/crumb management.
    """

    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    def __init__(self):
        self._session: Optional[requests.Session] = None
        self._crumb: Optional[str] = None
        self._crumb_expires_at: float = 0.0

    def _get_authenticated_session(self) -> requests.Session:
        now = time.time()
        if self._session is not None and self._crumb and now < self._crumb_expires_at:
            return self._session

        s = requests.Session()
        s.headers.update({
            "User-Agent": self.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })

        try:
            # 1. Warm cookie pool
            s.get("https://fc.yahoo.com", timeout=6)
            # 2. Acquire crumb
            res = s.get("https://query2.finance.yahoo.com/v1/test/getcrumb", timeout=6)
            if res.status_code == 200 and res.text.strip():
                self._crumb = res.text.strip()
                self._session = s
                self._crumb_expires_at = now + 1800.0  # 30-min cache
                return s
        except Exception as e:
            logger.warning(f"Failed to acquire Yahoo Finance crumb: {e}")

        # Fallback session without crumb
        self._session = s
        return s

    @staticmethod
    def map_symbol(symbol: str, market: Optional[str] = None) -> str:
        """Map standard Borsaty symbol to provider symbol."""
        sym = symbol.upper().strip()
        mkt = (market or "").upper().strip()

        if sym.endswith(".CA") or sym.endswith(".SR"):
            return sym

        if mkt == "EGX" or sym in ("COMI", "SWDY", "ABUK", "FWRY", "EAST", "TMGH", "ETEL"):
            return f"{sym}.CA"
        elif mkt == "TASI" or sym.isdigit() or sym in ("2222", "1120", "2010", "2380"):
            return f"{sym}.SR"

        return sym

    def get_financials(
        self,
        symbol: str,
        period: str = "annual",
        years: int = 3,
        market: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch income statement, balance sheet, cash flow, and 20 financial ratios.
        Period: 'annual' | 'quarterly'
        """
        raw_sym = symbol.upper().strip()
        prov_sym = self.map_symbol(raw_sym, market)
        prefix = "quarterly" if period.lower() == "quarterly" else "annual"

        types_list = [
            # Income
            f"{prefix}TotalRevenue",
            f"{prefix}CostOfRevenue",
            f"{prefix}GrossProfit",
            f"{prefix}OperatingIncome",
            f"{prefix}NetIncome",
            f"{prefix}DilutedEPS",
            f"{prefix}BasicEPS",
            f"{prefix}EBITDA",
            f"{prefix}NormalizedEBITDA",
            f"{prefix}InterestExpense",
            # Balance Sheet
            f"{prefix}TotalAssets",
            f"{prefix}TotalLiabilitiesNetMinorityInterest",
            f"{prefix}StockholdersEquity",
            f"{prefix}CommonStockEquity",
            f"{prefix}CashAndCashEquivalents",
            f"{prefix}CashCashEquivalentsAndShortTermInvestments",
            f"{prefix}TotalDebt",
            f"{prefix}CurrentAssets",
            f"{prefix}CurrentLiabilities",
            f"{prefix}Inventory",
            f"{prefix}AccountsReceivable",
            # Cash Flow
            f"{prefix}OperatingCashFlow",
            f"{prefix}InvestingCashFlow",
            f"{prefix}FinancingCashFlow",
            f"{prefix}FreeCashFlow",
            f"{prefix}CapitalExpenditure",
        ]

        session = self._get_authenticated_session()
        data_points_by_metric: Dict[str, List[Dict[str, Any]]] = {}

        try:
            crumb_param = f"&crumb={self._crumb}" if self._crumb else ""
            t_str = ",".join(types_list)
            # 5-year lookback window
            period1 = 1577836800  # 2020-01-01
            period2 = 1893456000  # 2030-01-01
            url = (
                f"https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/"
                f"{prov_sym}?type={t_str}&period1={period1}&period2={period2}{crumb_param}"
            )

            res = session.get(url, timeout=12)
            if res.status_code == 200:
                payload = res.json()
                results = payload.get("timeseries", {}).get("result", [])
                for item in results:
                    m_type = item.get("meta", {}).get("type", [None])[0]
                    pts = item.get(m_type, [])
                    if m_type and pts:
                        data_points_by_metric[m_type] = pts
            elif res.status_code == 404 and prov_sym != raw_sym:
                # Retry with raw symbol if mapping failed
                url_raw = (
                    f"https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/"
                    f"{raw_sym}?type={t_str}&period1={period1}&period2={period2}{crumb_param}"
                )
                res_raw = session.get(url_raw, timeout=10)
                if res_raw.status_code == 200:
                    payload = res_raw.json()
                    results = payload.get("timeseries", {}).get("result", [])
                    for item in results:
                        m_type = item.get("meta", {}).get("type", [None])[0]
                        pts = item.get(m_type, [])
                        if m_type and pts:
                            data_points_by_metric[m_type] = pts
        except Exception as e:
            logger.warning(f"Error fetching timeseries for {prov_sym}: {e}")

        # Also fetch summary ratios & modules if available
        summary_modules: Dict[str, Any] = {}
        try:
            crumb_param = f"&crumb={self._crumb}" if self._crumb else ""
            mod_url = (
                f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{prov_sym}"
                f"?modules=defaultKeyStatistics,financialData,summaryDetail{crumb_param}"
            )
            mod_res = session.get(mod_url, timeout=8)
            if mod_res.status_code == 200:
                r_arr = mod_res.json().get("quoteSummary", {}).get("result", [])
                if r_arr:
                    summary_modules = r_arr[0]
            elif mod_res.status_code == 404 and prov_sym != raw_sym:
                mod_url_raw = (
                    f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{raw_sym}"
                    f"?modules=defaultKeyStatistics,financialData,summaryDetail{crumb_param}"
                )
                mod_res_raw = session.get(mod_url_raw, timeout=6)
                if mod_res_raw.status_code == 200:
                    r_arr = mod_res_raw.json().get("quoteSummary", {}).get("result", [])
                    if r_arr:
                        summary_modules = r_arr[0]
        except Exception as e:
            logger.debug(f"Summary modules fetch skipped for {prov_sym}: {e}")

        # Check if we have any data
        has_timeseries = len(data_points_by_metric) > 0
        has_summary = len(summary_modules) > 0

        if not has_timeseries and not has_summary:
            return {
                "symbol": raw_sym,
                "period": period,
                "income_statement": [],
                "balance_sheet": [],
                "cash_flow": [],
                "ratios": {},
                "data_quality": {
                    "source": "none",
                    "confidence": "LOW",
                    "is_available": False,
                    "message": "Financial data not available for this stock",
                },
            }

        # Collect unique dates across all metrics
        dates_set = set()
        for pts in data_points_by_metric.values():
            for p in pts:
                d = p.get("asOfDate")
                if d:
                    dates_set.add(d)

        # Sort dates descending (newest first)
        sorted_dates = sorted(list(dates_set), reverse=True)[:years]

        # Helper to extract raw value
        def get_val(m_name: str, d_str: str) -> Optional[float]:
            pts = data_points_by_metric.get(m_name, [])
            for p in pts:
                if p.get("asOfDate") == d_str:
                    rv = p.get("reportedValue", {})
                    if isinstance(rv, dict) and "raw" in rv:
                        val = rv["raw"]
                        return float(val) if val is not None else None
            return None

        income_statement: List[Dict[str, Any]] = []
        balance_sheet: List[Dict[str, Any]] = []
        cash_flow: List[Dict[str, Any]] = []

        for d_str in sorted_dates:
            year_label = d_str[:4] if prefix == "annual" else d_str[:7]

            # 1. Income Statement
            rev = get_val(f"{prefix}TotalRevenue", d_str)
            cogs = get_val(f"{prefix}CostOfRevenue", d_str)
            gp = get_val(f"{prefix}GrossProfit", d_str)
            if gp is None and rev is not None and cogs is not None:
                gp = rev - cogs

            op_inc = get_val(f"{prefix}OperatingIncome", d_str)
            net_inc = get_val(f"{prefix}NetIncome", d_str)
            eps = get_val(f"{prefix}DilutedEPS", d_str) or get_val(f"{prefix}BasicEPS", d_str)
            ebitda = get_val(f"{prefix}EBITDA", d_str) or get_val(f"{prefix}NormalizedEBITDA", d_str)
            if ebitda is None and op_inc is not None:
                ebitda = op_inc

            income_statement.append({
                "year": year_label,
                "as_of_date": d_str,
                "revenue": rev,
                "cogs": cogs,
                "gross_profit": gp,
                "operating_income": op_inc,
                "net_income": net_inc,
                "eps": round(eps, 2) if eps is not None else None,
                "ebitda": ebitda,
            })

            # 2. Balance Sheet
            assets = get_val(f"{prefix}TotalAssets", d_str)
            liab = get_val(f"{prefix}TotalLiabilitiesNetMinorityInterest", d_str)
            equity = get_val(f"{prefix}StockholdersEquity", d_str) or get_val(f"{prefix}CommonStockEquity", d_str)
            if liab is None and assets is not None and equity is not None:
                liab = assets - equity
            if equity is None and assets is not None and liab is not None:
                equity = assets - liab

            cash = (
                get_val(f"{prefix}CashAndCashEquivalents", d_str)
                or get_val(f"{prefix}CashCashEquivalentsAndShortTermInvestments", d_str)
            )
            debt = get_val(f"{prefix}TotalDebt", d_str)

            balance_sheet.append({
                "year": year_label,
                "as_of_date": d_str,
                "total_assets": assets,
                "total_liabilities": liab,
                "total_equity": equity,
                "cash": cash,
                "total_debt": debt,
            })

            # 3. Cash Flow
            op_cf = get_val(f"{prefix}OperatingCashFlow", d_str)
            inv_cf = get_val(f"{prefix}InvestingCashFlow", d_str)
            fin_cf = get_val(f"{prefix}FinancingCashFlow", d_str)
            fcf = get_val(f"{prefix}FreeCashFlow", d_str)
            if fcf is None and op_cf is not None:
                capex = get_val(f"{prefix}CapitalExpenditure", d_str) or 0.0
                fcf = op_cf + capex if capex < 0 else op_cf - capex

            cash_flow.append({
                "year": year_label,
                "as_of_date": d_str,
                "operating_cf": op_cf,
                "investing_cf": inv_cf,
                "financing_cf": fin_cf,
                "free_cf": fcf,
            })

        # Latest year metrics for ratios
        latest_inc = income_statement[0] if income_statement else {}
        latest_bal = balance_sheet[0] if balance_sheet else {}
        latest_cf = cash_flow[0] if cash_flow else {}
        latest_date = sorted_dates[0] if sorted_dates else ""

        l_rev = latest_inc.get("revenue")
        l_cogs = latest_inc.get("cogs")
        l_gp = latest_inc.get("gross_profit")
        l_op = latest_inc.get("operating_income")
        l_ni = latest_inc.get("net_income")
        l_ebitda = latest_inc.get("ebitda")

        l_assets = latest_bal.get("total_assets")
        l_equity = latest_bal.get("total_equity")
        l_cash = latest_bal.get("cash")
        l_debt = latest_bal.get("total_debt")

        l_ca = get_val(f"{prefix}CurrentAssets", latest_date)
        l_cl = get_val(f"{prefix}CurrentLiabilities", latest_date)
        l_inv = get_val(f"{prefix}Inventory", latest_date)
        l_rec = get_val(f"{prefix}AccountsReceivable", latest_date)
        l_int = get_val(f"{prefix}InterestExpense", latest_date)

        # Pull from summary modules
        fin_data = summary_modules.get("financialData", {})
        key_stats = summary_modules.get("defaultKeyStatistics", {})
        sum_detail = summary_modules.get("summaryDetail", {})

        def extract_raw(d: Dict[str, Any], k: str) -> Optional[float]:
            v = d.get(k)
            if isinstance(v, dict):
                return v.get("raw")
            elif isinstance(v, (int, float)):
                return float(v)
            return None

        # ─── 20 Institutional Ratios ──────────────────────────────────────────

        # 1. Profitability (5)
        gross_margin = extract_raw(fin_data, "grossMargins")
        if gross_margin is None and l_gp is not None and l_rev and l_rev > 0:
            gross_margin = l_gp / l_rev

        operating_margin = extract_raw(fin_data, "operatingMargins")
        if operating_margin is None and l_op is not None and l_rev and l_rev > 0:
            operating_margin = l_op / l_rev

        net_margin = extract_raw(fin_data, "profitMargins")
        if net_margin is None and l_ni is not None and l_rev and l_rev > 0:
            net_margin = l_ni / l_rev

        roe = extract_raw(fin_data, "returnOnEquity")
        if roe is None and l_ni is not None and l_equity and l_equity > 0:
            roe = l_ni / l_equity

        roa = extract_raw(fin_data, "returnOnAssets")
        if roa is None and l_ni is not None and l_assets and l_assets > 0:
            roa = l_ni / l_assets

        # 2. Liquidity (2)
        current_ratio = extract_raw(fin_data, "currentRatio")
        if current_ratio is None and l_ca is not None and l_cl and l_cl > 0:
            current_ratio = l_ca / l_cl

        quick_ratio = extract_raw(fin_data, "quickRatio")
        if quick_ratio is None and l_cl and l_cl > 0:
            liquid = (l_cash or 0.0) + (l_rec or 0.0)
            if liquid > 0:
                quick_ratio = liquid / l_cl

        # 3. Leverage / Solvency (3)
        debt_to_equity = extract_raw(fin_data, "debtToEquity")
        if debt_to_equity is not None and debt_to_equity > 10.0:
            # Often returned as percentage (e.g. 71.47 instead of 0.7147)
            debt_to_equity = debt_to_equity / 100.0
        if debt_to_equity is None and l_debt is not None and l_equity and l_equity > 0:
            debt_to_equity = l_debt / l_equity

        debt_to_ebitda = None
        if l_debt is not None and l_ebitda and l_ebitda > 0:
            debt_to_ebitda = l_debt / l_ebitda

        interest_coverage = None
        if l_op is not None and l_int and abs(l_int) > 0:
            interest_coverage = abs(l_op / l_int)

        # 4. Efficiency (3)
        asset_turnover = None
        if l_rev is not None and l_assets and l_assets > 0:
            asset_turnover = l_rev / l_assets

        inventory_turnover = None
        if l_cogs is not None and l_inv and l_inv > 0:
            inventory_turnover = abs(l_cogs) / l_inv

        receivables_turnover = None
        if l_rev is not None and l_rec and l_rec > 0:
            receivables_turnover = l_rev / l_rec

        # 5. Valuation (6)
        pe = (
            extract_raw(sum_detail, "trailingPE")
            or extract_raw(sum_detail, "forwardPE")
        )
        pb = (
            extract_raw(sum_detail, "priceToBook")
            or extract_raw(key_stats, "priceToBook")
        )
        ps = (
            extract_raw(sum_detail, "priceToSalesTrailing12Months")
        )
        ev_ebitda = (
            extract_raw(key_stats, "enterpriseToEbitda")
        )
        peg = (
            extract_raw(key_stats, "pegRatio")
        )
        div_yield = (
            extract_raw(sum_detail, "dividendYield")
        )

        # 6. Cash Flow Yield (1) -> total 20 ratios
        fcf_yield = None
        m_cap = extract_raw(sum_detail, "marketCap") or extract_raw(sum_detail, "marketCap")
        l_fcf = latest_cf.get("free_cf")
        if l_fcf is not None and m_cap and m_cap > 0:
            fcf_yield = l_fcf / m_cap

        # Round ratios helper
        def r_round(v: Optional[float], decimals: int = 2) -> Optional[float]:
            if v is None or math.isnan(v) or math.isinf(v):
                return None
            return round(float(v), decimals)

        ratios = {
            "gross_margin": r_round(gross_margin, 4),
            "operating_margin": r_round(operating_margin, 4),
            "net_margin": r_round(net_margin, 4),
            "roe": r_round(roe, 4),
            "roa": r_round(roa, 4),
            "current_ratio": r_round(current_ratio, 2),
            "quick_ratio": r_round(quick_ratio, 2),
            "debt_to_equity": r_round(debt_to_equity, 2),
            "debt_to_ebitda": r_round(debt_to_ebitda, 2),
            "interest_coverage": r_round(interest_coverage, 2),
            "asset_turnover": r_round(asset_turnover, 2),
            "inventory_turnover": r_round(inventory_turnover, 2),
            "receivables_turnover": r_round(receivables_turnover, 2),
            "pe": r_round(pe, 2),
            "pb": r_round(pb, 2),
            "ps": r_round(ps, 2),
            "ev_ebitda": r_round(ev_ebitda, 2),
            "peg": r_round(peg, 2),
            "dividend_yield": r_round(div_yield, 4),
            "fcf_yield": r_round(fcf_yield, 4),
        }

        # Filter out keys with None to keep response compact or keep all with None
        confidence = "HIGH" if (len(income_statement) >= 2 and len(balance_sheet) >= 2) else "MEDIUM"

        return {
            "symbol": raw_sym,
            "period": period,
            "income_statement": income_statement,
            "balance_sheet": balance_sheet,
            "cash_flow": cash_flow,
            "ratios": ratios,
            "data_quality": {
                "source": "yfinance",
                "confidence": confidence,
                "is_available": True,
            },
        }

global_financials_engine = FinancialsEngine()
