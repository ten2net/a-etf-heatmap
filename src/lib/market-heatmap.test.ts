import { describe, expect, it } from "vitest";

import { classifyEtf } from "@/lib/etf-classify";
import { isMarketKey, parseTencentQuoteBatch, parseStockCodeList, periodFromMetricKey } from "@/lib/market-heatmap";

function tencentQuote(symbol: string, name: string, price: string, changePct: string, turnoverRate: string) {
  const fields = Array(71).fill("");
  fields[1] = name;
  fields[3] = price;
  fields[4] = price;
  fields[30] = "20261030150000";
  fields[32] = changePct;
  fields[37] = "123456";
  fields[38] = turnoverRate;
  fields[62] = "12.5";
  fields[63] = "3.2";
  fields[70] = "8.8";
  return `v_${symbol}="${fields.join("~")}";`;
}

describe("腾讯行情解析", () => {
  it("解析价格、涨跌与成交额", () => {
    const raw = [
      tencentQuote("sh510300", "沪深300ETF华泰柏瑞", "4.092", "0.17", "11.24"),
      tencentQuote("sz159915", "创业板ETF易方达", "2.403", "-2.83", "-"),
    ].join("\n");

    const result = parseTencentQuoteBatch(raw);

    expect(result.quotes["510300.SH"]).toMatchObject({
      price: 4.092,
      turnoverAmount: 1_234_560_000,
      turnoverRate: 11.24,
      changes: { day: 0.17, week: 3.2, month: 8.8, year: 12.5 },
    });
    expect(result.quotes["159915.SZ"].turnoverRate).toBeUndefined();
    expect(result.names["510300.SH"]).toBe("沪深300ETF华泰柏瑞");
  });
});

describe("ETF 归类", () => {
  it("宽基 / 行业 / 跨境 / 商品 / 债券 / 货币归类", () => {
    expect(classifyEtf("510300.SH", "沪深300ETF华泰柏瑞").family).toBe("broad");
    expect(classifyEtf("512880.SH", "证券ETF国泰").subBoardName).toBe("金融");
    expect(classifyEtf("513100.SH", "纳指ETF国泰").family).toBe("crossborder");
    expect(classifyEtf("518880.SH", "黄金ETF华安").family).toBe("commodity");
    expect(classifyEtf("511010.SH", "国债ETF").family).toBe("bond");
    expect(classifyEtf("511880.SH", "银华日利ETF").family).toBe("money");
  });
});

describe("参数解析", () => {
  it("市场键与代码列表", () => {
    expect(isMarketKey("broad")).toBe(true);
    expect(isMarketKey("zza50")).toBe(false);
    expect(parseStockCodeList("510300.SH,159915.SZ,bad")).toEqual(["510300.SH", "159915.SZ"]);
    expect(periodFromMetricKey("2")).toBe("week");
  });
});
