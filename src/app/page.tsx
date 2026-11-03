import { MarketHeatmap } from "@/components/market-heatmap";
import { defaultLocale } from "@/lib/i18n";

export default function HomePage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">A 股 ETF 热力图</h1>
      <p className="sr-only">
        ETF 热力图按类别与成交额权重展示沪深两市全部场内 ETF，用颜色呈现涨跌幅，支持缩放、拖拽、全屏与截图分享。
      </p>
      <MarketHeatmap locale={defaultLocale} />
    </main>
  );
}
