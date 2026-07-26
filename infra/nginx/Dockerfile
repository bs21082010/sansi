FROM nginx:alpine

RUN apk add --no-cache openssl

RUN mkdir -p /etc/ssl/certs /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/sansi.key \
    -out /etc/ssl/certs/sansi.crt \
    -subj "/C=IN/ST=State/L=City/O=Sansi/CN=sansi.app"

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
