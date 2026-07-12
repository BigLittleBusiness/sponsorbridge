# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# ─────────────────────────────────────────────
# Stage 2: Production runtime
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Copy server source (tRPC server runs from source via tsx in prod)
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/tsconfig.json ./

# Install tsx for server runtime
RUN pnpm add -D tsx

# Expose the app port (Cloud Run / ECS will inject PORT env var)
EXPOSE 3000

# Health check for ECS/ALB
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

# Start the server
CMD ["node", "--loader", "tsx", "server/_core/index.ts"]
