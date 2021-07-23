#! /bin/bash

cd ~

metadata_file=/root/.metadata
revision_file=/root/.revision
repository=whatasoda/minecraft-server-manager

if ! command -v node &> /dev/null; then
  apt update
  curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
  apt-get install -y make zip screen jq nodejs
  apt-get clean
fi

if [[ -e $metadata_file ]]; then
  source $metadata_file
fi
cat <<EOF > $metadata_file
export NODE_ENV=production
EOF
source $metadata_file

export REVISION=main
export TIMEZONE=UTC-9
export JAVA_MEM_SIZE=2
export JAVA_PACKAGE_NAME=openjdk-16-jdk-headless

if [[ -z "$SERVER_JAR_URL" ]]; then
  TEMP_FILE=$(mktemp)
  curl -fsSL https://launchermeta.mojang.com/mc/game/version_manifest.json | \
    jq '[.versions[] | select(.type == "release")][0] | .url' | \
    xargs curl -fsSL | \
    jq '.downloads.server.url' > $TEMP_FILE
  export SERVER_JAR_URL=$(cat $TEMP_FILE)
  rm $TEMP_FILE
fi

export_metadata () {
  if data=$(curl -fsSL -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/$2" 2> /dev/null); then
    export "$1=$data"
  fi
  eval "echo export $1=\$$1" >> .metadata
}
export_metadata SERVER_NAME name
export_metadata SERVER_HOST hostname
export_metadata REVISION attributes/revision
export_metadata BUCKET_NAME attributes/bucket-name
export_metadata TIMEZONE attributes/timezone
export_metadata MCS_TOKEN_SECRET attributes/mcs-token-secret
export_metadata JAVA_MEMORY_SIZE attributes/java-memory-size
export_metadata JAVA_PACKAGE_NAME attributes/java-package-name
export_metadata SERVER_JAR_URL attributes/server-jar-url

if ! command -v java &> /dev/null; then
  apt update
  apt-get install -y $JAVA_PACKAGE_NAME
  apt-get clean
fi

rev_sha=$( \
  curl -fsSL -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$repository/commits/$REVISION" | \
    jq -r .sha \
)

if [[ ! -e $revision_file ]] || [[ "$(cat $revision_file)" != "$rev_sha" ]]; then
  # prepare temp files
  TEMP_ZIP=$(mktemp)
  TEMP_DIR=$(mktemp -d)
  # download repo data
  curl -fsSL "https://github.com/$repository/archive/$rev_sha.zip" > $TEMP_ZIP
  # unzip files
  unzip $TEMP_ZIP -d $TEMP_DIR &> /dev/null
  rm -rf repo
  mv $TEMP_DIR/* repo
  rm -rf $TEMP_ZIP $TEMP_DIR
  # store current revision
  echo $rev_sha > $revision_file
  # install npm packages
  node repo/scripts/build-package-json.js
  mv repo/dist/mcs-workdir/* ./
  npm ci
fi

cp repo/src/mcs/Makefile .
make startup > startup.log
