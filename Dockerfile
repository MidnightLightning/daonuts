FROM node:latest

RUN npm install -g @aragon/cli --unsafe-perm=true --allow-root

EXPOSE 8545
