FROM node:22-alpine AS base

# Pin pnpm version for reproducible builds
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate


# ----------------------------------- build stage
FROM base AS builder

WORKDIR /app

# Copy dependency files first for Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies with approved build scripts from pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (Better Auth Prisma adapter needs this)
RUN pnpm prisma generate

# Build Next.js application
RUN pnpm build


# ----------------------------------- runtime stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000


# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs


# Copy dependency files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./


# Install production dependencies
RUN pnpm install --frozen-lockfile --prod


# Copy Next.js build output
COPY --from=builder /app/.next ./.next

# Static files
COPY --from=builder /app/public ./public


# Custom Next.js server
COPY --from=builder /app/server.js ./server.js


# Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma


# Better Auth / Prisma may need environment variables:
# DATABASE_URL
# BETTER_AUTH_SECRET
# BETTER_AUTH_URL
# should come from docker-compose env


USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]