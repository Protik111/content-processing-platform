FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY services/notification-service/package.json services/notification-service/pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared prisma and source code
COPY shared/prisma ./prisma
COPY services/notification-service .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# Run the service
CMD ["pnpm", "start"]