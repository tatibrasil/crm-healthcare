FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY index.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY data.js /usr/share/nginx/html/
COPY chatwoot-bridge.js /usr/share/nginx/html/
COPY chatwoot-api.js /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
