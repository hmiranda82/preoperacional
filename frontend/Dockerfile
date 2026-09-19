FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build-only

FROM nginx:alpine
RUN addgroup -S appgroup && adduser -S -G appgroup appuser
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R appuser:appgroup /usr/share/nginx/html /etc/nginx/conf.d
EXPOSE 80
USER appuser
CMD ["nginx", "-g", "daemon off;"]
