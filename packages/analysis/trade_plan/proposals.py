"""
Trade Proposal Interface & Extractors (Borsaty).
Defines standard TradeProposal interface and engine-specific extractors.
Version 1.0.0
"""

from typing import Dict, Any, List, Optional, Tuple, Union
from dataclasses import dataclass, field, asdict


@dataclass
class TradeProposal:
    """
    Unified trade proposal representation across all analytical engines.
    """
    engine: str          # e.g., "elliott", "harmonic_gartley", "classical_head_and_shoulders", "structure", "fibonacci"
    type: str            # "target", "stop_loss", "entry_zone"
    price: float         # Target or stop price level (or entry level)
    method: str          # Descriptive name of method/ratio, e.g. "Wave 3 extension (1.618)"
    score: float         # Quality / confidence score in [0.0, 1.0]
    direction: str = "bullish"  # "bullish" or "bearish"
    reason: str = ""     # Supplementary explanation
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def calculate_atr14(candles: List[Dict[str, Any]]) -> float:
    """Helper to compute 14-period ATR."""
    if not candles or len(candles) < 2:
        return 1.0
    tr_list = []
    for i in range(1, len(candles)):
        c = candles[i]
        prev_close = candles[i - 1]["close"]
        h = c.get("high", c["close"])
        l = c.get("low", c["close"])
        tr = max(h - l, abs(h - prev_close), abs(l - prev_close))
        tr_list.append(tr)
    window = tr_list[-14:] if len(tr_list) >= 14 else tr_list
    return float(sum(window) / len(window)) if window else 1.0


def extract_elliott_proposals(elliott_result: Dict[str, Any]) -> List[TradeProposal]:
    """
    Extract proposals from Elliott Wave analysis result.
    IF trade_ready exists:
      entry_zone, stop, targets.
    """
    proposals: List[TradeProposal] = []
    if not elliott_result or elliott_result.get("status") != "available":
        return proposals

    primary_count = elliott_result.get("primary_count") or {}
    trade_ready = primary_count.get("trade_ready")
    if not trade_ready:
        return proposals

    pattern_score = float(primary_count.get("pattern_score", 0.8))
    stability_score = float(trade_ready.get("stability_score", 0.9))
    confidence = round(pattern_score * stability_score, 2)
    direction = "bullish" if "bullish" in str(primary_count.get("subtype", "")).lower() or str(primary_count.get("direction", "")).lower() == "bullish" else "bearish"

    # Stop Loss
    stop_info = trade_ready.get("stop_loss", {})
    if isinstance(stop_info, dict) and "price" in stop_info:
        stop_price = float(stop_info["price"])
        stop_method = str(stop_info.get("method", "Wave invalidation level"))
        stop_reason = str(stop_info.get("reason", stop_method))
        proposals.append(TradeProposal(
            engine="elliott",
            type="stop_loss",
            price=stop_price,
            method=stop_method,
            score=confidence,
            direction=direction,
            reason=stop_reason,
            metadata={"source": "primary_count_trade_ready"}
        ))

    # Entry Zone
    entry_zone = trade_ready.get("entry_zone")
    if isinstance(entry_zone, dict) and "low" in entry_zone and "high" in entry_zone:
        mid_entry = (float(entry_zone["low"]) + float(entry_zone["high"])) / 2.0
        proposals.append(TradeProposal(
            engine="elliott",
            type="entry_zone",
            price=mid_entry,
            method="Wave pullback entry zone",
            score=confidence,
            direction=direction,
            metadata={"low": float(entry_zone["low"]), "high": float(entry_zone["high"])}
        ))

    # Targets
    targets = trade_ready.get("targets", [])
    for idx, t in enumerate(targets):
        if isinstance(t, dict) and "price" in t:
            p = float(t["price"])
            method = str(t.get("method", f"Wave target {idx + 1}"))
            t_score = float(t.get("score", confidence))
            proposals.append(TradeProposal(
                engine="elliott",
                type="target",
                price=p,
                method=method,
                score=t_score,
                direction=direction,
                metadata={"rank": idx + 1}
            ))

    return proposals


