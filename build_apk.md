To convert MONTRA into an installable mobile app and share it with others, use EAS Build (Expo Application Services) — it builds .apk, .aab, or .ipa files in the cloud without needing Android Studio or Xcode locally.

## Current Project Checks (What Needs Setup First)

- Before building, I checked your project files:

1. No eas.json yet — needs to be generated for EAS build profiles.
2. Missing app identifiers in app.json — "android" needs "package" (for example, "com.montra.app") and "ios" needs "bundleIdentifier".
3. .env is gitignored in .gitignore — remote EAS cloud builds will not see your local .env automatically, so you must upload EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to EAS Environment Variables (otherwise login/database calls won't work in the built APK).
## Step-by-Step: Create & Share an Android .apk (Direct Install Link / File)

Since this project uses npm (package-lock.json), run all EAS commands with npx eas-cli@latest:

1. Create a free Expo account at https://expo.dev
 (if you don't have one) and log in from your project root:

## bash
npx eas-cli@latest login

2. Add Android & iOS identifiers to app.json (under "android" and "ios"), for example:
``
  json
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.montra.app"
  },
  "android": {
    "package": "com.montra.app",
    ...
  }
``

3. Create eas.json:

## bash
npx eas-cli@latest build:configure

<!-- Choose All or Android. The generated preview profile already uses "distribution": "internal", which tells EAS to produce an installable .apk instead of a Play Store .aab. -->

4. Upload your Supabase keys to EAS Cloud (from your .env):

## bash
npx eas-cli@latest env:create

<!-- Add both EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for the preview (and production) environments with Plain text or Sensitive visibility. -->

5. Run project diagnostics:

## bash
npx expo-doctor

6. Build the shareable .apk:

## bash
npx eas-cli@latest build --platform android --profile preview

(When prompted to generate a new Android Keystore, select Yes.)

7. Share the app with others: Once the build finishes, EAS gives you:

A hosted install URL & QR code — send the link to anyone on Android so they can tap Install.
A .apk download — download and share it directly via WhatsApp, Telegram, or Google Drive (testers just enable "Install unknown apps" on Android when opening it).