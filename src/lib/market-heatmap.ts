import etfCatalogSnapshot from "@/lib/data/etf-catalog.json";

export const etfFamilyKeys = [
  "broad",
  "hangye",
  "crossborder",
  "commodity",
  "bond",
  "money",
  "other",
] as const;

export type EtfFamilyKey = (typeof etfFamilyKeys)[number];

export const marketKeys = [
  "all",
  "equity",
  "broad",
  "hangye",
  "crossborder",
  "commodity",
  "bond",
  "money",
  "sse",
  "szse",
] as const;

export type MarketKey = (typeof marketKeys)[number];

export const watchlistUniverseKey = "watchlist" as const;

export type HeatmapUniverse = MarketKey | typeof watchlistUniverseKey;

export const watchlistMaxCount = 500;

export const metricKeys = ["1", "2", "3", "4", "5", "6"] as const;

export type MetricKey = (typeof metricKeys)[number];

export const heatmapPeriodKeys = ["day", "week", "month", "year"] as const;

export type HeatmapPeriodKey = (typeof heatmapPeriodKeys)[number];

export type MarketDataSource = "direct" | "fallback" | "stale";
export const periodDataUnavailableCode = "PERIOD_DATA_UNAVAILABLE";

export class PeriodDataUnavailableError extends Error {
  constructor() {
    super(periodDataUnavailableCode);
  }
}

export type ExchangeCode = "SH" | "SZ";

type RemoteQuoteValue = {
  price: number;
  changes: Partial<Record<HeatmapPeriodKey, number>>;
  turnoverAmount: number;
  turnoverRate?: number;
};

type QuoteSnapshot = {
  timestamp: number;
  updatedAt: string;
  quotes: Record<string, RemoteQuoteValue>;
  etfs?: EtfSnapshot[];
  universeComplete?: boolean;
  source: "direct";
};

export type ProgressiveQuoteEvent =
  | {
      type: "start";
      totalCount: number;
    }
  | {
      type: "quotes";
      quotes: Record<string, QuoteValue>;
      loadedCount: number;
      totalCount: number;
      updatedAt: string;
    }
  | {
      type: "complete";
      loadedCount: number;
      totalCount: number;
      updatedAt: string;
      source: MarketDataSource;
    };

export type EtfSnapshot = {
  code: string;
  exchange: ExchangeCode;
  name: string;
  family: EtfFamilyKey;
  boardName: string;
  subBoardName: string;
  price: number;
  changePct: number;
  totalMarketCap: number;
  floatMarketCap: number;
  turnoverAmount?: number;
  turnoverRate?: number;
};

export type HeatmapStockNode = {
  code: string;
  name: string;
  boardName: string;
  subBoardName: string;
  value: number;
  exchange: ExchangeCode;
  price: number;
  changePct: number | null;
  turnoverAmount: number;
  turnoverRate: number;
};

export type HeatmapBoardNode = {
  code: string;
  name: string;
  value: number;
  stockCount: number;
  children: HeatmapStockNode[];
};

export type TreemapResponse = {
  market: MarketKey;
  period: HeatmapPeriodKey;
  updatedAt: string;
  stockCount: number;
  boardCount: number;
  summary: {
    advanceCount: number;
    flatCount: number;
    declineCount: number;
    turnoverAmount: number;
    turnoverPreviousAmount: number;
    turnoverDelta: number;
    indexChangePct?: number | null;
  };
  nodes: HeatmapBoardNode[];
  source: MarketDataSource;
};

export type QuoteValue = {
  price: number;
  changePct: number;
  turnoverAmount: number;
};

export type QuotesResponse = {
  market: MarketKey;
  metric?: MetricKey;
  period: HeatmapPeriodKey;
  updatedAt: string;
  quotes: Record<string, QuoteValue>;
  source: MarketDataSource;
};

export type EtfCatalogItem = {
  code: string;
  name: string;
  family: EtfFamilyKey;
  boardName: string;
  subBoardName: string;
};

export type EtfSearchItem = {
  code: string;
  name: string;
  boardName: string;
  subBoardName: string;
};

export type MarketOverviewItem = {
  market: MarketKey;
  changePct: number;
  stockCount: number;
  updatedAt: string;
};

