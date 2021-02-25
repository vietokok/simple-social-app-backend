FROM node:14.15-alpine

WORKDIR /app/backend

RUN npm install -g pm2

RUN chown -R node:node /app/backend

USER node

COPY --chown=node:node ["package.json", "package-lock.json*", "./"]

RUN npm install --production --silent

COPY --chown=node:node . .

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]

