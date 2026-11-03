'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  IPriceLine,
  LineStyle,
} from 'lightweight-charts';
import { useApp } from '@/context/AppContext';
import { useBorsaty } from '@/context/BorsatyContext';
import { X, Sparkles, SlidersHorizontal, Activity, Layers, BarChart2 } from 'lucide-react';

export interface CandleDataPoint {
  time: string | number; // YYYY-MM-DD or unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceChartProps {
  candles: CandleDataPoint[];
  height?: number;
  symbol?: string;
  currency?: string;
  onCrosshairMove?: (price: number | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure Technical Calculations for TradingView-Grade Panels
// ─────────────────────────────────────────────────────────────────────────────

function calculateEMA(data: CandleDataPoint[], period: number) {
  const k = 2 / (period + 1);
  const res: Array<{ time: Time; value: number }> = [];
  let ema = data[0]?.close || 0;

  for (let i = 0; i < data.length; i++) {
    const timeVal = (typeof data[i].time === 'number' ? data[i].time : String(data[i].time).slice(0, 10)) as Time;
    if (i === 0) {
      ema = data[0].close;
    } else {
      ema = data[i].close * k + ema * (1 - k);
    }
    if (i >= period - 1) {
      res.push({ time: timeVal, value: Math.round(ema * 100) / 100 });
    }
  }
  return res;
}

function calculateSMA(data: CandleDataPoint[], period: number) {
  const res: Array<{ time: Time; value: number }> = [];
  for (let i = period - 1; i < data.length; i++) {
    const timeVal = (typeof data[i].time === 'number' ? data[i].time : String(data[i].time).slice(0, 10)) as Time;
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, c) => acc + c.close, 0);
    res.push({ time: timeVal, value: Math.round((sum / period) * 100) / 100 });
  }
  return res;
}

