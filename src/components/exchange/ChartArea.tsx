"use client";

import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";
import { useState, useEffect, useRef, useCallback } from "react";
import { TVDatafeed, pairToExchange } from "@/lib/TVDatafeed";

const TIMEFRAMES = [
  { key: "1m", tv: "1" },
  { key: "5m", tv: "5" },
  { key: "15m", tv: "15" },
  { key: "1H", tv: "60" },
  { key: "4H", tv: "240" },
  { key: "1D", tv: "D" },
  { key: "1W", tv: "W" },
  { key: "1M", tv: "M" },
];
const CHART_TYPES = ["Candles", "Line", "Bars"];
const INDICATORS = ["MA", "EMA", "BOLL", "VOL", "MACD"];

// Canvas fallback chart
function generateCandles(basePrice: number, count: number, seed: string) {
  const candles = [];
  let price = basePrice * 0.95;
  // Simple deterministic seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const rng = () => { h = (h * 16807) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (rng() - 0.48) * basePrice * 0.015;
    const close = open + change;
    const high = Math.max(open, close) + rng() * basePrice * 0.005;
    const low = Math.min(open, close) - rng() * basePrice * 0.005;
    const vol = rng() * 1000 + 200;
    candles.push({ open, high, low, close, vol, time: Date.now() - (count - i) * 3600000 });
    price = close;
  }
  return candles;
}

function generateMA(candles: { close: number }[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push(0); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push(sum / period);
  }
  return result;
}

