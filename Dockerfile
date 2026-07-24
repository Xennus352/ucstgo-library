FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

# ----------------------------------- build stage
FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm prisma generate
RUN pnpm build

# ----------------------------------- runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files and install production deps
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built app and runtime files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]