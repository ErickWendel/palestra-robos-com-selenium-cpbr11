FROM node:8-alpine

ADD . src/

WORKDIR src

RUN npm install --silent

RUN npm i -g typescript

CMD [ "node", "Index.js" ]
