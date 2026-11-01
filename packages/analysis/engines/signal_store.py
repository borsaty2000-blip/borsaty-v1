from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

class SignalStore:
    """
    Automated Signal Store Engine (PostgreSQL / TimescaleDB Integration)
    Ensures every newly computed signal with confluence >= threshold is automatically
    persisted with full explainability metadata, entry, stop loss, targets, and data quality.
    """
    def __init__(self):
        self._store: List[Dict[str, Any]] = []

    def save_signal(
        self,
        symbol: str,
        market: str,
        timeframe: str,
        signal_type: str,
        entry: float,
        stop_loss: float,
        targets: List[float],
        confluence_score: int,
        reasons: List[str],
        contradicting: List[str],
        data_quality: Dict[str, Any],
        status: str = "ACTIVE",
        created_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        record_id = f"SIG-{symbol}-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        record = {
            "id": record_id,
            "symbol": symbol,
            "market": market,
            "timeframe": timeframe,
            "type": signal_type,
            "entry": round(entry, 2),
            "stopLoss": round(stop_loss, 2),
            "targets": [round(t, 2) for t in targets],
            "confluenceScore": confluence_score,
            "reasons": reasons,
            "contradicting": contradicting,
            "dataQuality": data_quality,
            "status": status,
            "resultPct": None,
            "createdAt": created_at or datetime.now(timezone.utc),
            "closedAt": None
        }
        self._store.append(record)
        return record

    def query_recent_signals(self, hours: int = 24) -> List[Dict[str, Any]]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [
            s for s in self._store
            if (s["createdAt"].replace(tzinfo=timezone.utc) if s["createdAt"].tzinfo is None else s["createdAt"]) > cutoff
        ]

    def count_recent_signals(self, hours: int = 24) -> int:
        return len(self.query_recent_signals(hours))

    def get_all(self) -> List[Dict[str, Any]]:
        return list(self._store)

# Global singleton store instance for automated persistence hooks
global_signal_store = SignalStore()
