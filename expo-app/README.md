# JugaadGPT Expo App

This folder contains a standalone Expo Android app that mirrors the web UI in `frontend/`.

## Run it

```bash
cd expo-app
npm install
npm run android
```

If Android Studio / an emulator is not installed, use:

```bash
npm run start
```

Then open the app with Expo Go on a physical Android device or start an emulator after configuring the Android SDK.

## What is included

- Expo project config for Android/iOS
- A single-screen mobile app styled like the web mobile view
- Day/night theme toggle
- Bottom sheet constraint trace
- Saved and community tab placeholders using the same visual language

This Expo app is configured for Android only, so Expo will not try to bundle the web target.
