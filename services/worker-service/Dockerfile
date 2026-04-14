FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

RUN npm install -g pnpm

COPY services/worker-service/package.json services/worker-service/pnpm-lock.yaml ./

RUN pnpm install

COPY shared/prisma ./prisma
COPY services/worker-service .
RUN npx prisma generate

EXPOSE 3000

CMD ["pnpm", "run", "dev"]