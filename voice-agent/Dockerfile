FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh /entrypoint.sh
RUN npm install typescript tsx --no-save && npx tsc && npm uninstall typescript tsx \
  && chmod +x /entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3001

CMD ["/entrypoint.sh"]