function CanvasChart({ currentPrice, isUp, pairSeed }: { currentPrice: number; isUp: boolean; pairSeed: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndicators] = useState<Set<string>>(new Set(["VOL"]));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const candles = generateCandles(currentPrice, 60, pairSeed);
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;
    const hasVol = activeIndicators.has("VOL");
    const volHeight = hasVol ? H * 0.15 : 0;
    const pad = { top: 16, bottom: 24 + volHeight, left: 6, right: 56 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barW = chartW / candles.length;

    ctx.fillStyle = "#0B0E11";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#1E2329";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const y = pad.top + (chartH / 6) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const priceLabel = maxP - (range / 6) * i;
      ctx.fillStyle = "#5E6673";
      ctx.font = "10px 'SF Mono', 'Fira Code', monospace";
      ctx.textAlign = "left";
      ctx.fillText(priceLabel.toFixed(4), W - pad.right + 5, y + 3);
    }

    ctx.fillStyle = "#5E6673";
    ctx.font = "10px 'SF Mono', monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < candles.length; i += 10) {
      const x = pad.left + i * barW + barW / 2;
      const t = new Date(candles[i].time);
      ctx.fillText(`${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`, x, H - 6);
    }

    if (activeIndicators.has("MA")) {
      const ma7 = generateMA(candles, 7);
      const ma25 = generateMA(candles, 25);
      [[ma7, "#F0B90B"], [ma25, "#627EEA"]].forEach(([ma, color]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
        let started = false;
        ma.forEach((v, i) => {
          if (v === 0) return;
          const x = pad.left + i * barW + barW / 2;
          const y = pad.top + ((maxP - v) / range) * chartH;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }

    candles.forEach((c, i) => {
      const x = pad.left + i * barW + barW / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? "#02C076" : "#F6465D";
      const highY = pad.top + ((maxP - c.high) / range) * chartH;
      const lowY = pad.top + ((maxP - c.low) / range) * chartH;
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();
      const openY = pad.top + ((maxP - c.open) / range) * chartH;
      const closeY = pad.top + ((maxP - c.close) / range) * chartH;
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillStyle = color;
      ctx.fillRect(x - barW * 0.35, bodyTop, barW * 0.7, bodyH);
    });

    if (hasVol) {
      const maxVol = Math.max(...candles.map((c) => c.vol));
      const volTop = H - volHeight;
      candles.forEach((c, i) => {
        const x = pad.left + i * barW;
        const isGreen = c.close >= c.open;
        const h = (c.vol / maxVol) * (volHeight - 10);
        ctx.fillStyle = isGreen ? "rgba(2,192,118,0.2)" : "rgba(246,70,93,0.2)";
        ctx.fillRect(x + barW * 0.15, volTop + volHeight - 10 - h, barW * 0.7, h);
      });
    }

    const curY = pad.top + ((maxP - currentPrice) / range) * chartH;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = isUp ? "#02C076" : "#F6465D";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(pad.left, curY); ctx.lineTo(W - pad.right, curY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isUp ? "#02C076" : "#F6465D";
    const tagW = 52; const tagH = 16;
    ctx.beginPath(); ctx.roundRect(W - pad.right, curY - tagH / 2, tagW, tagH, 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px 'SF Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText(currentPrice.toFixed(4), W - pad.right + tagW / 2, curY + 3);
  }, [currentPrice, isUp, pairSeed, activeIndicators]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// TradingView chart with custom datafeed
const TV_CHART_TYPE_MAP: Record<string, number> = {
  Candles: 1,
  Line: 2,
  Bars: 0,
};

function TradingViewChart({ tvSymbol, resolution, chartType }: { tvSymbol: string; resolution: string; chartType: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!(window as any).TradingView) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.onload = () => createWidget();
      containerRef.current.appendChild(script);
    } else {
      if (tvWidgetRef.current) {
        try { tvWidgetRef.current.remove(); } catch {}
        tvWidgetRef.current = null;
        chartRef.current = null;
      }
      containerRef.current.innerHTML = "";
      createWidget();
    }

    function createWidget() {
      if (!containerRef.current || !(window as any).TradingView) return;

      const datafeed = new TVDatafeed();

      tvWidgetRef.current = new (window as any).TradingView.widget({
        container_id: containerRef.current.id || "tv-chart-container",
        symbol: tvSymbol,
        interval: resolution,
        datafeed: datafeed,
        library_path: "/charting_library/",
        locale: "en",
        disabled_features: ["header_symbol_search", "symbol_search_hot_key"],
        enabled_features: ["study_templates"],
        theme: "dark",
        autosize: true,
        backgroundColor: "rgba(11, 14, 17, 1)",
        gridColor: "rgba(30, 35, 41, 0.5)",
        studies: ["MAExp@tv-basicstudies", "RSI@tv-basicstudies"],
        toolbar_bg: "rgba(11, 14, 17, 1)",
        allow_symbol_change: false,
        save_image: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
        withdateranges: true,
        details: true,
      });

      // Get chart instance once ready
      tvWidgetRef.current.onChartReady(() => {
        chartRef.current = tvWidgetRef.current.chart();
        // Apply initial chart type
        const tvType = TV_CHART_TYPE_MAP[chartType];
        if (tvType !== undefined && chartRef.current) {
          chartRef.current.setChartType(tvType);
        }
      });
    }

    return () => {
      if (tvWidgetRef.current) {
        try { tvWidgetRef.current.remove(); } catch {}
        tvWidgetRef.current = null;
        chartRef.current = null;
      }
    };
  }, [tvSymbol, resolution]);

  // Switch chart type without full widget recreation
  useEffect(() => {
    if (chartRef.current) {
      const tvType = TV_CHART_TYPE_MAP[chartType];
      if (tvType !== undefined) {
        chartRef.current.setChartType(tvType);
      }
    }
  }, [chartType]);

  return <div ref={containerRef} id="tv-chart-container" className="w-full h-full" />;
}

export function ChartArea() {
  const { selectedPairIndex, prices } = useExchangeStore();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const [tf, setTf] = useState("60");
  const [chartType, setChartType] = useState("Candles");
  const [chartMode, setChartMode] = useState<"tradingview" | "canvas">("tradingview");
  const priceData = prices[pair.base.cgId ?? ""];
  const currentPrice = priceData?.usd ?? 1.245;
  const change = priceData?.usd_24h_change ?? 4.32;
  const isUp = change >= 0;

  const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;
  const tvSymbol = pairToExchange(pairKey);
  const pairSeed = pair.base.symbol + pair.quote.symbol;

  const handleTfChange = (t: string) => {
    setTf(t);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E11]">
      {/* Chart toolbar */}
      <div className="bg-[#1E2329] px-3 py-1 flex items-center space-x-2 border-b border-[#2B3139] shrink-0">
        {/* Chart mode toggle */}
        <button
          onClick={() => setChartMode(chartMode === "tradingview" ? "canvas" : "tradingview")}
          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
            chartMode === "tradingview" ? "bg-[#F0B90B]/15 text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"
          }`}
        >
          TradingView
        </button>

        <div className="w-px h-4 bg-[#2B3139]" />

        {/* Chart type buttons */}
        <div className="flex items-center bg-[#2B3139] rounded p-0.5">
          {CHART_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                chartType === t ? "bg-[#363C45] text-white" : "text-[#5E6673] hover:text-[#848E9C]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[#2B3139]" />

        {/* Timeframes */}
        <div className="flex items-center space-x-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTfChange(t.tv)}
              className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                tf === t.tv
                  ? "bg-[#F0B90B] text-black"
                  : "text-[#5E6673] hover:text-[#848E9C] hover:bg-[#2B3139]"
              }`}
            >
              {t.key}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[#2B3139]" />

        {/* Indicators (canvas mode only) */}
        {chartMode === "canvas" && (
          <div className="flex items-center space-x-1">
            {INDICATORS.map((ind) => (
              <button
                key={ind}
                className={`px-1.5 py-1 rounded text-[10px] font-semibold transition bg-[#2B3139] text-[#5E6673] hover:text-[#848E9C]`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Pair info badge */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-[#F0B90B] font-semibold">{pair.base.symbol}</span>
          <span className="text-[10px] text-[#5E6673]">/</span>
          <span className="text-[10px] text-[#848E9C]">{pair.quote.symbol}</span>
        </div>
      </div>

      {/* Chart content */}
      <div className="flex-1 overflow-hidden">
        {chartMode === "tradingview" ? (
          <TradingViewChart tvSymbol={tvSymbol} resolution={tf} chartType={chartType} />
        ) : (
          <CanvasChart currentPrice={currentPrice} isUp={isUp} pairSeed={pairSeed} />
        )}
      </div>
    </div>
  );
}