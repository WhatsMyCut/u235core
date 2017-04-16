#!/bin/bash

# Get dotenv file from unicreds and export it as environment vars
#export $(/usr/local/bin/unicreds -t U235Config${ENVIRONMENT} -k alias/U235Key${ENVIRONMENT} -r us-east-1 get u235core-env)
eval "$@"