#! /bin/bash

rm -rf dist/*

npm run build:client

node scripts/build-package-json.js
mkdir -p dist/src
cp app.yaml tsconfig.json dist
cp -r src/server src/shared src/types dist/src