export type MarketOverviewResponse = {
  period: HeatmapPeriodKey;
  updatedAt: string;
  markets: MarketOverviewItem[];
  source: MarketDataSource;
};

export function isMarketKey(value: string): value is MarketKey {
  return (marketKeys as readonly string[]).includes(value);
}

export function isMetricKey(value: string): value is MetricKey {
  return (metricKeys as readonly string[]).includes(value);
}

export function isHeatmapUniverse(value: string): value is HeatmapUniverse {
  return isMarketKey(value) || value === watchlistUniverseKey;
}

export function isHeatmapPeriodKey(value: string): value is HeatmapPeriodKey {
  return (heatmapPeriodKeys as readonly string[]).includes(value);
}

export function periodFromMetricKey(metric: MetricKey): HeatmapPeriodKey {
  switch (metric) {
    case "1":
      return "day";
    case "2":
      return "week";
    case "3":
      return "month";
    case "4":
      return "year";
    default:
      return "day";
  }
}

export function parseStockCodeList(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  const codes = raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^\d{6}\.(SH|SZ)$/.test(item));

  return Array.from(new Set(codes));
}

const catalog = etfCatalogSnapshot as {
  updatedAt: string;
  count: number;
  etfs: EtfCatalogItem[];
};

export const etfCatalog: EtfCatalogItem[] = catalog.etfs;

function toEtfSnapshot(item: EtfCatalogItem): EtfSnapshot {
  return {
    code: item.code,
    exchange: item.code.endsWith(".SH") ? "SH" : "SZ",
    name: item.name,
    family: item.family,
    boardName: item.boardName,
    subBoardName: item.subBoardName,
    price: 0,
    changePct: 0,
    totalMarketCap: 0,
    floatMarketCap: 0,
    turnoverAmount: 0,
    turnoverRate: 0,
  };
}

export const baselineEtfs: EtfSnapshot[] = etfCatalog.map(toEtfSnapshot);

const baselineEtfByCode = new Map(baselineEtfs.map((etf) => [etf.code, etf]));

export function searchEtfs(query: string, limit = 12): EtfSearchItem[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return [];
  }

  const scored: Array<{ item: EtfCatalogItem; score: number }> = [];

  for (const item of etfCatalog) {
    const name = item.name.toLowerCase();
    const code = item.code.toLowerCase();
    let score = -1;

    if (code === keyword || code.startsWith(keyword)) {
      score = 0;
    } else if (name === keyword) {
      score = 1;
    } else if (name.startsWith(keyword)) {
      score = 2;
    } else if (name.includes(keyword)) {
      score = 3;
    } else if (code.includes(keyword)) {
      score = 4;
    }

    if (score >= 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => a.score - b.score || a.item.code.localeCompare(b.item.code));

  return scored.slice(0, limit).map(({ item }) => ({
    code: item.code,
    name: item.name,
    boardName: item.boardName,
    subBoardName: item.subBoardName,
  }));
}

