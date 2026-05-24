# Production image for the AISOLUTIONDESK API (and worker).
# Build context must be the repo ROOT:  docker build -f apps/api/Dockerfile .
FROM node:20-alpine

# pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# Copy the whole monorepo and install (postinstall runs `prisma generate`).
COPY . .
RUN pnpm install --frozen-lockfile

# Build the API and the workspace packages it depends on.
RUN pnpm --filter @aisolutiondesk/api... build

ENV NODE_ENV=production
EXPOSE 4000

# Apply any pending database migrations, then start the API.
# (For the worker service, override the command with: node apps/api/dist/worker.js)
CMD ["sh", "-c", "pnpm --filter @aisolutiondesk/db exec prisma migrate deploy && node apps/api/dist/main.js"]
