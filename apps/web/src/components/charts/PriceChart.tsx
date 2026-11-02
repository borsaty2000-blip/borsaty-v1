'use client';

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  IPriceLine,
  LineStyle,
} from 'lightweight-charts';
import { useApp } from '@/context/AppContext';
import { useBorsaty } from '@/context/BorsatyContext';
import { X, Sparkles } from 'lucide-react';

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

export function PriceChart({
  candles,
  height = 420,
  symbol = 'COMI',
  currency = 'EGP',
  onCrosshairMove,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const patternSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const { theme, direction } = useApp();
  const { activeHighlight, clearHighlight } = useBorsaty();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Premium Investing-grade styling for both light and dark
    const bg = isDark ? '#0b1120' : '#ffffff';
    const text = isDark ? '#94a3b8' : '#475569';
    const grid = isDark ? '#1e293b' : '#f1f5f9';
    const border = isDark ? '#334155' : '#e2e8f0';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
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
          labelBackgroundColor: isDark ? '#1e293b' : '#334155',
        },
        horzLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1e293b' : '#334155',
        },
      },
    });

    chartRef.current = chart;

    // Up: Emerald-500, Down: Rose-500
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceScaleId: direction === 'rtl' ? 'left' : 'right',
    });

    seriesRef.current = candlestickSeries;

    // Format & map candles
    const formattedData: CandlestickData<Time>[] = candles
      .filter((c) => c && c.time && c.open && c.high && c.low && c.close)
      .map((c) => {
        let timeVal: Time;
        if (typeof c.time === 'number') {
          timeVal = c.time as Time;
        } else {
          timeVal = String(c.time).slice(0, 10) as Time;
        }
        return {
          time: timeVal,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        };
      })
      .sort((a, b) => (a.time > b.time ? 1 : -1));

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // Crosshair listener
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (!param.point || !param.seriesData) {
          onCrosshairMove(null);
          return;
        }
        const data = param.seriesData.get(candlestickSeries) as CandlestickData;
        if (data && typeof data.close === 'number') {
          onCrosshairMove(data.close);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, height, isDark, direction]);

  // Handle Dynamic Interactive Highlighting (Harmonics, Elliott, Trade Plan Levels)
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    // 1. Remove previous price lines
    priceLinesRef.current.forEach((pl) => {
      try {
        series.removePriceLine(pl);
      } catch {
        // ignore
      }
    });
    priceLinesRef.current = [];

    // 2. Remove previous pattern line series
    if (patternSeriesRef.current) {
      try {
        chart.removeSeries(patternSeriesRef.current);
      } catch {
        // ignore
      }
      patternSeriesRef.current = null;
    }

    // 3. Clear previous markers
    if (markersRef.current) {
      try {
        markersRef.current.setMarkers([]);
      } catch {
        // ignore
      }
      markersRef.current = null;
    }

    if (!activeHighlight) return;

    // A. Draw Price Lines (Entry, SL, Targets)
    if (activeHighlight.priceLevels) {
      const { entry, stopLoss, targets } = activeHighlight.priceLevels;

      if (entry && entry.length > 0) {
        entry.forEach((lvl, idx) => {
          const pl = series.createPriceLine({
            price: lvl,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: entry.length > 1 ? `Entry ${idx + 1}` : 'Entry',
          });
          priceLinesRef.current.push(pl);
        });
      }

      if (stopLoss) {
        const pl = series.createPriceLine({
          price: stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Stop Loss',
        });
        priceLinesRef.current.push(pl);
      }

      if (targets && targets.length > 0) {
        targets.forEach((tgt, idx) => {
          const pl = series.createPriceLine({
            price: tgt,
            color: '#10b981',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Target ${idx + 1}`,
          });
          priceLinesRef.current.push(pl);
        });
      }
    }

    // B. Draw Pattern Line Series & Markers (X-A-B-C-D or 1-2-3-4-5)
    if (activeHighlight.points && activeHighlight.points.length > 0) {
      const sortedPoints = [...activeHighlight.points]
        .map((p) => ({
          time: (typeof p.time === 'number' ? p.time : String(p.time).slice(0, 10)) as Time,
          value: p.price,
          label: p.label,
          color: p.color || '#06b6d4',
        }))
        .sort((a, b) => (a.time > b.time ? 1 : -1));

      // Connecting pattern line
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

      // Markers on candles
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
        // fallback if markers primitive encounters time sync issue
      }
    }
  }, [activeHighlight, direction]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] p-3 shadow-sm transition-colors duration-200">
      {/* Top chart details bar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 dark:text-white font-extrabold text-sm tracking-tight">
            {symbol}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {currency}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>1D Interactive Candle</span>
        </div>
      </div>

      {/* Floating Active Pattern / Level Highlight Banner */}
      {activeHighlight && (
        <div className="absolute top-14 start-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold backdrop-blur shadow-lg border border-cyan-500/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {activeHighlight.type === 'harmonic' && 'Harmonic: '}
            {activeHighlight.type === 'elliott' && 'Elliott: '}
            {activeHighlight.type === 'trade_plan' && 'Trade Plan: '}
            {activeHighlight.name}
          </span>
          <button
            onClick={clearHighlight}
            className="ms-2 p-1 rounded-md hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title="Clear highlight"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full" style={{ height }} />
    </div>
  );
}
