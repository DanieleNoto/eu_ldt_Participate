# Stage di build (rimane invariato)
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

RUN addgroup -S app && adduser -S -G app app \
    && chown -R app:app /app
USER app
RUN npm run build

FROM nginx:alpine AS serve

RUN mkdir -p /var/cache/nginx/client_temp \
    && chown -R nginx:nginx /var/cache/nginx \
    \
    && mkdir -p /run \
    && chown -R nginx:nginx /run

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
