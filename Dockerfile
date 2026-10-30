# Etapa de build: instala todas as dependências e compila o TypeScript.
FROM node:24-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src

# O prisma.config.ts exige a variável, mas o generate não conecta no banco.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN npm run build

# Etapa final: apenas dependências de produção e o código compilado.
FROM node:24-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3333

# Aplica as migrations pendentes antes de subir a API.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
