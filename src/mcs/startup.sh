#! /bin/bash

cd ~
echo '' > .metadata

export REVISION=main
export JAVA_MEM_SIZE=2
export JAVA_PACKAGE_NAME=openjdk-16-jdk-headless

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
export_metadata MCS_TOKEN_SECRET attributes/mcs-token-secret
export_metadata JAVA_MEMORY_SIZE attributes/java-memory-size
export_metadata JAVA_PACKAGE_NAME attributes/java-package-name

if ! command -v node &> /dev/null; then
  apt update
  curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
  apt-get install -y make zip screen jq nodejs $JAVA_PACKAGE_NAME
  apt-get clean
fi

if [ ! -e /root/repo/package.json ]; then
  printf "No repo data found, downloading..."
  TEMP_FILE=$(mktemp)
  TEMP_DIR=$(mktemp -d)
  curl -fsSL "https://github.com/whatasoda/minecraft-server-manager/archive/refs/heads/$REVISION.zip" > $TEMP_FILE
  unzip $TEMP_FILE -d $TEMP_DIR &> /dev/null
  mv $TEMP_DIR/* /root/repo
  rm -rf $TEMP_FILE $TEMP_DIR
  printf "done\n"
fi

cp repo/src/mcs/Makefile .
make startup
