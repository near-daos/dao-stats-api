#!/bin/sh

if [ "$NEST_APP_TYPE" == "aggregator" ]
then
  node dist/apps/aggregator/main.js
else
  node dist/apps/api/main.js
fi
