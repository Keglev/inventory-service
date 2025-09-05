# --- Build stage ---
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ARG VITE_API_BASE="https://inventoryservice.fly.dev"
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# --- Runtime stage (Chainguard NGINX, minimal CVEs) ---
FROM cgr.dev/chainguard/nginx:latest
# Chainguard expects nginx.conf at /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080
CMD ["/usr/sbin/nginx","-g","daemon off;"]
