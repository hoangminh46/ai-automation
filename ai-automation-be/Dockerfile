# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Prisma: chỉ copy nếu đã được init (Phase 02+)
COPY --from=builder /app/prisma ./prisma 2>/dev/null || true
RUN npx prisma generate 2>/dev/null || echo "Prisma schema not found, skipping generate"

EXPOSE 3001

CMD ["node", "dist/main.js"]
