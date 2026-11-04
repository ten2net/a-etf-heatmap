import { NextRequest, NextResponse } from "next/server";

import { getEtfConstituentsData, parseStockCodeList } from "@/lib/market-heatmap";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const codes = parseStockCodeList(request.nextUrl.searchParams.get("code"));

  if (codes.length !== 1) {
    return NextResponse.json(
      {
        success: false,
        message: "Exactly one ETF code is required, e.g. ?code=510300.SH",
      },
      { status: 400 }
    );
  }

  try {
    const data = await getEtfConstituentsData(codes[0]);
    const response = NextResponse.json(data);
    // 重仓股为季度披露数据，边缘缓存 1 小时。
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load ETF constituents",
      },
      { status: 502 }
    );
  }
}
