FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
# VITE_SHOW_TEST_MODE: pass "true" only for dev/demo builds; omit for production
ARG VITE_SHOW_TEST_MODE=""
ENV VITE_SHOW_TEST_MODE=$VITE_SHOW_TEST_MODE
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
