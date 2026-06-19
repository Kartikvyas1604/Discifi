FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY tsconfig.json ./

COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared/
COPY apps/backend apps/backend/

RUN pnpm --filter @discifi/backend build

RUN addgroup --system --gid 1001 discifi && \
    adduser --system --uid 1001 discifi

USER discifi

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/v1/health || exit 1

CMD ["node", "apps/backend/dist/server.js"]
