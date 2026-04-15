FROM node:20-alpine

# Outils de compilation pour les modules natifs (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# ── Dépendances backend ────────────────────────────────────────────────────────
COPY package*.json ./
RUN npm ci

# ── Dépendances frontend ───────────────────────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend

# ── Code source ───────────────────────────────────────────────────────────────
COPY . .

# ── Build frontend (production) ───────────────────────────────────────────────
RUN npm run build --prefix frontend

EXPOSE 3001

# Par défaut : scrape puis lance le frontend en mode preview
# Override possible via docker-compose command ou docker run
CMD ["sh", "-c", "npx tsx scripts/scrape-lck-cup-2026.ts && cd frontend && npx vite preview --host 0.0.0.0 --port 3001"]
