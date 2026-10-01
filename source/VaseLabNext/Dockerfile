FROM node:26

WORKDIR /home/node/app

COPY package.json package-lock.json* .

RUN npm ci --no-audit --no-fund;

COPY . .

ENV WATCHPACK_POLLING=true
ENV HOSTNAME="0.0.0.0"

RUN chown -R node:node /home/node/app
USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]