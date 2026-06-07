# ---- Backend ----
FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
RUN mkdir -p uploads data

# ---- Frontend Build ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Final Image ----
FROM node:20-alpine AS final

# Create non-root user for security
RUN addgroup -g 1001 -S grevya && \
    adduser -S grevya -u 1001 -G grevya

WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy frontend dist into backend/public for serving
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Set ownership to non-root user
RUN chown -R grevya:grevya /app

# Switch to non-root user
USER grevya

# Serve frontend static from express
WORKDIR /app/backend
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
