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
  echo '[Prod] Firewall already exists, creation skipped.'
fi

result=0
gcloud compute firewall-rules list --format='value(name)' | grep -q ^mcs-dev$ || result=$?
if [ "$result" != "0" ]; then
  gcloud compute firewall-rules create mcs-dev
    --target-tags=minecraft-server-dev \
    --direction=IN \
    --allow='tcp:8000' \
    --source-ranges='0.0.0.0/0'
else
  echo '[Dev] Firewall already exists, creation skipped.'
fi
