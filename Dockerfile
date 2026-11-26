FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/env.sh /docker-entrypoint.d/40-app-env.sh
COPY index.html /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
COPY styles /usr/share/nginx/html/styles
COPY assets /usr/share/nginx/html/assets
RUN chmod +x /docker-entrypoint.d/40-app-env.sh
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