def extract_harmonic_proposals(harmonic_result: Dict[str, Any]) -> List[TradeProposal]:
    """
    Extract proposals from confirmed Harmonic patterns.
    """
    proposals: List[TradeProposal] = []
    if not harmonic_result or harmonic_result.get("status") != "available":
        return proposals

    patterns = harmonic_result.get("patterns", [])
    for p in patterns:
        pat_name = p.get("pattern", "harmonic")
        source_engine = f"harmonic_{pat_name}"
        pat_type = p.get("type", "bullish").lower()
        overall_score = float(p.get("overall_score", 0.75))

        # Invalidation / Stop
        inval = p.get("invalidation", {})
        if isinstance(inval, dict) and "price" in inval:
            proposals.append(TradeProposal(
                engine=source_engine,
                type="stop_loss",
                price=float(inval["price"]),
                method=str(inval.get("reason", f"{pat_name.title()} PRZ invalidation")),
                score=overall_score,
                direction=pat_type,
                reason=str(inval.get("reason", f"Beyond {pat_name.title()} PRZ invalidation")),
            ))

        # Entry Zone (PRZ)
        prz = p.get("prz", {})
        if isinstance(prz, dict) and "low" in prz and "high" in prz:
            mid_prz = (float(prz["low"]) + float(prz["high"])) / 2.0
            proposals.append(TradeProposal(
                engine=source_engine,
                type="entry_zone",
                price=mid_prz,
                method=f"{pat_name.title()} PRZ Zone",
                score=overall_score,
                direction=pat_type,
                metadata={"low": float(prz["low"]), "high": float(prz["high"])}
            ))

        # Targets
        targets = p.get("targets", [])
        for idx, t in enumerate(targets):
            if isinstance(t, dict) and "price" in t:
                proposals.append(TradeProposal(
                    engine=source_engine,
                    type="target",
                    price=float(t["price"]),
                    method=str(t.get("label", f"{pat_name.title()} Target {idx + 1}")),
                    score=overall_score,
                    direction=pat_type,
                    metadata={"target_index": idx + 1}
                ))

    return proposals


def extract_classical_proposals(classical_result: Dict[str, Any]) -> List[TradeProposal]:
    """
    Extract proposals from confirmed Classical patterns.
    """
    proposals: List[TradeProposal] = []
    if not classical_result or classical_result.get("status") != "available":
        return proposals

    patterns = classical_result.get("patterns", [])
    for p in patterns:
        if p.get("status") not in [None, "confirmed"]:
            continue
        pat_name = p.get("pattern", "classical")
        source_engine = f"classical_{pat_name}"
        pat_type = p.get("type", "bullish").lower()
        score = float(p.get("pattern_score", 0.70))

        # Stop / Invalidation
        inval = p.get("invalidation", {})
        if isinstance(inval, dict) and "price" in inval:
            proposals.append(TradeProposal(
                engine=source_engine,
                type="stop_loss",
                price=float(inval["price"]),
                method=str(inval.get("method", f"{pat_name.title()} invalidation")),
                score=score,
                direction=pat_type,
                reason=str(inval.get("reason", f"{pat_name.title()} invalidation level")),
            ))

        # Breakout / Entry
        breakout = p.get("breakout", {})
        if isinstance(breakout, dict) and "level" in breakout:
            proposals.append(TradeProposal(
                engine=source_engine,
                type="entry_zone",
                price=float(breakout["level"]),
                method=f"{pat_name.title()} breakout line",
                score=score,
                direction=pat_type,
            ))

        # Targets
        targets = p.get("targets", [])
        for idx, t in enumerate(targets):
            if isinstance(t, dict) and "price" in t:
                proposals.append(TradeProposal(
                    engine=source_engine,
                    type="target",
                    price=float(t["price"]),
                    method=str(t.get("method", f"{pat_name.title()} target {idx + 1}")),
                    score=score,
                    direction=pat_type,
                    metadata={"target_index": idx + 1}
                ))

    return proposals


