FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@vaultbill/worker...

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json /app/tsconfig.base.json ./
COPY --from=builder /app/apps/worker ./apps/worker
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "apps/worker/dist/index.js"]