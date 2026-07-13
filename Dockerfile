# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml ./
# patches/ must be present before pnpm install (wouter patch is referenced in package.json)
COPY patches ./patches
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
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder
COPY --from=builder /app/dist ./dist
# The Vite client build lands in dist/public; serveStatic looks for dist/public relative to dist/index.js
# which resolves to /app/dist/public — already correct from the above COPY

# Expose the app port (Cloud Run / ECS will inject PORT env var)
EXPOSE 3000

# Health check for ECS/ALB
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

# Start the pre-built server bundle (avoids tsx --loader which is removed in Node 22)
CMD ["node", "dist/index.js"]
