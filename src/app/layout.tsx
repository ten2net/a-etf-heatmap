import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "A 股 ETF 热力图 | ETF 大盘云图",
  description: "A 股 ETF 热力图，开源免费的 ETF 云图，覆盖沪深两市全部场内 ETF，支持板块分组、涨跌颜色、缩放、平移、全屏与截图分享。",
  keywords: ["ETF 热力图", "ETF 大盘云图", "ETF 图表", "行情地图", "板块热力图", "ETF heatmap", "China ETF heatmap"],
  metadataBase: new URL("https://etf.dapan.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "A 股 ETF 热力图 | ETF 大盘云图",
    description: "用一张可交互热力图快速观察 A 股 ETF 板块轮动与资金流向。",
    url: "/",
    siteName: "A 股 ETF 热力图 | ETF 大盘云图",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "A 股 ETF 热力图 - 开源免费",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A 股 ETF 热力图 | ETF 大盘云图",
    description: "用一张可交互热力图快速观察 A 股 ETF 板块轮动与资金流向。",
    images: ["/og-image.png"],
  },
};

const themeInitScript = `
  try {
    const displayMode = window.localStorage.getItem("heatmap-display-mode");
    const isDark = displayMode !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="min-h-dvh antialiased dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          defer
          src="https://vibeloft.ai/telemetry/v1.js"
          data-vl-product-id="8b8a5508-0aeb-4917-83a4-c8d6f5ece702"
          data-vl-auth-key="vl_web.YE4bgecRx9HGPM3CglWnBzMiindBvSnCiLq3EG4SPoc"
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
