#!/bin/sh

export REDIS_CACHE_URL=${REDIS_CONNECTION_STRING}/0
export REDIS_EVENT_BUS_URL=${REDIS_CONNECTION_STRING}/0

npm run migration:run

if [ "$NEST_APP_TYPE" == "aggregator" ]
then
  mkdir -p /usr/src/app/dist/config/
  echo $AGGREGATOR_CONFIG | base64 -d | sed 's/\\n/\n/g' > /usr/src/app/dist/config/astro-config.yml
  node dist/apps/aggregator/main.js
else
  node dist/apps/api/main.js
fi