def extract_structure_proposals(
    pivots_data: Union[List[Dict[str, Any]], Dict[str, Any]],
    current_price: float,
    atr: float,
    direction: str = "bullish"
) -> List[TradeProposal]:
    """
    Extract proposals from HSPD Market Structure pivots.
    """
    proposals: List[TradeProposal] = []
    pivots_list = pivots_data if isinstance(pivots_data, list) else pivots_data.get("pivots", [])
    if not pivots_list:
        return proposals

    troughs = [p for p in pivots_list if p.get("type") == "trough"]
    peaks = [p for p in pivots_list if p.get("type") == "peak"]

    if direction == "bullish":
        # Stop loss: below last higher low - 0.5 ATR
        if troughs:
            last_low = troughs[-1]
            stop_price = float(last_low["price"]) - 0.5 * atr
            proposals.append(TradeProposal(
                engine="structure",
                type="stop_loss",
                price=round(stop_price, 2),
                method="Last higher low - 0.5 ATR",
                score=float(last_low.get("stability_score", 0.85)),
                direction="bullish",
                reason="Below last higher low (structure invalidation)"
            ))

        # Targets: nearest resistance peaks above current price
        resistances = sorted([p for p in peaks if float(p["price"]) > current_price], key=lambda x: float(x["price"]))
        if not resistances and peaks:
            highest_peak = max(peaks, key=lambda x: float(x["price"]))
            resistances = [{"price": float(highest_peak["price"]) + (idx + 1) * 1.5 * atr, "stability_score": highest_peak.get("stability_score", 0.80)} for idx in range(3)]

        for idx, r in enumerate(resistances[:3]):
            proposals.append(TradeProposal(
                engine="structure",
                type="target",
                price=round(float(r["price"]), 2),
                method=f"Prior swing high ({'major' if idx == 0 else 'secondary'})",
                score=float(r.get("stability_score", 0.80)),
                direction="bullish",
                metadata={"rank": idx + 1}
            ))
    elif direction == "bearish":
        # Stop loss: above last lower high + 0.5 ATR
        if peaks:
            last_high = peaks[-1]
            stop_price = float(last_high["price"]) + 0.5 * atr
            proposals.append(TradeProposal(
                engine="structure",
                type="stop_loss",
                price=round(stop_price, 2),
                method="Last lower high + 0.5 ATR",
                score=float(last_high.get("stability_score", 0.85)),
                direction="bearish",
                reason="Above last lower high (structure invalidation)"
            ))

        # Targets: nearest support troughs below current price
        supports = sorted([p for p in troughs if float(p["price"]) < current_price], key=lambda x: float(x["price"]), reverse=True)
        if not supports and troughs:
            lowest_trough = min(troughs, key=lambda x: float(x["price"]))
            supports = [{"price": float(lowest_trough["price"]) - (idx + 1) * 1.5 * atr, "stability_score": lowest_trough.get("stability_score", 0.80)} for idx in range(3)]

        for idx, s in enumerate(supports[:3]):
            proposals.append(TradeProposal(
                engine="structure",
                type="target",
                price=round(float(s["price"]), 2),
                method=f"Prior swing low ({'major' if idx == 0 else 'secondary'})",
                score=float(s.get("stability_score", 0.80)),
                direction="bearish",
                metadata={"rank": idx + 1}
            ))

    return proposals


