# Multi-stage Dockerfile for Next.js Production Build
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || (pnpm install && pnpm install --frozen-lockfile --force)

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public config, baked into the JS bundle by `next build`.
ARG NEXT_PUBLIC_BILLING_GRAPHQL_URL
ARG NEXT_PUBLIC_BILLING_TENANT_ID
ARG NEXT_PUBLIC_REST_API_URL
ARG NEXT_PUBLIC_WELLONGE_ID_URL
ARG NEXT_PUBLIC_NBC_VERIFY_CARD_URL
ARG NEXT_PUBLIC_NBC_SAVE_PAYMENT_URL
ARG NEXT_PUBLIC_CLIENT_MGMT_GRAPHQL_URL
ARG NEXT_PUBLIC_CLIENT_MGMT_URL
ARG NEXT_PUBLIC_TAX_COMPLIANCE_GRAPHQL_URL
ARG NEXT_PUBLIC_SUPPLIER_GRAPHQL_URL
ENV NEXT_PUBLIC_BILLING_GRAPHQL_URL=${NEXT_PUBLIC_BILLING_GRAPHQL_URL}
ENV NEXT_PUBLIC_BILLING_TENANT_ID=${NEXT_PUBLIC_BILLING_TENANT_ID}
ENV NEXT_PUBLIC_REST_API_URL=${NEXT_PUBLIC_REST_API_URL}
ENV NEXT_PUBLIC_WELLONGE_ID_URL=${NEXT_PUBLIC_WELLONGE_ID_URL}
ENV NEXT_PUBLIC_NBC_VERIFY_CARD_URL=${NEXT_PUBLIC_NBC_VERIFY_CARD_URL}
ENV NEXT_PUBLIC_NBC_SAVE_PAYMENT_URL=${NEXT_PUBLIC_NBC_SAVE_PAYMENT_URL}
ENV NEXT_PUBLIC_CLIENT_MGMT_GRAPHQL_URL=${NEXT_PUBLIC_CLIENT_MGMT_GRAPHQL_URL}
ENV NEXT_PUBLIC_CLIENT_MGMT_URL=${NEXT_PUBLIC_CLIENT_MGMT_URL}
ENV NEXT_PUBLIC_TAX_COMPLIANCE_GRAPHQL_URL=${NEXT_PUBLIC_TAX_COMPLIANCE_GRAPHQL_URL}
ENV NEXT_PUBLIC_SUPPLIER_GRAPHQL_URL=${NEXT_PUBLIC_SUPPLIER_GRAPHQL_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Full node_modules + build output rather than .next/standalone -- see
# wellongepay/frontend/docker/Dockerfile for why (pnpm symlink tracing gaps).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
