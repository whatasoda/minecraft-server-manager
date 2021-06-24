#! /bin/bash

SECRET=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -c 32)
echo $SECRET | jq -cRn '.secret=input'
