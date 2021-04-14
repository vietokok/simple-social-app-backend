FROM node:13-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm install -g pm2

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]