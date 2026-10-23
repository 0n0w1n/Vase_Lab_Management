FROM node:26

ENV HOSTNAME="0.0.0.0"
WORKDIR /home/node/app
RUN chown -R node:node /home/node/app
USER node
COPY package.json package-lock.json* .
RUN npm ci --no-audit --no-fund;

COPY --chown=node . .

EXPOSE 3000