FROM node:14.16.0-alpine As dependencies

WORKDIR /usr/src/app

COPY package*.json ./

# install dependencies
RUN npm install

FROM node:14.16.0-alpine as development

ARG APP_NAME
ENV APP_NAME ${APP_NAME}

# requirements
RUN apk update && apk add curl bash && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules

COPY . .

# build application
RUN npm link webpack && \
  npm run build $APP_NAME

# remove development dependencies
RUN npm prune --production

# remove unused dependencies
RUN rm -rf node_modules/rxjs/src/
RUN rm -rf node_modules/rxjs/bundles/
RUN rm -rf node_modules/rxjs/_esm5/
RUN rm -rf node_modules/rxjs/_esm2015/
RUN rm -rf node_modules/swagger-ui-dist/*.map

FROM node:14.16.0-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# copy from build image
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/entrypoints ./

# following files are required to run migrations
COPY --from=development /usr/src/app/libs ./
COPY --from=development /usr/src/app/ormconfig.js ./
COPY --from=development /usr/src/app/tsconfig.json ./
COPY --from=development /usr/src/app/package.json ./

EXPOSE 3000

CMD [ "/bin/sh", "run.sh" ]
