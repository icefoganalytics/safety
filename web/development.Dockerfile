FROM node:20.10.0-bookworm-slim

WORKDIR /usr/src/web

COPY package*.json ./

RUN npm clean-install

CMD ["npm", "run", "start"]
