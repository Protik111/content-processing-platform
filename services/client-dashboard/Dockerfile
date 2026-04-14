FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY services/client-dashboard/package.json services/client-dashboard/pnpm-lock.yaml ./

RUN pnpm install

COPY services/client-dashboard .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
