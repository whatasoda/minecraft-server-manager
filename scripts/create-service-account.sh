#! /bin/bash

gcloud config set core/project $GOOGLE_CLOUD_PROJECT

SA_EMAIL="mcs-compute@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com"
SA_NAME="projects/$GOOGLE_CLOUD_PROJECT/serviceAccounts/$SA_EMAIL"


result=0
gcloud iam service-accounts list --format='value(name)' | grep -q "^$SA_NAME$" || result=$?

if [ "$result" != "0" ]; then
  gcloud iam service-accounts create mcs-compute --display-name="Minecraft Server Service Account"
else
  echo 'Service Account already exists, creation skipped.'
fi

# https://cloud.google.com/storage/docs/access-control/iam-roles
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:$SA_EMAIL" \
  --role=roles/storage.objectAdmin \
  --no-user-output-enabled

echo "$SA_EMAIL has following roles"
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
  --flatten=bindings \
  --filter="bindings.members=(serviceAccount:$SA_EMAIL)" \
  --format="list(bindings.role)"
