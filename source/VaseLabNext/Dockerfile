FROM node:26 AS base

ENV HOSTNAME="0.0.0.0"
WORKDIR /home/node/app
RUN chown -R node:node /home/node/app
USER node
COPY package.json package-lock.json* .
RUN npm ci --no-audit --no-fund;

COPY --chown=node . .

EXPOSE 3000

FROM base AS dev
CMD npm run dev

FROM base AS prod
RUN npm run build

CMD npm run start