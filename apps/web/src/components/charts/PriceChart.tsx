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
} from 'lightweight-charts';
import { useApp } from '@/context/AppContext';

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
  const { theme, direction } = useApp();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Premium Investing-grade styling for both light and dark
    const bg = isDark ? '#0b0f19' : '#ffffff';
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
          // Normalize string to YYYY-MM-DD
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

  return (
    <div className="relative w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-3 shadow-sm transition-colors duration-200">
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

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full" style={{ height }} />
    </div>
  );
}
