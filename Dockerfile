# syntax=docker/dockerfile:1.6
FROM node:20-slim

WORKDIR /app

# Instalar dependências com cache seguro
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --cache /root/.npm

# Copiar código e compilar
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","dist/index.js"]
