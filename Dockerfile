# Multi-stage Dockerfile for Universal E-Commerce Product Scraper & CSV Exporter

# Stage 1: Build Frontend
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including devDependencies for build)
RUN npm install
RUN npm --prefix client install

# Copy application source
COPY . .

# Build frontend production bundle
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root package files & install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend server code
COPY server/ ./server/

# Copy built frontend assets from builder stage
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

CMD ["node", "server/index.js"]
