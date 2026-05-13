FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
# Copy SQL migrations into dist (tsc doesn't copy non-ts files)
RUN mkdir -p dist/db/migrations && cp src/db/migrations/*.sql dist/db/migrations/

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