function calculateBollingerBands(data: CandleDataPoint[], period = 20, mult = 2) {
  const upper: Array<{ time: Time; value: number }> = [];
  const lower: Array<{ time: Time; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const timeVal = (typeof data[i].time === 'number' ? data[i].time : String(data[i].time).slice(0, 10)) as Time;
    const slice = data.slice(i - period + 1, i + 1).map((c) => c.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper.push({ time: timeVal, value: Math.round((mean + mult * std) * 100) / 100 });
    lower.push({ time: timeVal, value: Math.round((mean - mult * std) * 100) / 100 });
  }
  return { upper, lower };
}

function calculateRSI(data: CandleDataPoint[], period = 14) {
  const res: Array<{ time: Time; value: number }> = [];
  if (data.length <= period) return res;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    const timeVal = (typeof data[i].time === 'number' ? data[i].time : String(data[i].time).slice(0, 10)) as Time;
    if (i > period) {
      const diff = data[i].close - data[i - 1].close;
      const currentGain = diff > 0 ? diff : 0;
      const currentLoss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    res.push({ time: timeVal, value: Math.round(rsi * 10) / 10 });
  }
  return res;
}

function calculateMACD(data: CandleDataPoint[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const map26 = new Map(ema26.map((e) => [String(e.time), e.value]));

  const macdPoints: Array<{ time: Time; value: number }> = [];
  for (const e12 of ema12) {
    const tKey = String(e12.time);
    if (map26.has(tKey)) {
      macdPoints.push({
        time: e12.time,
        value: Math.round((e12.value - map26.get(tKey)!) * 100) / 100,
      });
    }
  }

  const k9 = 2 / (9 + 1);
  let sig = macdPoints.length > 0 ? macdPoints[0].value : 0;
  const macdLine: Array<{ time: Time; value: number }> = [];
  const signalLine: Array<{ time: Time; value: number }> = [];
  const histogram: Array<{ time: Time; value: number; color: string }> = [];

  for (let i = 0; i < macdPoints.length; i++) {
    if (i === 0) sig = macdPoints[0].value;
    else sig = macdPoints[i].value * k9 + sig * (1 - k9);

    if (i >= 8) {
      const histVal = Math.round((macdPoints[i].value - sig) * 100) / 100;
      macdLine.push(macdPoints[i]);
      signalLine.push({ time: macdPoints[i].time, value: Math.round(sig * 100) / 100 });
      histogram.push({
        time: macdPoints[i].time,
        value: histVal,
        color: histVal >= 0 ? '#10b981' : '#ef4444',
      });
    }
  }
  return { macdLine, signalLine, histogram };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PriceChart Component with Synced TradingView-Grade Panels
// ─────────────────────────────────────────────────────────────────────────────

export function PriceChart({
  candles,
  height = 420,
  symbol = 'COMI',
  currency = 'EGP',
  onCrosshairMove,
}: PriceChartProps) {
  // Indicator Toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSR, setShowSR] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  // Refs for Chart Containers
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  // Refs for Chart Instances
  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  // Series Refs
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const srLinesRef = useRef<IPriceLine[]>([]);
  const patternSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const { theme, direction } = useApp();
  const { activeHighlight, clearHighlight } = useBorsaty();
  const isDark = theme === 'dark';

  // Format candles
  const formattedData: CandlestickData<Time>[] = useMemo(() => {
    return candles
      .filter((c) => c && c.time && c.open && c.high && c.low && c.close)
      .map((c) => ({
        time: (typeof c.time === 'number' ? c.time : String(c.time).slice(0, 10)) as Time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .sort((a, b) => (a.time > b.time ? 1 : -1));
  }, [candles]);

  // 1. Initialize Main Candlestick Chart
  useEffect(() => {
    if (!mainContainerRef.current || formattedData.length === 0) return;

    const bg = isDark ? '#0b1120' : '#ffffff';
    const text = isDark ? '#94a3b8' : '#475569';
    const grid = isDark ? '#1e293b' : '#f1f5f9';
    const border = isDark ? '#334155' : '#e2e8f0';

    const mainChart = createChart(mainContainerRef.current, {
      width: mainContainerRef.current.clientWidth,
      height: Math.max(340, height),
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontFamily: "'Cairo', 'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: grid, style: 1 },
        horzLines: { color: grid, style: 1 },
      },
      rightPriceScale: {
        borderColor: border,
        visible: direction === 'ltr',
      },
      leftPriceScale: {
        borderColor: border,
        visible: direction === 'rtl',
      },
      timeScale: {
        borderColor: border,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: 3,
        },
      },
    });

    mainChartRef.current = mainChart;

    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceScaleId: direction === 'rtl' ? 'left' : 'right',
    });
    candleSeries.setData(formattedData);
    candleSeriesRef.current = candleSeries;

    // Overlays: EMA 20
    if (showEMA20) {
      const ema20Data = calculateEMA(candles, 20);
      const ema20Series = mainChart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: direction === 'rtl' ? 'left' : 'right',
      });
      ema20Series.setData(ema20Data);
      ema20SeriesRef.current = ema20Series;
    }

    // Overlays: EMA 50
    if (showEMA50) {
      const ema50Data = calculateEMA(candles, 50);
      const ema50Series = mainChart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: direction === 'rtl' ? 'left' : 'right',
      });
      ema50Series.setData(ema50Data);
      ema50SeriesRef.current = ema50Series;
    }

    // Overlays: SMA 200
    if (showSMA200) {
      const sma200Data = calculateSMA(candles, 200);
      const sma200Series = mainChart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: direction === 'rtl' ? 'left' : 'right',
      });
      sma200Series.setData(sma200Data);
      sma200SeriesRef.current = sma200Series;
    }

    // Overlays: Bollinger Bands
    if (showBollinger) {
      const { upper, lower } = calculateBollingerBands(candles, 20, 2);
      const bbUpper = mainChart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: direction === 'rtl' ? 'left' : 'right',
      });
      bbUpper.setData(upper);
      bbUpperSeriesRef.current = bbUpper;

      const bbLower = mainChart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: direction === 'rtl' ? 'left' : 'right',
      });
      bbLower.setData(lower);
      bbLowerSeriesRef.current = bbLower;
    }

    // Overlays: Support & Resistance auto-lines
    if (showSR && formattedData.length >= 10) {
      const lastPrice = formattedData[formattedData.length - 1].close;
      const resPrice = Math.round(lastPrice * 1.05 * 100) / 100;
      const supPrice = Math.round(lastPrice * 0.95 * 100) / 100;

      const rLine = candleSeries.createPriceLine({
        price: resPrice,
        color: '#f43f5e',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Key Resistance',
      });
      const sLine = candleSeries.createPriceLine({
        price: supPrice,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Key Support',
      });
      srLinesRef.current = [rLine, sLine];
    }

    mainChart.timeScale().fitContent();

    // Crosshair listener
    if (onCrosshairMove) {
      mainChart.subscribeCrosshairMove((param) => {
        if (!param.point || !param.seriesData) {
          onCrosshairMove(null);
          return;
        }
        const data = param.seriesData.get(candleSeries) as CandlestickData;
        if (data && typeof data.close === 'number') {
          onCrosshairMove(data.close);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    // Resize Handler
    const handleResize = () => {
      if (mainContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({
          width: mainContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mainChart.remove();
      mainChartRef.current = null;
    };
  }, [
    formattedData,
    height,
    isDark,
    direction,
    showEMA20,
    showEMA50,
    showSMA200,
    showBollinger,
    showSR,
  ]);

  // 2. Initialize RSI Sub-Panel (Synced Time Scale)
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || formattedData.length === 0) return;

    const bg = isDark ? '#0b1120' : '#ffffff';
    const text = isDark ? '#94a3b8' : '#475569';
    const grid = isDark ? '#1e293b' : '#f1f5f9';
    const border = isDark ? '#334155' : '#e2e8f0';

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: grid, style: 1 },
        horzLines: { color: grid, style: 1 },
      },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true },
    });
    rsiChartRef.current = rsiChart;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      priceLineVisible: false,
    });
    const rsiData = calculateRSI(candles, 14);
    rsiSeries.setData(rsiData);

    // Overbought (70) and Oversold (30) levels
    rsiSeries.createPriceLine({
      price: 70,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Overbought (70)',
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Oversold (30)',
    });
    rsiSeries.createPriceLine({
      price: 50,
      color: '#64748b',
      lineWidth: 1,
      lineStyle: LineStyle.SparseDotted,
      axisLabelVisible: false,
    });

    rsiChart.timeScale().fitContent();

    // Synchronize time scale with main chart
    if (mainChartRef.current) {
      mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && mainChartRef.current) {
          mainChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    const handleResize = () => {
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rsiChart.remove();
      rsiChartRef.current = null;
    };
  }, [showRSI, formattedData, isDark]);

  // 3. Initialize MACD Sub-Panel (Synced Time Scale)
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current || formattedData.length === 0) return;

    const bg = isDark ? '#0b1120' : '#ffffff';
    const text = isDark ? '#94a3b8' : '#475569';
    const grid = isDark ? '#1e293b' : '#f1f5f9';
    const border = isDark ? '#334155' : '#e2e8f0';

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: grid, style: 1 },
        horzLines: { color: grid, style: 1 },
      },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true },
    });
    macdChartRef.current = macdChart;

    const { macdLine, signalLine, histogram } = calculateMACD(candles);

    // Histogram Series
    const histSeries = macdChart.addSeries(HistogramSeries, {
      priceLineVisible: false,
    });
    histSeries.setData(histogram);

    // MACD Line
    const mSeries = macdChart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      priceLineVisible: false,
    });
    mSeries.setData(macdLine);

    // Signal Line
    const sSeries = macdChart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      priceLineVisible: false,
    });
    sSeries.setData(signalLine);

    macdChart.timeScale().fitContent();

    // Synchronize time scale with main chart
    if (mainChartRef.current) {
      mainChartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
      macdChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && mainChartRef.current) {
          mainChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    const handleResize = () => {
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: macdContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      macdChart.remove();
      macdChartRef.current = null;
    };
  }, [showMACD, formattedData, isDark]);

  // 4. Handle Interactive Highlighting (Harmonics, Elliott, Trade Plan Levels)
  useEffect(() => {
    const chart = mainChartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    // Remove previous pattern line series
    if (patternSeriesRef.current) {
      try {
        chart.removeSeries(patternSeriesRef.current);
      } catch {
        // ignore
      }
      patternSeriesRef.current = null;
    }

    // Clear previous markers
    if (markersRef.current) {
      try {
        markersRef.current.setMarkers([]);
      } catch {
        // ignore
      }
      markersRef.current = null;
    }

    if (!activeHighlight) return;

    // Draw Price Lines (Entry, SL, Targets)
    if (activeHighlight.priceLevels) {
      const { entry, stopLoss, targets } = activeHighlight.priceLevels;

      if (entry && entry.length > 0) {
        entry.forEach((lvl, idx) => {
          series.createPriceLine({
            price: lvl,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: entry.length > 1 ? `Entry ${idx + 1}` : 'Entry',
          });
        });
      }

      if (stopLoss) {
        series.createPriceLine({
          price: stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Stop Loss',
        });
      }

      if (targets && targets.length > 0) {
        targets.forEach((tgt, idx) => {
          series.createPriceLine({
            price: tgt,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Target ${idx + 1}`,
          });
        });
      }
    }

    // Draw Pattern Line Series & Markers (X-A-B-C-D or 1-2-3-4-5)
    if (activeHighlight.points && activeHighlight.points.length > 0) {
      const sortedPoints = [...activeHighlight.points]
        .map((p) => ({
          time: (typeof p.time === 'number' ? p.time : String(p.time).slice(0, 10)) as Time,
          value: p.price,
          label: p.label,
          color: p.color || '#06b6d4',
        }))
        .sort((a, b) => (a.time > b.time ? 1 : -1));

      if (sortedPoints.length >= 2) {
        const patternLineSeries = chart.addSeries(LineSeries, {
          color: activeHighlight.type === 'elliott' ? '#8b5cf6' : '#06b6d4',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: direction === 'rtl' ? 'left' : 'right',
        });
        patternLineSeries.setData(sortedPoints.map((p) => ({ time: p.time, value: p.value })));
        patternSeriesRef.current = patternLineSeries;
      }

      const markerItems: SeriesMarker<Time>[] = sortedPoints.map((p) => ({
        time: p.time,
        position: 'aboveBar' as const,
        color: p.color || '#06b6d4',
        shape: 'circle' as const,
        text: p.label,
        size: 2,
      }));

      try {
        const primitive = createSeriesMarkers(series, markerItems);
        markersRef.current = primitive;
      } catch {
        // non-blocking
      }
    }
  }, [activeHighlight, direction]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] p-3 md:p-4 shadow-sm transition-colors duration-200 space-y-3">
      {/* Top TradingView-Grade Indicator Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
          <span className="font-bold">المؤشرات والطبقات الفنية:</span>
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showEMA20
                ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            EMA 20
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showEMA50
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            EMA 50
          </button>

          <button
            onClick={() => setShowSMA200(!showSMA200)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showSMA200
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            SMA 200
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showBollinger
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            Bollinger
          </button>

          <button
            onClick={() => setShowSR(!showSR)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showSR
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            الدعم والمقاومة
          </button>

          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showRSI
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            RSI (14)
          </button>

          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              showMACD
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            MACD (12,26,9)
          </button>
        </div>
      </div>

      {/* Main Candlestick Panel */}
      <div className="relative">
        <div ref={mainContainerRef} className="w-full rounded-xl overflow-hidden" />
      </div>

      {/* Panel 2: RSI Sub-Panel */}
      {showRSI && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold px-1 text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5" />
              <span>Relative Strength Index (RSI 14)</span>
            </span>
            <span className="text-[10px] font-mono">مناطق التشبع: 70 بيع / 30 شراء</span>
          </div>
          <div ref={rsiContainerRef} className="w-full rounded-xl overflow-hidden" />
        </div>
      )}

      {/* Panel 3: MACD Sub-Panel */}
      {showMACD && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold px-1 text-slate-500">
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>MACD (12, 26, 9) Histogram & Convergence</span>
            </span>
            <span className="text-[10px] font-mono">خط الماكد (أزرق) • خط الإشارة (برتقالي)</span>
          </div>
          <div ref={macdContainerRef} className="w-full rounded-xl overflow-hidden" />
        </div>
      )}
    </div>
  );
}
