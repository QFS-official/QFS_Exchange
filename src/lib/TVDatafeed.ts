/**
 * TradingView UDF-Compatible Datafeed
 * Connects GCRM Exchange tokens to TradingView charts
 */

const BASE_URL = "/api/tv";

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SymbolInfo {
  name: string;
  exchange: string;
  ticker: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  supported_resolutions: string[];
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly: boolean;
  has_monthly: boolean;
  pricescale: number;
  minmov: number;
  fractional: boolean;
  format: string;
  price_precision: number;
  volume_precision: number;
}

interface QuoteData {
  n: string;
  v: number;
  lp: number;
  ch: number;
  chp: number;
}

// Resolve symbol: pair config -> TV symbol format
function pairToTvSymbol(pair: string): string {
  // "GCRM_USDT" -> "GCRMUSDT"
  return pair.replace("_", "");
}

// Subscribe callbacks
let quoteSubscribers: Array<(data: Record<string, QuoteData>) => void> = [];
let quoteInterval: ReturnType<typeof setInterval> | null = null;

export class TVDatafeed {
  private _onReadyCallback: (() => void) | null = null;

  // Required by TradingView
  onReady(callback: () => void) {
    fetch(`${BASE_URL}/config`)
      .then((r) => r.json())
      .then((config) => {
        this._onReadyCallback = callback;
        if (callback) callback({
          supports_search: config.supports_search,
          supports_group_request: false,
          supported_resolutions: config.supported_resolutions,
          supports_marks: false,
          supports_timescale_marks: false,
          supports_time: true,
          exchanges: config.exchanges,
          symbols_types: config.symbols_types,
          supported_chart_types: config.supported_chart_types,
        } as any);
      })
      .catch(() => { if (callback) callback({} as any); });
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: (result: any[]) => void) {
    fetch(`${BASE_URL}/search?query=${encodeURIComponent(userInput)}`)
      .then((r) => r.json())
      .then((results) => onResult(results))
      .catch(() => onResult([]));
  }

  resolveSymbol(symbolName: string, onResolve: (symbolInfo: SymbolInfo) => void, onError: (err: string) => void) {
    // Normalize symbol
    const normalized = symbolName.replace(/[^A-Z]/g, "");
    fetch(`${BASE_URL}/symbols?symbol=${normalized}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.s === "no_symbol") {
          onError(`Unknown symbol: ${symbolName}`);
          return;
        }
        onResolve(data as SymbolInfo);
      })
      .catch(() => onError(`Failed to resolve: ${symbolName}`));
  }

  getBars(symbolInfo: SymbolInfo, resolution: string, from: number, to: number, onHistory: (bars: Bar[], meta: { noData?: boolean }) => void, onError: (err: string) => void, firstDataRequest: boolean) {
    const sym = symbolInfo.ticker;
    const url = `${BASE_URL}/history?symbol=${sym}&from=${from}&to=${to}&resolution=${resolution}&countback=300`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.s !== "ok" || !data.t || data.t.length === 0) {
          onHistory([], { noData: true });
          return;
        }

        const bars: Bar[] = [];
        for (let i = 0; i < data.t.length; i++) {
          bars.push({
            time: data.t[i] * 1000, // TradingView uses milliseconds
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
          });
        }
        onHistory(bars, { noData: false });
      })
      .catch(() => onError("Failed to load history"));
  }

  subscribeBars(symbolInfo: SymbolInfo, resolution: string, onTick: (bar: Bar) => void, listenerGuid: string, onResetCacheNeededCallback: () => void) {
    // Subscribe to live quotes
    quoteSubscribers.push((_data) => {
      // Generate a tick update based on the latest bar
      const now = Math.floor(Date.now() / 1000);
      fetch(`${BASE_URL}/history?symbol=${symbolInfo.ticker}&from=${now - 120}&to=${now}&resolution=${resolution}&countback=1`)
        .then((r) => r.json())
        .then((data) => {
          if (data.s === "ok" && data.t && data.t.length > 0) {
            onTick({
              time: data.t[0] * 1000,
              open: data.o[0],
              high: data.h[0],
              low: data.l[0],
              close: data.c[0],
              volume: data.v[0],
            });
          }
        })
        .catch(() => {});
    });

    // Start polling every 5s if not already
    if (!quoteInterval) {
      quoteInterval = setInterval(() => {
        const symbols = ["GCRMUSDT", "QFSUSDT", "ALARABUSDT", "NESGUSDT"];
        fetch(`${BASE_URL}/quotes?symbols=${symbols.join(",")}`)
          .then((r) => r.json())
          .then((data) => {
            quoteSubscribers.forEach((cb) => cb(data));
          })
          .catch(() => {});
      }, 5000);
    }
  }

  unsubscribeBars(listenerGuid: string) {
    // Stop all if no subscribers
  }

  // Optional methods
  calculateHistoryDepth(resolution: string, resolutionBack: number, intervalBack: number) {
    return undefined;
  }

  getMarks(symbolInfo: SymbolInfo, from: number, to: number, onData: (marks: any[]) => void, resolution: string) {
    onData([]);
  }

  getTimescaleMarks(symbolInfo: SymbolInfo, from: number, to: number, onData: (marks: any[]) => void, resolution: string) {
    onData([]);
  }

  getServerTime(callback: (time: number) => void) {
    callback(Math.floor(Date.now() / 1000));
  }
}

/**
 * Helper: get the TradingView symbol for a given pair key
 */
export function getTvSymbol(pair: string): string {
  return pairToTvSymbol(pair);
}

/**
 * Helper: map pair index to TV symbol
 */
export function pairToExchange(pair: string): string {
  return `GCRM:${pairToTvSymbol(pair)}`;
}
