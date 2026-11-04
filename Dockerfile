# 多阶段构建：deps → build → runner
# 注意：standalone 输出只包含 server，需要单独拷贝 .next/static 和 public/
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 子路径部署前缀（如 /etf），构建期内联到客户端代码
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
# alpine 镜像不含 tzdata，显式安装以支持 TZ 设置
RUN apk add --no-cache tzdata
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TZ=Asia/Shanghai
# 行情批量拉取会占用堆内存，显式限制 V8 堆上限
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
