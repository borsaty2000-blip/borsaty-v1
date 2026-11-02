from typing import Optional, Tuple, List, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, field_validator
import re

ALLOWLIST_UNIVERSES = {
    "EGX", "TASI", "NOMU", "DFM", "ADX", "QE", "KW",
    "US", "UK", "DE", "JP", "GLOBAL", "ALL"
}

ALLOWLIST_ASSET_CLASSES = {
    "EQUITY", "FOREX", "CRYPTO", "COMMODITY", "INDEX"
}

ALLOWLIST_OPERATORS = {
    ">", "<", ">=", "<=", "=", "!=", "between", "crosses_above", "crosses_below"
}

ALLOWLIST_FIELDS = {
    # Price
    "close", "open", "high", "low", "volume",
    "close_change_pct_1d", "close_change_pct_5d", "close_change_pct_1m",
    "volume_ratio_20d", "high_52w", "low_52w",

    # Fundamentals
    "market_cap", "pe_ratio", "pb_ratio", "dividend_yield",

    # Metadata
    "sector", "market", "asset_class",

    # Indicators (exact names)
    "SMA_20", "SMA_50", "SMA_200", "EMA_9", "EMA_20", "EMA_21", "EMA_50", "WMA_20",
    "RSI_14", "MACD_line", "MACD_signal", "MACD_hist",
    "Bollinger_upper", "Bollinger_middle", "Bollinger_lower",
    "Stochastic_K", "Stochastic_D", "ADX_14", "DI_plus", "DI_minus",
    "CCI_20", "Williams_R_14", "ROC_12", "OBV", "MFI_14", "ATR_14",
    "Supertrend", "PSAR", "Ichimoku_tenkan", "Ichimoku_kijun"
}

class IndicatorRef(BaseModel):
    type: Literal["indicator"] = "indicator"
    name: str
    params: Dict[str, Any] = Field(default_factory=dict)
    timeframe: str = "1D"

    @field_validator("name")
    def validate_name(cls, v: str) -> str:
        clean = v.upper()
        allowed = {
            "SMA", "EMA", "WMA", "RSI", "MACD", "BOLLINGER", "STOCHASTIC",
            "ADX", "CCI", "WILLIAMS_R", "ROC", "OBV", "MFI", "VWAP",
            "ATR", "KELTNER", "DONCHIAN", "ICHIMOKU", "SUPERTREND", "PSAR"
        }
        if clean not in allowed:
            raise ValueError(f"المؤشر '{v}' غير موجود في قائمة المؤشرات المسموحة")
        return clean

class Condition(BaseModel):
    field: str
    operator: str
    value: Union[float, int, str, List[Union[float, int]], IndicatorRef, Dict[str, Any]]

    @field_validator("field")
    def validate_field(cls, v: str) -> str:
        # Check against allowlist case-insensitively but store exact allowlist casing
        for allowed in ALLOWLIST_FIELDS:
            if v.lower() == allowed.lower():
                return allowed
        raise ValueError(f"الحقل '{v}' غير مسموح به في مصفاة الأسهم. الحقول المسموحة فقط: {', '.join(sorted(ALLOWLIST_FIELDS))}")

    @field_validator("operator")
    def validate_operator(cls, v: str) -> str:
        if v not in ALLOWLIST_OPERATORS:
            raise ValueError(f"المعامل '{v}' غير صالح. المعاملات المسموحة فقط: {', '.join(sorted(ALLOWLIST_OPERATORS))}")
        return v

class SortSpec(BaseModel):
    field: str
    direction: Literal["asc", "desc"] = "desc"

    @field_validator("field")
    def validate_sort_field(cls, v: str) -> str:
        for allowed in ALLOWLIST_FIELDS:
            if v.lower() == allowed.lower():
                return allowed
        raise ValueError(f"حقل الترتيب '{v}' غير مسموح به")

class ScreenQuery(BaseModel):
    universe: str = "ALL"
    assetClass: Optional[str] = None
    sector: Optional[str] = None
    conditions: List[Condition] = Field(default_factory=list)
    logic: Literal["AND", "OR"] = "AND"
    sort: Optional[SortSpec] = None
    limit: int = 20

    @field_validator("universe")
    def validate_universe(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in ALLOWLIST_UNIVERSES:
            raise ValueError(f"السوق '{v}' غير موجود في قائمة الأسواق المدعومة")
        return v_upper

    @field_validator("assetClass")
    def validate_asset_class(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_upper = v.upper()
        if v_upper not in ALLOWLIST_ASSET_CLASSES:
            raise ValueError(f"فئة الأصل '{v}' غير مدعومة")
        return v_upper

    @field_validator("conditions")
    def validate_conditions_limit(cls, v: List[Condition]) -> List[Condition]:
        if len(v) > 10:
            raise ValueError("تجاوزت الحد الأقصى للشروط المسموحة (الحد الأقصى: 10 شروط)")
        return v

    @field_validator("limit")
    def validate_limit(cls, v: int) -> int:
        if v < 1:
            return 20
        return min(v, 100)
