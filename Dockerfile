# Etapa 1: Build da aplicação TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Dependências nativas para o Prisma engine
RUN apk add --no-cache openssl

# Copiar manifests e schema Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalação das dependências
RUN npm ci

# Gera o cliente do Prisma
RUN npx prisma generate

# Copia arquivos de código fonte e configurações
COPY tsconfig.json ./
COPY src ./src/

# Compila o TypeScript para JavaScript em ./dist
RUN npm run build

# Etapa 2: Imagem final leve para execução (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Biblioteca OpenSSL necessária para o Prisma no Alpine
RUN apk add --no-cache openssl

# Copia os artefatos compilados e dependências
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/

# A porta será injetada automaticamente pelo Google Cloud Run (variável PORT)
EXPOSE 8080

# Inicia o servidor compilado
CMD ["node", "dist/server.js"]
