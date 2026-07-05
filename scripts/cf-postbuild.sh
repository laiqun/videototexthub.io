#!/bin/sh
set -e
cp ./fake_output/server/worker-entry.mjs Dockerfile_ffmpeg server.py .output/server/
sed -i '' 's/"main": "index.mjs"/"main": "worker-entry.mjs"/' .output/server/wrangler.json
