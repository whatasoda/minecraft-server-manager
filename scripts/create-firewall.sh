#! /bin/bash

gcloud config set core/project $GOOGLE_CLOUD_PROJECT

result=0
gcloud compute firewall-rules list --format='value(name)' | grep -q ^mcs$ || result=$?

if [ "$result" != "0" ]; then
  gcloud compute firewall-rules create mcs
    --target-tags=minecraft-server \
    --direction=IN \
    --allow='tcp:25565' \
    --source-ranges='0.0.0.0/0'
else
  echo 'Firewall already exists, creation skipped.'
fi
