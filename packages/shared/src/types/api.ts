/**
 * Borsaty API & Analysis Types
 * Synchronized strictly with Python Analysis & Backtest Engines
 */

export type MarketRegimeType =
  | 'trending_strong'
  | 'trending_weak'
  | 'ranging'
  | 'volatile_expansion'
  | 'volatile_contraction'
  | 'breakout'
  | 'mean_reversion'
  | 'unknown';

export interface MarketRegime {
  regime: MarketRegimeType;
  adx?: number;
  atr_ratio?: number;
  details?: Record<string, unknown>;
}

export interface StructuralPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  degree: number;
  time?: string | number;
  significance?: number;
}

export interface ElliottPattern {
  status: string;
  pattern_type?: string;
  waves?: Array<{
    name: string;
    start_index: number;
    end_index: number;
    start_price: number;
    end_price: number;
  }>;
  confidence?: number;
  degree?: number;
}

export interface HarmonicPattern {
  status: string;
  pattern_name?: string;
  direction?: 'bullish' | 'bearish';
  points?: Record<string, { price: number; index: number }>;
  prz_zone?: [number, number];
  ratios?: Record<string, number>;
  confidence?: number;
}

export interface ClassicalPattern {
  status: string;
  pattern_name?: string;
  direction?: 'bullish' | 'bearish';
  breakout_level?: number;
  target?: number;
  neckline?: number;
  confidence?: number;
}

export interface IndicatorMetrics {
  rsi?: number;
  macd?: { macd: number; signal: number; hist: number };
  bollinger?: { upper: number; middle: number; lower: number };
  atr?: number;
  adx?: number;
  [key: string]: unknown;
}

export interface ConfluenceEngineOutput {
  score: number; // 0 to 100 or 0.0 to 1.0
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary_ar?: string;
  summary_en?: string;
  engines?: Record<
    string,
    {
      raw_score: number;
      weight: number;
      status: string;
    }
  >;
}

export interface TradePlanTarget {
  level: number;
  price: number;
  method: string;
  weight?: number;
  r_multiple?: number;
}

export interface TradePlanStopLoss {
  price: number;
  method: string;
  distance_pct?: number;
}

export interface TradePlanRiskReward {
  primary_rr: number;
  blended_rr?: number;
}

export interface TradePlanPositionSizing {
  method: string;
  units: number;
  capital_risk_amount?: number;
  position_value?: number;
  kelly_fraction?: number;
}

export interface TradePlanSummary {
  status: 'actionable_setup' | 'no_actionable_setup' | 'unavailable';
  status_reason?: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  entry_zone: { low: number; high: number } | [number, number];
  stop_loss: number;
  primary_target: number | null;
  primary_rr: number;
  targets_count: number;
}

export interface TradePlanFull {
  status: 'actionable_setup' | 'no_actionable_setup' | 'unavailable';
  status_reason?: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  entry_zone: { low: number; high: number };
  stop_loss: TradePlanStopLoss;
  targets: TradePlanTarget[];
  risk_reward: TradePlanRiskReward;
  position_sizing?: TradePlanPositionSizing;
  warnings?: string[];
}

export interface NarrativeSections {
  analysis_summary: string;
  elliott: string;
  harmonic: string;
  classical: string;
  trade_plan: string;
  warnings: string[];
  disclaimer: string;
}

export interface NarrativeOutput {
  symbol: string;
  language: 'ar' | 'en';
  style: string;
  version: string;
  generated_at: string;
  sections: NarrativeSections;
  full_text: string;
  verification: {
    status: 'passed' | 'warning' | 'failed';
    numbers_checked: number;
    numbers_authorized: number;
    hallucination_gate: 'clear' | 'flagged';
  };
}

export interface FullAnalysisResponse {
  symbol: string;
  timeframe: string;
  version: string;
  computed_at: string;
  status: 'available' | 'unavailable';
  status_reason?: string;
  status_message_ar?: string;
  status_message_en?: string;
  regime: MarketRegime | null;
  pivots: StructuralPivot[];
  elliott: ElliottPattern | null;
  harmonic: HarmonicPattern | null;
  classical: ClassicalPattern | null;
  indicators: IndicatorMetrics;
  confluence: ConfluenceEngineOutput | null;
  trade_plan: TradePlanSummary | null;
  narrative_ar: NarrativeOutput | null;
  narrative_en: NarrativeOutput | null;
  execution_ms: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backtest & Walk-Forward Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface BacktestSignalRecord {
  signal_id: string;
  bar_index: number;
  date: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  entry_zone: [number, number];
  stop: number;
  targets: [number, number, number];
  regime: string;
  engines_used: string[];
  confluence_score: number;
  outcome: 'HIT_T1' | 'HIT_T2' | 'HIT_T3' | 'STOPPED' | 'EXPIRED' | 'PENDING';
  realized_r?: number | null;
  days_to_resolution?: number | null;
  mfe_pct?: number | null;
  mae_pct?: number | null;
}

export interface BacktestMetrics {
  total_signals: number;
  total_closed: number;
  hit_rate_t1: number;
  hit_rate_t2: number;
  hit_rate_t3: number;
  stopped_rate: number;
  expired_rate: number;
  avg_r_multiple: number;
  profit_factor: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  expectancy_per_trade: number;
  wilson_ci_95_t1: [number, number];
  wilson_ci_95_t2: [number, number];
  by_regime: Record<
    string,
    {
      count: number;
      hit_rate_t1: number;
      ci: [number, number];
      sample_adequate: boolean;
    }
  >;
  by_engine: Record<
    string,
    {
      count: number;
      hit_rate_t1: number;
    }
  >;
}

export interface BacktestResult {
  symbol: string;
  timeframe: string;
  backtest_version: string;
  date_range: { from: string; to: string };
  total_bars: number;
  total_signals: number;
  signals: BacktestSignalRecord[];
  metrics: BacktestMetrics;
  data_quality: {
    warmup_bars_used: number;
    look_ahead_verified: boolean;
    sample_size_adequate: boolean;
    status: 'ok' | 'insufficient_data';
    message_ar: string;
    message_en: string;
  };
  execution_ms: number;
}

export interface WalkForwardWindow {
  window_index: number;
  date_range: [string, string];
  total_signals: number;
  hit_rate_t1: number;
  avg_r: number;
  sample_adequate: boolean;
}

export interface WalkForwardResult {
  symbol: string;
  timeframe: string;
  windows: WalkForwardWindow[];
  overall: {
    hit_rate_mean: number;
    hit_rate_std: number;
    stability_score: number;
    walk_forward_efficiency: number;
    n_windows: number;
    n_adequate_windows: number;
  };
  verdict: 'stable' | 'unstable' | 'insufficient_data';
  message_ar: string;
  message_en: string;
}

export interface BacktestResponse {
  backtest: BacktestResult;
  walk_forward: WalkForwardResult | null;
  report: string;
  generated_at: string;
  cache?: 'hit' | 'miss';
  execution_ms: number;
}
