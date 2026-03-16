# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY prisma ./prisma
COPY prisma.config.ts ./

ENV NODE_ENV=production

EXPOSE ${PORT:-3005}

CMD ["node", "dist/src/main"]
