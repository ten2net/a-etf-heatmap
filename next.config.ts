import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Origin-Agent-Cluster",
            value: "?1",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
