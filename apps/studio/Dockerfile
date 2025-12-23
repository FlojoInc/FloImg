# floimg-studio Dockerfile
# Multi-stage build for production deployment

# Stage 1: Build dependencies and compile
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies (--ignore-scripts skips prepare/husky)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend
COPY tsconfig.json ./

# Build shared types first
RUN pnpm --filter @floimg-studio/shared build 2>/dev/null || true

# Build backend
RUN pnpm --filter @floimg-studio/backend build

# Build frontend (static assets)
RUN pnpm --filter @floimg-studio/frontend build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install production dependencies only (--ignore-scripts skips prepare/husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built backend and shared
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy frontend static build to be served by backend
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5100

# Expose port
EXPOSE 5100

# Health check (use 127.0.0.1 to avoid IPv6 issues)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5100/api/health || exit 1

# Start the backend server
WORKDIR /app/packages/backend
CMD ["node", "dist/index.js"]
