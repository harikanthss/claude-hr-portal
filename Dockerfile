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
WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy frontend dist into backend/public for serving
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Serve frontend static from express
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "server.js"]