export function resolveStocksByCodes(rawCodes: string[]): EtfSnapshot[] {
  const result: EtfSnapshot[] = [];
  for (const code of rawCodes) {
    const etf = baselineEtfByCode.get(code);
    if (etf) {
      result.push(etf);
    }
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* 行情抓取（腾讯 qt.gtimg.cn 批量接口）                                          */
/* -------------------------------------------------------------------------- */

const tencentQuoteBaseUrl = "https://qt.gtimg.cn/q=";
const tencentBatchSize = 300;
const tencentConcurrency = 4;
const quoteCacheMs = 8_000;
const flatThreshold = 0.1;

const tencentRequestHeaders = {
  Referer: "https://gu.qq.com/",
  "User-Agent": "Mozilla/5.0 (compatible; AEtfHeatmap/1.0)",
  Accept: "*/*",
};

let quoteCache: QuoteSnapshot | null = null;
let quotePromise: Promise<QuoteSnapshot> | null = null;
let hasLoggedFallbackWarning = false;

type QuoteProgressListener = (batch: { updatedAt: string; quotes: Record<string, RemoteQuoteValue> }) => void;

const quoteProgressListeners = new Set<QuoteProgressListener>();

function publishQuoteProgress(batch: { updatedAt: string; quotes: Record<string, RemoteQuoteValue> }) {
  for (const listener of quoteProgressListeners) {
    try {
      listener(batch);
    } catch {
      // 单个监听器异常不影响其他订阅者。
    }
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value as string);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTencentTimestamp(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!/^\d{14}$/.test(raw)) {
    return "";
  }
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}+08:00`;
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function toTencentSymbol(code: string): string | null {
  const [symbol, exchange] = code.toUpperCase().split(".");
  if (!/^\d{6}$/.test(symbol ?? "")) {
    return null;
  }
  if (exchange === "SH") {
    return `sh${symbol}`;
  }
  if (exchange === "SZ") {
    return `sz${symbol}`;
  }
  return null;
}

function parseTencentSymbol(symbol: string): string | null {
  if (symbol.startsWith("sh")) {
    return `${symbol.slice(2)}.SH`;
  }
  if (symbol.startsWith("sz")) {
    return `${symbol.slice(2)}.SZ`;
  }
  return null;
}

// 腾讯行情字段：3=最新价，4=昨收，30=时间戳，32=当日涨跌幅，37=成交额(万元)，
// 38=换手率(%)，62=今年以来，63=近5日，70=近20日涨跌幅。
export function parseTencentQuoteBatch(rawText: string) {
  const quotes: Record<string, RemoteQuoteValue> = {};
  const names: Record<string, string> = {};
  let updatedAt = "";
  const pattern = /v_((?:sh|sz)\d{6})="([^"]*)";/g;

  for (const match of rawText.matchAll(pattern)) {
    const code = parseTencentSymbol(match[1]);
    if (!code) {
      continue;
    }

    const fields = match[2].split("~");
    if (fields.length <= 70) {
      continue;
    }

    const name = fields[1]?.trim();
    if (name) {
      names[code] = name;
    }

    const price = toFiniteNumber(fields[3]);
    const previousClose = toFiniteNumber(fields[4]);
    if (price === null || price <= 0 || previousClose === null || previousClose <= 0) {
      continue;
    }

    const dayChange = toFiniteNumber(fields[32]) ?? ((price - previousClose) / previousClose) * 100;
    const weekChange = toFiniteNumber(fields[63]);
    const monthChange = toFiniteNumber(fields[70]);
    const yearChange = toFiniteNumber(fields[62]);
    const turnoverWan = toFiniteNumber(fields[37]);
    const turnoverRate = toFiniteNumber(fields[38]);

    quotes[code] = {
      price,
      changes: {
        day: dayChange,
        ...(weekChange !== null && { week: weekChange }),
        ...(monthChange !== null && { month: monthChange }),
        ...(yearChange !== null && { year: yearChange }),
      },
      turnoverAmount: turnoverWan !== null ? turnoverWan * 10_000 : 0,
      ...(turnoverRate !== null && { turnoverRate }),
    };

    const timestamp = parseTencentTimestamp(fields[30]);
    if (timestamp && (!updatedAt || timestamp > updatedAt)) {
      updatedAt = timestamp;
    }
  }

  return { updatedAt, quotes, names };
}

async function fetchTencentQuoteBatch(symbols: string[]) {
  const response = await fetch(`${tencentQuoteBaseUrl}${symbols.join(",")}`, {
    headers: tencentRequestHeaders,
    next: { revalidate: 0 },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Tencent quote request failed: ${response.status}`);
  }

  // 腾讯行情为 GBK 编码，Node 的 TextDecoder 原生支持 gbk。
  return new TextDecoder("gbk").decode(await response.arrayBuffer());
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (true) {
        const current = nextIndex;
        nextIndex += 1;
        if (current >= items.length) {
          return;
        }
        results[current] = await worker(items[current]);
      }
    })
  );

  return results;
}

