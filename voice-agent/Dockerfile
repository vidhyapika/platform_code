FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript tsx --no-save && npx tsc && npm uninstall typescript tsx

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/start-all.js"]
