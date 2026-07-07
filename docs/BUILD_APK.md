# Building the Android APK (Expo / EAS)

Everything below uses free tiers. You need a free [expo.dev](https://expo.dev) account.

## 0. Configure the API URL

Edit `expo-app/app.json` → `expo.extra`:

```json
"extra": {
  "apiBaseUrl": "https://api.yourdomain.com",
  "supabaseUrl": "https://<project-ref>.supabase.co",
  "supabaseAnonKey": "<anon key>"
}
```

`apiBaseUrl` must be the public HTTPS URL of the FastAPI backend (see `docs/DEPLOY.md`).
`supabaseUrl` / `supabaseAnonKey` enable the in-app email-OTP login; leave them `""`
to ship anonymous-only (5 free jugaads/day per device).

## 1. One-time setup

```bash
cd expo-app
npm install            # or pnpm install
npm install -g eas-cli
eas login              # free Expo account
eas build:configure    # creates eas.json, pick "Android"
```

In the generated `eas.json`, make sure the preview profile builds an APK
(not an AAB):

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

## 2. Build

```bash
eas build -p android --profile preview
```

- The build runs on Expo's free build queue (may wait a few minutes).
- When it finishes, the CLI prints a download URL — download `application.apk`
  and rename it to `jugaadgpt.apk`.

## 3. Attach to a GitHub Release

1. GitHub repo → **Releases** → **Draft a new release**.
2. Tag e.g. `v1.0.0`, title "JugaadGPT Android v1.0.0".
3. Drag `jugaadgpt.apk` (and `dist-packages/jugaadgpt-extension.zip` from
   `scripts/package-extension.sh`) into the assets box.
4. Publish. The landing page's **Download APK** button points at
   `releases/latest`, so it always serves the newest release.

## 4. Installing on a phone

Users must enable "Install unknown apps" for their browser
(Android Settings → Apps → Special access). The landing page shows the APK
card prominently on Android user-agents.

## Updating

Bump `expo.version` (and `android.versionCode` if you add one) in `app.json`,
rebuild, and attach the new APK to a new release.