async function fetchLiveQuoteSnapshot(): Promise<QuoteSnapshot> {
  const symbols = baselineEtfs
    .map((etf) => toTencentSymbol(etf.code))
    .filter((symbol): symbol is string => symbol !== null);

  const batches: string[][] = [];
  for (let index = 0; index < symbols.length; index += tencentBatchSize) {
    batches.push(symbols.slice(index, index + tencentBatchSize));
  }

  const results = await mapWithConcurrency(batches, tencentConcurrency, async (batch) => {
    try {
      const parsed = parseTencentQuoteBatch(await fetchTencentQuoteBatch(batch));
      publishQuoteProgress(parsed);
      return parsed;
    } catch {
      return null;
    }
  });

  const successful = results.filter((result): result is NonNullable<typeof result> => result !== null);
  if (successful.length === 0) {
    throw new Error("Tencent ETF quote snapshot is empty");
  }

  const quotes: Record<string, RemoteQuoteValue> = {};
  const names: Record<string, string> = {};
  let updatedAt = "";

  for (const result of successful) {
    Object.assign(quotes, result.quotes);
    Object.assign(names, result.names);
    if (result.updatedAt && (!updatedAt || result.updatedAt > updatedAt)) {
      updatedAt = result.updatedAt;
    }
  }

  if (Object.keys(quotes).length === 0) {
    throw new Error("Tencent ETF quote snapshot has no valid quotes");
  }

  const etfs: EtfSnapshot[] = [];
  for (const baseline of baselineEtfs) {
    const quote = quotes[baseline.code];
    if (!quote) {
      continue;
    }
    etfs.push({
      ...baseline,
      name: names[baseline.code] ?? baseline.name,
      price: quote.price,
      changePct: quote.changes.day ?? 0,
      turnoverAmount: quote.turnoverAmount,
      turnoverRate: quote.turnoverRate ?? 0,
    });
  }

  return {
    timestamp: Date.now(),
    updatedAt: updatedAt || new Date().toISOString(),
    quotes,
    etfs,
    // 名册里可能包含已退市/暂停报价的品种，覆盖率阈值放宽。
    universeComplete: etfs.length >= baselineEtfs.length * 0.6,
    source: "direct",
  };
}

async function getQuoteSnapshot(): Promise<QuoteSnapshot> {
  if (quoteCache && Date.now() - quoteCache.timestamp < quoteCacheMs) {
    return quoteCache;
  }

  if (!quotePromise) {
    quotePromise = fetchLiveQuoteSnapshot()
      .then((snapshot) => {
        quoteCache = snapshot;
        return snapshot;
      })
      .finally(() => {
        quotePromise = null;
      });
  }

  return quotePromise;
}

/* -------------------------------------------------------------------------- */
/* 市场筛选                                                                     */
/* -------------------------------------------------------------------------- */

function matchesMarket(etf: EtfSnapshot, market: MarketKey): boolean {
  switch (market) {
    case "all":
      return true;
    case "equity":
      return etf.family !== "bond" && etf.family !== "money";
    case "broad":
    case "hangye":
    case "crossborder":
    case "commodity":
    case "bond":
    case "money":
      return etf.family === market;
    case "sse":
      return etf.exchange === "SH";
    case "szse":
      return etf.exchange === "SZ";
    default:
      return false;
  }
}

function filterEtfs(etfs: EtfSnapshot[], market: MarketKey): EtfSnapshot[] {
  return etfs.filter((etf) => matchesMarket(etf, market));
}

/* -------------------------------------------------------------------------- */
/* 行情派生                                                                     */
/* -------------------------------------------------------------------------- */

function getChangeForPeriod(
  changes: Partial<Record<HeatmapPeriodKey, number>> | undefined,
  period: HeatmapPeriodKey,
  fallback: number | null
): number | null {
  const value = changes?.[period];
  if (value !== undefined && Number.isFinite(value)) {
    return value;
  }
  if (period === "day") {
    return fallback !== null && Number.isFinite(fallback) ? fallback : null;
  }
  return null;
}

function getStockTurnoverAmount(stock: EtfSnapshot): number {
  return stock.turnoverAmount ?? 0;
}

function requirePeriodDataCoverage(
  stocks: EtfSnapshot[],
  quotes: Record<string, RemoteQuoteValue>,
  period: HeatmapPeriodKey
) {
  if (period === "day" || stocks.length === 0) {
    return;
  }

  const covered = stocks.filter((stock) => {
    const value = quotes[stock.code]?.changes[period];
    return value !== undefined && Number.isFinite(value);
  }).length;

  if (covered / stocks.length < 0.8) {
    throw new PeriodDataUnavailableError();
  }
}

