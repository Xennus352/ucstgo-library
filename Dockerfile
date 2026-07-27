FROM node:22-alpine AS base

# Prevent Corepack from prompting interactively and pin pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate


# ----------------------------------- build stage
FROM base AS builder

WORKDIR /app

# Copy dependency files first for Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies with strict dep builds disabled
RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false

# Copy application source
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env vars
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG GROQ_API_KEY
ARG DATABASE_URL

ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV GROQ_API_KEY=$GROQ_API_KEY
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client & build Next.js application
RUN pnpm prisma generate
RUN pnpm build


# ----------------------------------- runtime stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user and cache directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /home/nextjs/.cache && \
    chown -R nextjs:nodejs /home/nextjs

# Copy dependency files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml* ./

# Copy Next.js build output, public folder, and Prisma setup
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder /app/node_modules ./node_modules

# Ensure nextjs user owns the files
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]