"use client";

import React, { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  Time
} from "lightweight-charts";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  sma20?: number;
  ema20?: number;
  bbUpper?: number;
  bbLower?: number;
}

interface ChartProps {
  data: CandleData[];
  symbol: string;
  showSMA?: boolean;
  showEMA?: boolean;
  showBollinger?: boolean;
  targets?: Array<{ level: number; price: number; method: string }>;
  stopLoss?: { price: number; method: string };
}

export default function CandlestickChart({
  data,
  symbol,
  showSMA = true,
  showEMA = false,
  showBollinger = false,
  targets = [],
  stopLoss,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#232e48",
      },
      timeScale: {
        borderColor: "#232e48",
        timeVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: 480,
    });

    chartRef.current = chart;

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    // Format candle data
    const formattedCandles = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(formattedCandles);

    // SMA 20 Series
    if (showSMA) {
      const smaData = data
        .filter((d) => d.sma20 !== undefined && d.sma20 !== null)
        .map((d) => ({
          time: d.time as Time,
          value: d.sma20 as number,
        }));
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: "#38bdf8",
          lineWidth: 2,
          title: "SMA 20",
        });
        smaSeries.setData(smaData);
        smaSeriesRef.current = smaSeries;
      }
    }

    // EMA 20 Series
    if (showEMA) {
      const emaData = data
        .filter((d) => d.ema20 !== undefined && d.ema20 !== null)
        .map((d) => ({
          time: d.time as Time,
          value: d.ema20 as number,
        }));
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          title: "EMA 20",
        });
        emaSeries.setData(emaData);
        emaSeriesRef.current = emaSeries;
      }
    }

    // Bollinger Bands
    if (showBollinger) {
      const upperData = data
        .filter((d) => d.bbUpper !== undefined && d.bbUpper !== null)
        .map((d) => ({ time: d.time as Time, value: d.bbUpper as number }));
      const lowerData = data
        .filter((d) => d.bbLower !== undefined && d.bbLower !== null)
        .map((d) => ({ time: d.time as Time, value: d.bbLower as number }));

      if (upperData.length > 0 && lowerData.length > 0) {
        const bbUpper = chart.addSeries(LineSeries, {
          color: "rgba(168, 85, 247, 0.7)",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Upper",
        });
        bbUpper.setData(upperData);
        bbUpperSeriesRef.current = bbUpper;

        const bbLower = chart.addSeries(LineSeries, {
          color: "rgba(168, 85, 247, 0.7)",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Lower",
        });
        bbLower.setData(lowerData);
        bbLowerSeriesRef.current = bbLower;
      }
    }

    // Use createSeriesMarkers (spec rule: avoid setMarkers for performance in v5.0)
    if (data.length > 0) {
      const lastCandle = data[data.length - 1];
      const markers = [
        {
          time: lastCandle.time as Time,
          position: "aboveBar" as const,
          color: "#10b981",
          shape: "arrowUp" as const,
          text: `إشارة صاعدة (Confluence)`,
        },
      ];

      try {
        if (typeof createSeriesMarkers === "function") {
          createSeriesMarkers(candleSeries, markers);
        } else if ((candleSeries as any).setMarkers) {
          (candleSeries as any).setMarkers(markers);
        }
      } catch (err) {
        console.warn("createSeriesMarkers fallback:", err);
      }
    }

    // Horizontal Price Lines for Targets & Stop Loss
    targets.forEach((t) => {
      candleSeries.createPriceLine({
        price: t.price,
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `هدف ${t.level}: ${t.price} (${t.method})`,
      });
    });

    if (stopLoss) {
      candleSeries.createPriceLine({
        price: stopLoss.price,
        color: "#ef4444",
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `وقف الخسارة: ${stopLoss.price} (${stopLoss.method})`,
      });
    }

    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, showSMA, showEMA, showBollinger, targets, stopLoss]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1f293d] bg-[#111827]">
      <div className="p-3 bg-[#151d2e] border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{symbol}</span>
          <span className="text-gray-400">• الفريم اليومي (1D)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-0.5 bg-sky-400 rounded"></span>
            SMA 20
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded"></span>
            EMA 20
          </span>
          <span className="inline-flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-0.5 bg-purple-400 rounded"></span>
            Bollinger (20,2)
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            أهداف معلنة
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            وقف خسارة حتمي
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[480px]" />
    </div>
  );
}
