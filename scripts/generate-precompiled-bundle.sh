#!/bin/bash
# Generate and compile JS bundle to Hermes bytecode (v98)
# Run this after JS changes, then commit the updated precompiled bundle
# Works on macOS/Linux if hermesc produces correct bytecode

set -e
echo "Generating JS bundle..."
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/english-friend-bundle.js --assets-dest /tmp/english-friend-assets

echo "Compiling to Hermes bytecode..."
node_modules/hermes-compiler/hermesc/osx-bin/hermesc -O -emit-binary -max-diagnostic-width=80 -out /tmp/english-friend-bundle.js.hbc /tmp/english-friend-bundle.js

echo "Copying pre-compiled bundle to repo..."
cp /tmp/english-friend-bundle.js.hbc precompiled/index.android.bundle.hbc

echo "Done! Pre-compiled bundle updated at precompiled/index.android.bundle.hbc"
echo "Please commit the changes."
