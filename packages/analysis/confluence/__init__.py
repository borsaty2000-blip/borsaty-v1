"""
Confluence Analysis Engine (Borsaty).
Regime-aware, transparent, weighted aggregation of all 4 analytical engines,
market structure, and volume confirmation.
"""

from .engine import ConfluenceEngine, global_confluence_engine

__all__ = ["ConfluenceEngine", "global_confluence_engine"]
