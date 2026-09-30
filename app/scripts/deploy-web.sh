#!/usr/bin/env bash
# Builds the web version and deploys it to the Vercel project "labmate-app".
# Vercel's uploader skips any folder named node_modules, and Expo puts fonts
# (icons) under dist/assets/node_modules, so we upload them as assets/nm and
# web/vercel.json rewrites the original paths.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
npx expo export -p web
mv dist/assets/node_modules dist/assets/nm
cp web/vercel.json dist/vercel.json
npx vercel deploy dist --prod --yes --project labmate-app