function summarizeStocks(
  stocks: EtfSnapshot[],
  quotes: Record<string, RemoteQuoteValue>,
  period: HeatmapPeriodKey
) {
  let advanceCount = 0;
  let flatCount = 0;
  let declineCount = 0;
  let turnoverAmount = 0;

  for (const stock of stocks) {
    const quote = quotes[stock.code];
    const changePct = getChangeForPeriod(quote?.changes, period, stock.changePct);
    if (changePct === null) {
      continue;
    }
    if (changePct > flatThreshold) {
      advanceCount += 1;
    } else if (changePct < -flatThreshold) {
      declineCount += 1;
    } else {
      flatCount += 1;
    }
    turnoverAmount += quote?.turnoverAmount ?? getStockTurnoverAmount(stock);
  }

  return { advanceCount, flatCount, declineCount, turnoverAmount };
}

function weightedChangePct(
  stocks: EtfSnapshot[],
  quotes: Record<string, RemoteQuoteValue>,
  period: HeatmapPeriodKey
): number | null {
  let weightSum = 0;
  let weightedSum = 0;

  for (const stock of stocks) {
    const quote = quotes[stock.code];
    const changePct = getChangeForPeriod(quote?.changes, period, stock.changePct);
    if (changePct === null) {
      continue;
    }
    const weight = Math.max(quote?.turnoverAmount ?? stock.turnoverAmount ?? 0, 1);
    weightSum += weight;
    weightedSum += weight * changePct;
  }

  return weightSum > 0 ? weightedSum / weightSum : null;
}

function buildNodesFromStocks(
  stocks: EtfSnapshot[],
  quotes: Record<string, RemoteQuoteValue>,
  period: HeatmapPeriodKey
): HeatmapBoardNode[] {
  const boards = new Map<string, HeatmapBoardNode>();

  for (const stock of stocks) {
    const quote = quotes[stock.code];
    const changePct = getChangeForPeriod(quote?.changes, period, stock.changePct);
    const turnoverAmount = quote?.turnoverAmount ?? getStockTurnoverAmount(stock);
    const node: HeatmapStockNode = {
      code: stock.code,
      name: stock.name,
      boardName: stock.boardName,
      subBoardName: stock.subBoardName,
      value: 0,
      exchange: stock.exchange,
      price: quote?.price ?? stock.price,
      changePct,
      turnoverAmount,
      turnoverRate: quote?.turnoverRate ?? stock.turnoverRate ?? 0,
    };

    let board = boards.get(stock.boardName);
    if (!board) {
      board = {
        code: stock.boardName,
        name: stock.boardName,
        value: 0,
        stockCount: 0,
        children: [],
      };
      boards.set(stock.boardName, board);
    }
    board.children.push(node);
    board.stockCount += 1;
  }

  return Array.from(boards.values()).sort((a, b) => b.stockCount - a.stockCount);
}

function buildTreemapResponse(
  market: MarketKey,
  period: HeatmapPeriodKey,
  updatedAt: string,
  stocks: EtfSnapshot[],
  quotes: Record<string, RemoteQuoteValue>,
  source: MarketDataSource
): TreemapResponse {
  const nodes = buildNodesFromStocks(stocks, quotes, period);
  const summary = summarizeStocks(stocks, quotes, period);

  return {
    market,
    period,
    updatedAt,
    stockCount: stocks.length,
    boardCount: nodes.length,
    summary: {
      ...summary,
      turnoverPreviousAmount: 0,
      turnoverDelta: 0,
      indexChangePct: weightedChangePct(stocks, quotes, period),
    },
    nodes,
    source,
  };
}

export function getBundledSnapshotTreemap(
  market: MarketKey,
  period: HeatmapPeriodKey = "day"
): TreemapResponse {
  return getFallbackTreemapData(market, period);
}

function getFallbackTreemapData(market: MarketKey, period: HeatmapPeriodKey): TreemapResponse {
  return buildTreemapResponse(market, period, catalog.updatedAt, filterEtfs(baselineEtfs, market), {}, "fallback");
}

/* -------------------------------------------------------------------------- */
/* 对外接口                                                                     */
/* -------------------------------------------------------------------------- */

