#!/usr/bin/env node

/**
 * 刷新 ETF 名册快照（src/lib/data/etf-catalog.json）。
 *
 * 数据源（按优先级）：
 *   1. 东方财富基金代码表 fundcode_search.js（全量基金，按场内代码段过滤）；
 *   2. 沪深交易所公开接口（深交所 ETF 列表 + 上交所基金列表）作为补充。
 *
 * 流程：拉取 → 合并去重 → 规则归类（src/lib/etf-classify.ts）→ 校验 → 原子写入。
 *
 * 用法：
 *   pnpm refresh:catalog        写入快照
 *   pnpm check:catalog          只校验，不写文件
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { classifyEtf } from "../src/lib/etf-classify.ts";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(repositoryRoot, "src/lib/data/etf-catalog.json");
const checkOnly = process.argv.includes("--check");

const requestHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; AEtfHeatmap/1.0)",
  Accept: "application/json, text/plain, */*",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 沪深两市场内 ETF 代码段：158/159（深），510-519、520/526/530、560-563、581/588/589（沪）。
const etfCodePrefixPattern = /^(158|159|51[0-9]|52[06]|530|56[0-3]|58[189])/;

async function fetchText(url, referer) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { ...requestHeaders, ...(referer ? { Referer: referer } : {}) },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      await sleep(300 * attempt * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("request failed");
}

async function fetchJson(url, referer) {
  return JSON.parse(await fetchText(url, referer));
}

function stripAnchor(html) {
  const text = String(html ?? "");
  const start = text.indexOf("<u>");
  const end = text.indexOf("</u>");
  return start >= 0 && end > start ? text.slice(start + 3, end).trim() : "";
}

/** 东方财富基金代码表：取场内代码段且简称含 ETF、排除联接基金。 */
async function fetchEastmoneyEtfs() {
  const text = await fetchText("https://fund.eastmoney.com/js/fundcode_search.js");
  const pattern = /\["(\d{6})","([^"]*)","([^"]*)","([^"]*)","([^"]*)"\]/g;
  const rows = [];

  for (const match of text.matchAll(pattern)) {
    const code = match[1];
    const name = match[3].trim();
    if (!etfCodePrefixPattern.test(code) || !name) {
      continue;
    }
    if (!/ETF/i.test(name) || /联接/.test(name)) {
      continue;
    }
    const exchange = code.startsWith("1") ? "SZ" : "SH";
    rows.push({ code: `${code}.${exchange}`, name });
  }

  if (rows.length === 0) {
    throw new Error("Eastmoney fund list is empty");
  }
  return rows;
}

/** 深交所 ETF 列表（备用源）。 */
async function fetchShenzhenEtfs() {
  const pageSize = 100;
  const rows = [];
  let pageCount = 1;

  for (let page = 1; page <= pageCount; page += 1) {
    const url =
      "https://www.szse.cn/api/report/ShowReport/data?SHOWTYPE=JSON&CATALOGID=1945" +
      `&tab1PAGENO=${page}&tab1PAGESIZE=${pageSize}&random=${Math.random().toString().slice(2, 10)}`;
    const payload = await fetchJson(url, "https://www.szse.cn/");
    const table = Array.isArray(payload) ? payload[0] : null;
    if (!table || !Array.isArray(table.data)) {
      throw new Error("SZSE ETF list payload is invalid");
    }

    pageCount = Math.max(1, Math.ceil(Number(table.metadata?.recordcount ?? 0) / pageSize));

    for (const row of table.data) {
      const code = stripAnchor(row.sys_key);
      const name = stripAnchor(row.kzjcurl);
      if (/^\d{6}$/.test(code) && name) {
        rows.push({ code: `${code}.SZ`, name });
      }
    }
  }

  return rows;
}

/** 上交所基金列表（备用源），fundType=00 均为 ETF。 */
async function fetchShanghaiEtfs() {
  const url =
    "https://query.sse.com.cn/commonSoaQuery.do?sqlId=FUND_LIST&fundType=00" +
    "&pageHelp.pageSize=5000&pageHelp.pageNo=1&pageHelp.beginPage=1&pageHelp.cacheSize=1&pageHelp.endPage=1";
  const payload = await fetchJson(url, "https://www.sse.com.cn/");
  const list = payload?.pageHelp?.data;
  if (!Array.isArray(list)) {
    throw new Error("SSE fund list payload is invalid");
  }

  const rows = [];
  for (const row of list) {
    const code = String(row.fundCode ?? "").trim();
    // secNameFull 与行情简称一致（如「沪深300ETF华泰柏瑞」），优先使用它。
    const name = String(row.secNameFull ?? row.fundAbbr ?? "").trim();
    if (!/^\d{6}$/.test(code) || !name) {
      continue;
    }
    rows.push({ code: `${code}.SH`, name });
  }

  return rows;
}

function dedupe(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.code)) {
      map.set(row.code, row);
    }
  }
  return Array.from(map.values());
}

function buildCatalog(rows) {
  const etfs = rows
    .map(({ code, name }) => {
      const { family, boardName, subBoardName } = classifyEtf(code, name);
      return { code, name, family, boardName, subBoardName };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    updatedAt: new Date().toISOString(),
    count: etfs.length,
    etfs,
  };
}

export function validateCatalog(next, previous) {
  if (next.count < 800) {
    throw new Error(`ETF catalog is too small: ${next.count}`);
  }

  const codes = new Set(next.etfs.map((etf) => etf.code));
  if (codes.size !== next.etfs.length) {
    throw new Error(`ETF codes are not unique: ${next.etfs.length - codes.size} duplicates`);
  }

  if (previous?.count && next.count < previous.count * 0.9) {
    throw new Error(`ETF count dropped unexpectedly: ${previous.count} -> ${next.count}`);
  }

  const previousCodes = new Set((previous?.etfs ?? []).map((etf) => etf.code));
  const removed = Array.from(previousCodes).filter((code) => !codes.has(code)).length;
  const maxRemoved = Math.max(20, Math.ceil(previousCodes.size * 0.02));
  if (removed > maxRemoved) {
    throw new Error(`Too many ETFs disappeared: ${removed} > ${maxRemoved}`);
  }
}

async function readPrevious() {
  try {
    return JSON.parse(await fs.readFile(catalogPath, "utf8"));
  } catch {
    return null;
  }
}

export async function loadEtfRows() {
  const primary = await fetchEastmoneyEtfs().catch((error) => {
    console.warn("Eastmoney fund list failed:", error.message);
    return [];
  });

  const exchanges = primary.length > 0
    ? []
    : await Promise.all([
        fetchShenzhenEtfs().catch((error) => {
          console.warn("SZSE ETF list failed:", error.message);
          return [];
        }),
        fetchShanghaiEtfs().catch((error) => {
          console.warn("SSE fund list failed:", error.message);
          return [];
        }),
      ]).then((lists) => lists.flat());

  const rows = dedupe([...primary, ...exchanges]);
  if (rows.length === 0) {
    throw new Error("No ETF rows were fetched from any source");
  }
  return rows;
}

async function main() {
  const rows = await loadEtfRows();
  const previous = await readPrevious();
  const next = buildCatalog(rows);

  validateCatalog(next, previous);

  const counts = {};
  for (const etf of next.etfs) {
    counts[etf.family] = (counts[etf.family] ?? 0) + 1;
  }
  console.log(`Fetched ${next.count} ETFs`, counts);

  if (checkOnly) {
    console.log("Catalog check passed (no files were written)");
    return;
  }

  const temporaryPath = `${catalogPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, catalogPath);
  console.log(`Wrote ${path.relative(repositoryRoot, catalogPath)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
