# Release and AltStore

The app has bundle/application ID `com.saeventlogistics.mobile` and English display name `SA Event Logistics`. The original branding is used for icons and launch artwork.

## iPhone / AltStore Classic

Run `pnpm ios:altstore` on macOS with full Xcode 26+ and Node/pnpm available. Output:

`build/artifacts/SAEventLogistics-AltStore-unsigned.ipa`

The script builds for real arm64 iOS, checks platform/architecture and ZIP integrity, and records SHA-256. The IPA remains unsigned until AltStore Classic/AltServer signs it with the owner's Apple account. Do not describe this artifact alone as installed. AltStore PAL is a different distribution route.

Connect/unlock/trust the iPhone, use AltServer's sideload flow, select the IPA and enter Apple credentials directly in AltServer when requested. Verify the app appears in the device installed-app list and launches. Free-account apps normally refresh every seven days and are subject to Apple's active-app limit. See [official AltStore guidance](https://faq.altstore.io/altstore-classic/your-altstore).

Keep the same identifier for updates and back up data before reinstalling. No APNs entitlement is included in the free-account build; in-app notifications are the supported baseline.

## Android

Use JDK 21 and Android SDK 36, then `pnpm android:debug`. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. The initial local Mac lacks JDK/SDK, so an APK has not yet been verified here.

For a release AAB, configure an Android signing key outside the repository and run `pnpm android:bundle`. Never use the debug key as a production signing identity. Store upload and paid services require explicit authorization.

## Release checklist

- Run automated tests, typecheck, lint and web build.
- Test RTL navigation, keyboard, dark mode, Reduce Motion, offline states and export on phone.
- Configure Supabase and verify owner/worker flows with separate accounts.
- Review minimum-billing basis and imported hours with the business owner.
- Verify invitation/recovery email delivery, account deletion process and privacy/support pages.
- Verify real APNs/FCM delivery before advertising background push.
- Capture actual iPhone/Android screenshots before preparing store listings.
- Publish a release only after the owner authorizes publication; opening a PR does not deploy the demo.
