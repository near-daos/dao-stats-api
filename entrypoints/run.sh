#!/bin/sh

# exit when any command fails
set -e

# set redis url
export REDIS_CACHE_URL=${REDIS_CONNECTION_STRING}/0
export REDIS_EVENT_BUS_URL=${REDIS_CONNECTION_STRING}/0

# run migrations
npm run migration:run

if [ "$NEST_APP_TYPE" == "aggregator" ]
then
  # create astro config from env
  mkdir -p /usr/src/app/dist/config/
  echo $AGGREGATOR_CONFIG | base64 -d | sed 's/\\n/\n/g' > /usr/src/app/dist/config/astro-config.yml

  # run aggregator
  node dist/apps/aggregator/main.js
else
  # run api
  node dist/apps/api/main.js
fi