export async function streamQuoteData(options: {
  market: MarketKey;
  period: HeatmapPeriodKey;
  codes?: string[];
  signal?: AbortSignal;
  emit: (event: ProgressiveQuoteEvent) => void;
}) {
  const stocks = options.codes?.length
    ? resolveStocksByCodes(options.codes)
    : filterEtfs(baselineEtfs, options.market);
  const orderedStocks = [...stocks].sort((left, right) => (right.turnoverAmount ?? 0) - (left.turnoverAmount ?? 0));
  const allowedCodes = new Set(orderedStocks.map((stock) => stock.code));
  const deliveredCodes = new Set<string>();
  const totalCount = orderedStocks.length;
  let latestUpdatedAt = "";

  const emitBatch = (batch: { updatedAt: string; quotes: Record<string, RemoteQuoteValue> }) => {
    if (options.signal?.aborted) {
      return;
    }

    const quotes: Record<string, QuoteValue> = {};
    for (const [code, remoteQuote] of Object.entries(batch.quotes)) {
      if (!allowedCodes.has(code) || deliveredCodes.has(code)) {
        continue;
      }

      const changePct = getChangeForPeriod(remoteQuote.changes, options.period, null);
      if (changePct === null) {
        continue;
      }

      quotes[code] = {
        price: remoteQuote.price,
        changePct,
        turnoverAmount: remoteQuote.turnoverAmount,
      };
      deliveredCodes.add(code);
    }

    if (Object.keys(quotes).length === 0) {
      return;
    }

    if (batch.updatedAt && (!latestUpdatedAt || batch.updatedAt > latestUpdatedAt)) {
      latestUpdatedAt = batch.updatedAt;
    }

    options.emit({
      type: "quotes",
      quotes,
      loadedCount: deliveredCodes.size,
      totalCount,
      updatedAt: latestUpdatedAt,
    });
  };

  options.emit({ type: "start", totalCount });
  quoteProgressListeners.add(emitBatch);

  try {
    const snapshot = await getQuoteSnapshot();
    requirePeriodDataCoverage(stocks, snapshot.quotes, options.period);

    const finalEntries = orderedStocks
      .map((stock) => [stock.code, snapshot.quotes[stock.code]] as const)
      .filter((entry): entry is readonly [string, RemoteQuoteValue] => Boolean(entry[1]));

    for (let index = 0; index < finalEntries.length; index += 60) {
      emitBatch({
        updatedAt: snapshot.updatedAt,
        quotes: Object.fromEntries(finalEntries.slice(index, index + 60)),
      });
    }

    const source: MarketDataSource =
      totalCount === 0 || deliveredCodes.size >= totalCount * 0.9 ? "direct" : "stale";
    options.emit({
      type: "complete",
      loadedCount: deliveredCodes.size,
      totalCount,
      updatedAt: latestUpdatedAt || snapshot.updatedAt,
      source,
    });
  } finally {
    quoteProgressListeners.delete(emitBatch);
  }
}

export async function getTreemapData(
  market: MarketKey,
  period: HeatmapPeriodKey = "day"
): Promise<TreemapResponse> {
  // 首屏先用内置名册（无行情，面积按数量）秒开，后台同时拉取实时行情，
  // 下一次轮询即可切到真实数据。
  if (period === "day" && !quoteCache && !quotePromise) {
    void getQuoteSnapshot().catch(() => {});
    return getFallbackTreemapData(market, period);
  }

  const quoteResult = await Promise.allSettled([getQuoteSnapshot()]);

  if (quoteResult[0].status !== "fulfilled") {
    if (period !== "day") {
      throw new PeriodDataUnavailableError();
    }
    if (!hasLoggedFallbackWarning) {
      console.warn("Falling back to bundled ETF snapshot:", {
        quotes: quoteResult[0].reason,
      });
      hasLoggedFallbackWarning = true;
    }
    return getFallbackTreemapData(market, period);
  }

  hasLoggedFallbackWarning = false;

  const snapshot = quoteResult[0].value;
  const etfs = snapshot.etfs ?? baselineEtfs;
  const marketEtfs = filterEtfs(etfs, market);
  requirePeriodDataCoverage(marketEtfs, snapshot.quotes, period);

  return buildTreemapResponse(market, period, snapshot.updatedAt, marketEtfs, snapshot.quotes, "direct");
}

