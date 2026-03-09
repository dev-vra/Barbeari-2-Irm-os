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
# NOTE: prisma.config.ts is intentionally NOT copied here.
# In production, Prisma reads datasource.url from schema.prisma (url = env("DATABASE_URL")).
# Copying prisma.config.ts would make it take precedence and break migrate deploy.

ENV NODE_ENV=production

EXPOSE 3005

CMD ["node", "dist/main"]
