FROM node:24-alpine AS client-build
WORKDIR /build/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:14.15-alpine3.10
RUN apk update && apk add bash
RUN apk add git
RUN apk add  ffmpeg
RUN apk add imagemagick

ENV NODE_ENV=production

WORKDIR /pisignage-server

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .
COPY --from=client-build /build/public/ /pisignage-server/public/
RUN chmod +x ./wait-for-it.sh

CMD [ "./wait-for-it.sh", "mongo:27017", "--", "node", "server.js"]