def extract_fibonacci_proposals(
    candles: List[Dict[str, Any]],
    current_price: float,
    atr: float,
    direction: str = "bullish"
) -> List[TradeProposal]:
    """
    Extract proposals from swing Fibonacci extensions.
    Targets = 1.272, 1.618, 2.618 extensions.
    Stop = swing low / high +/- ATR buffer.
    """
    proposals: List[TradeProposal] = []
    if not candles or len(candles) < 20:
        return proposals

    recent = candles[-30:]
    highs = [c.get("high", c["close"]) for c in recent]
    lows = [c.get("low", c["close"]) for c in recent]
    swing_high = max(highs)
    swing_low = min(lows)
    swing_range = swing_high - swing_low

    if swing_range <= 0.0001 or (swing_range / current_price) < 0.015:
        return proposals

    if direction == "bullish":
        # Extensions above swing high
        ext_levels = [
            (swing_high + 0.272 * swing_range, "1.272 extension", 0.70),
            (swing_high + 0.618 * swing_range, "1.618 extension", 0.75),
            (swing_high + 1.618 * swing_range, "2.618 extension", 0.65),
        ]
        for p, label, sc in ext_levels:
            if p > current_price:
                proposals.append(TradeProposal(
                    engine="fibonacci",
                    type="target",
                    price=round(p, 2),
                    method=label,
                    score=sc,
                    direction="bullish",
                ))
        # Stop
        stop_p = swing_low - 0.5 * atr
        proposals.append(TradeProposal(
            engine="fibonacci",
            type="stop_loss",
            price=round(stop_p, 2),
            method="Swing low - 0.5 ATR buffer",
            score=0.60,
            direction="bullish",
            reason="Below recent swing low (Fibonacci invalidation)"
        ))
    elif direction == "bearish":
        # Extensions below swing low
        ext_levels = [
            (swing_low - 0.272 * swing_range, "1.272 extension", 0.70),
            (swing_low - 0.618 * swing_range, "1.618 extension", 0.75),
            (swing_low - 1.618 * swing_range, "2.618 extension", 0.65),
        ]
        for p, label, sc in ext_levels:
            if p < current_price:
                proposals.append(TradeProposal(
                    engine="fibonacci",
                    type="target",
                    price=round(p, 2),
                    method=label,
                    score=sc,
                    direction="bearish",
                ))
        # Stop
        stop_p = swing_high + 0.5 * atr
        proposals.append(TradeProposal(
            engine="fibonacci",
            type="stop_loss",
            price=round(stop_p, 2),
            method="Swing high + 0.5 ATR buffer",
            score=0.60,
            direction="bearish",
            reason="Above recent swing high"
        ))

    return proposals


def extract_all_trade_proposals(
    full_analysis: Dict[str, Any],
    candles: Optional[List[Dict[str, Any]]] = None,
    current_price: Optional[float] = None
) -> List[TradeProposal]:
    """
    Extract proposals from all five engines according to unified specifications.
    """
    proposals: List[TradeProposal] = []
    candles = candles or full_analysis.get("candles") or []
    if current_price is None and candles:
        current_price = candles[-1]["close"]
    elif current_price is None:
        current_price = 100.0

    atr = calculate_atr14(candles) if candles else 1.0

    # Determine direction preference from confluence
    confluence = full_analysis.get("confluence", {})
    direction = confluence.get("direction", "bullish")
    if direction == "neutral":
        # Pick based on score sign if available, else default bullish for extraction
        score = confluence.get("score", 0.0)
        direction = "bullish" if score >= 0 else "bearish"

    # 1. Elliott
    if "elliott" in full_analysis:
        proposals.extend(extract_elliott_proposals(full_analysis["elliott"]))

    # 2. Harmonic
    if "harmonic" in full_analysis:
        proposals.extend(extract_harmonic_proposals(full_analysis["harmonic"]))

    # 3. Classical
    if "classical" in full_analysis:
        proposals.extend(extract_classical_proposals(full_analysis["classical"]))

    # 4. Structure (HSPD)
    pivots_data = full_analysis.get("pivots") or full_analysis.get("hspd") or []
    proposals.extend(extract_structure_proposals(pivots_data, current_price, atr, direction))

    # 5. Fibonacci
    if candles:
        proposals.extend(extract_fibonacci_proposals(candles, current_price, atr, direction))

    return proposals