export async function getQuoteData(
  market: MarketKey,
  period: HeatmapPeriodKey = "day",
  metric?: MetricKey
): Promise<QuotesResponse> {
  if (period === "day" && !quoteCache && !quotePromise) {
    void getQuoteSnapshot().catch(() => {});
    return {
      market,
      period,
      metric,
      updatedAt: catalog.updatedAt,
      quotes: {},
      source: "fallback",
    };
  }

  const quoteResult = await Promise.allSettled([getQuoteSnapshot()]);

  if (quoteResult[0].status !== "fulfilled") {
    if (period !== "day") {
      throw new PeriodDataUnavailableError();
    }
    return {
      market,
      period,
      metric,
      updatedAt: catalog.updatedAt,
      quotes: {},
      source: "fallback",
    };
  }

  const snapshot = quoteResult[0].value;
  const marketEtfs = filterEtfs(snapshot.etfs ?? baselineEtfs, market);
  requirePeriodDataCoverage(marketEtfs, snapshot.quotes, period);

  const quotes: Record<string, QuoteValue> = {};
  for (const etf of marketEtfs) {
    const quote = snapshot.quotes[etf.code];
    const changePct = getChangeForPeriod(quote?.changes, period, etf.changePct);
    if (changePct === null) {
      continue;
    }
    quotes[etf.code] = {
      price: quote?.price ?? etf.price,
      changePct,
      turnoverAmount: quote?.turnoverAmount ?? getStockTurnoverAmount(etf),
    };
  }

  return {
    market,
    period,
    metric,
    updatedAt: snapshot.updatedAt,
    quotes,
    source: "direct",
  };
}

export async function getTreemapDataByCodes(
  rawCodes: string[],
  period: HeatmapPeriodKey = "day"
): Promise<TreemapResponse> {
  const fallbackEtfs = resolveStocksByCodes(rawCodes);
  const quoteResult = await Promise.allSettled([getQuoteSnapshot()]);

  if (quoteResult[0].status !== "fulfilled") {
    if (period !== "day") {
      throw new PeriodDataUnavailableError();
    }
    return buildTreemapResponse("all", period, catalog.updatedAt, fallbackEtfs, {}, "fallback");
  }

  const snapshot = quoteResult[0].value;
  const lookup = new Map((snapshot.etfs ?? baselineEtfs).map((etf) => [etf.code, etf]));
  const etfs = rawCodes.map((code) => lookup.get(code)).filter((etf): etf is EtfSnapshot => Boolean(etf));
  requirePeriodDataCoverage(etfs, snapshot.quotes, period);

  return buildTreemapResponse("all", period, snapshot.updatedAt, etfs, snapshot.quotes, "direct");
}

export async function getQuoteDataByCodes(
  rawCodes: string[],
  period: HeatmapPeriodKey
): Promise<QuotesResponse> {
  const treemap = await getTreemapDataByCodes(rawCodes, period);
  const quotes: Record<string, QuoteValue> = {};

  for (const board of treemap.nodes) {
    for (const etf of board.children) {
      if (etf.changePct === null) {
        continue;
      }
      quotes[etf.code] = {
        price: etf.price,
        changePct: etf.changePct,
        turnoverAmount: etf.turnoverAmount,
      };
    }
  }

  return {
    market: "all",
    period,
    updatedAt: treemap.updatedAt,
    quotes,
    source: treemap.source === "direct" ? "direct" : "stale",
  };
}

export async function getMarketOverviewData(
  period: HeatmapPeriodKey = "day"
): Promise<MarketOverviewResponse> {
  const quoteResult = await Promise.allSettled([getQuoteSnapshot()]);

  if (quoteResult[0].status !== "fulfilled") {
    if (period !== "day") {
      throw new PeriodDataUnavailableError();
    }
    return {
      period,
      updatedAt: catalog.updatedAt,
      markets: [],
      source: "fallback",
    };
  }

  const snapshot = quoteResult[0].value;
  const etfs = snapshot.etfs ?? baselineEtfs;

  const markets = marketKeys.map((market) => {
    const marketEtfs = filterEtfs(etfs, market);
    return {
      market,
      changePct: weightedChangePct(marketEtfs, snapshot.quotes, period) ?? 0,
      stockCount: marketEtfs.length,
      updatedAt: snapshot.updatedAt,
    };
  });

  return {
    period,
    updatedAt: snapshot.updatedAt,
    markets,
    source: "direct",
  };
}

export function searchStocks(query: string, limit?: number): EtfSearchItem[] {
  return searchEtfs(query, limit);
}
