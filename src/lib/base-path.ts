/**
 * 部署在反代子路径（如 /etf）时的应用前缀。
 *
 * 由 next.config.ts 的 basePath 与本常量共用同一个环境变量
 * NEXT_PUBLIC_BASE_PATH：前者让 Next 的路由/静态资源挂到子路径，
 * 后者供客户端 fetch 与 <img> 等手动拼 URL 时使用（构建期内联）。
 */
export const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 拼接应用内绝对路径：withBasePath("/api/health") → "/etf/api/health"。 */
export function withBasePath(path: string): string {
  return `${appBasePath}${path}`;
}
