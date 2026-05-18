@echo off
REM Generate and compile JS bundle to Hermes bytecode (v98) on Windows
REM Run this when you change JS code, then commit the updated precompiled bundle

echo Generating JS bundle...
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output %TEMP%\english-friend-bundle.js --assets-dest %TEMP%\english-friend-assets

echo Compiling to Hermes bytecode...
node_modules\hermes-compiler\hermesc\win64-bin\hermesc.exe -O -emit-binary -max-diagnostic-width=80 -out %TEMP%\english-friend-bundle.js.hbc %TEMP%\english-friend-bundle.js

echo Copying pre-compiled bundle to repo...
copy /Y %TEMP%\english-friend-bundle.js.hbc precompiled\index.android.bundle.hbc

echo Done! Pre-compiled bundle updated at precompiled/index.android.bundle.hbc
echo Please commit the changes.
