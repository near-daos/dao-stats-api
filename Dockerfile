FROM node:16-alpine as build

ARG APP_NAME
ENV APP_NAME ${APP_NAME}

WORKDIR /usr/src/app

COPY apps/ apps/
COPY libs/ libs/
COPY yarn.lock ./
COPY *.json ./

# update npm
RUN npm -g install npm@^9.2.0

# install dependencies
RUN npm install

# build application
RUN npm run build $APP_NAME

# remove development dependencies
RUN npm prune --production

FROM node:16-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

# copy from build image
COPY --from=build /usr/src/app/dist/ dist/
COPY --from=build /usr/src/app/node_modules/ node_modules/

# required for migrations
COPY libs/common/src/migrations libs/common/src/migrations/
COPY ormconfig.js ./

# required for run
COPY entrypoints/ ./
COPY package.json ./

EXPOSE 3000

CMD [ "/bin/sh", "run.sh" ]
