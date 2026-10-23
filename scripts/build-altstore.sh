#!/bin/bash
# A genuine arm64 device build; final signing/installation is performed by AltStore Classic.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -z "${DEVELOPER_DIR:-}" && -d /Applications/Xcode.app/Contents/Developer ]]; then
  export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi
command -v pnpm >/dev/null || { echo 'Install pnpm and Node 22+ before building.' >&2; exit 1; }
pnpm native:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath build/ios \
  CODE_SIGNING_ALLOWED=NO build
APP_PATH='build/ios/Build/Products/Release-iphoneos/App.app'
/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP_PATH/Info.plist"
xcrun lipo -verify_arch arm64 "$APP_PATH/App"
xcrun vtool -show-build "$APP_PATH/App" | grep -q 'platform IOS'
# Rebuild Payload from scratch so removed files never survive in a later IPA.
STAGE=$(mktemp -d "${TMPDIR:-/tmp}/sa-ipa.XXXXXX")
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/Payload"
cp -R "$APP_PATH" "$STAGE/Payload/"
mkdir -p build/artifacts
(cd "$STAGE" && /usr/bin/ditto -c -k --sequesterRsrc --keepParent Payload "$OLDPWD/build/artifacts/SAEventLogistics-AltStore-unsigned.ipa")
unzip -tq build/artifacts/SAEventLogistics-AltStore-unsigned.ipa
shasum -a 256 build/artifacts/SAEventLogistics-AltStore-unsigned.ipa > build/artifacts/SHA256SUMS
printf '\nCreated a device IPA, UNSIGNED and NOT YET INSTALLED.\nImport it using AltStore Classic / AltServer to sign for your iPhone.\n'
