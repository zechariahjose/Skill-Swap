# Skill Swap

A cross-platform mobile application built with **React Native + Expo** that enables users to exchange skills without using money. Users can share what they know, discover others’ talents, and connect through a collaborative, community-driven marketplace.

Whether it’s tutoring, graphic design, coding, music lessons, or language practice — **Skill Swap** helps people learn and grow together through skill exchange.

---

## Features

- **Skill Exchange System**  
  Create and list skills you can teach or skills you want to learn.
- **User Profiles**  
  Showcase personal information, offered skills, and learning interests.
- **Skill Discovery**  
  Browse available skills shared by other users in the community.
- **Swap Requests**  
  Send, receive, and manage skill exchange requests.
- **Real-Time Sync**  
  Firebase integration enables live updates and seamless data synchronization.
- **Dark / Light Mode**  
  Toggle between themes for a personalized user experience.
- **Cross-Platform Support**  
  Runs smoothly on both Android and iOS using Expo.
- **Admin Panel**  
  Includes development tools for managing users and content.

---


## Prerequisites

- Node.js 22.13 or newer (or another Node.js version supported by Expo SDK 58)
- npm
- A Firebase project for Firebase-backed authentication and data
- Xcode for local iOS builds (macOS only), or EAS Build
- Android Studio for local Android builds, or EAS Build

## Getting Started

From the repository root, enter the Expo app directory and install dependencies:

```bash
cd my-app
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead. Fill in the Firebase and Google values described below. The `.env` file is ignored by Git; do not commit it.

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a **Web app** in Firebase project settings and copy its web app configuration into the `EXPO_PUBLIC_FIREBASE_*` variables in `.env`.
3. In **Build → Authentication → Sign-in method**, enable **Email/Password**. Enable **Google** as well if you want Google sign-in.
4. In **Build → Firestore Database**, create a database and configure security rules before using real user data. Do not deploy permissive test rules to production.

The app falls back to in-memory demo behavior when Firebase configuration is absent. Google sign-in requires valid Firebase configuration and will not work in demo mode.

## Google Sign-In Setup

Google sign-in uses Expo AuthSession to obtain a Google ID token, then exchanges it with Firebase Authentication. OAuth client IDs are public identifiers, not client secrets. Never put a Google client secret in the app.

1. Use the same Google Cloud project linked to your Firebase project. In **Google Cloud Console → Google Auth Platform**, configure the consent screen and create OAuth client IDs for the platforms you use:
   - **Web application** client ID
   - **iOS** client ID, using the bundle ID `com.skillswap.app`
   - **Android** client ID, using the package name `com.skillswap.app`
2. For Android, add the SHA-1 signing fingerprints for each build certificate you use to the Android app in Firebase project settings. The debug, EAS development, and Play Store signing certificates may have different fingerprints.
3. Put the client IDs in `.env`:

    ```env
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
    ```

    Only the web client ID is needed for web. Native sign-in requires the client ID for that platform. Do not include a client secret.
4. In Firebase Authentication, make sure Google is enabled and the support email is set. Add your web development/production domains to Firebase Authentication's **Authorized domains** when prompted.
5. Restart Expo after editing environment variables.

> **Expo Go limitation:** Google OAuth redirects for this app require the app's custom URL scheme. Expo Go does not support this OAuth flow. Use a development build on your iPhone or Android device; changing `app.json`, app identifiers, or OAuth settings also requires rebuilding the development app.

## Google Maps Setup

The map uses `react-native-maps` with Google Maps on Android and iOS, and the Google Maps JavaScript API on web. It currently shows an interactive map without location permission or skill pins; skill records do not yet include coordinates.

1. In Google Cloud Console, enable **Maps SDK for Android**, **Maps SDK for iOS**, and **Maps JavaScript API**.
2. Create separate API keys and restrict them:
   - Android key: Android app restriction for `com.skillswap.app` and the SHA-1 fingerprints for each signing certificate.
   - iOS key: iOS app restriction for bundle ID `com.skillswap.app`.
   - Web key: HTTP referrer restriction to the development and production website origins.
3. Add the keys to local `.env` for development:

   ```env
   GOOGLE_MAPS_ANDROID_API_KEY=your-restricted-android-key
   GOOGLE_MAPS_IOS_API_KEY=your-restricted-ios-key
   EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY=your-restricted-web-key
   ```

   The web key is necessarily included in the browser bundle; secure it with HTTP referrer and API restrictions. Native keys are also present in app binaries, so restrict them to their app identifiers.
4. For EAS builds, configure the same variable names in the EAS environment used by the build. The `EXPO_PUBLIC_` web key is public at runtime; do not use a server-side key.
5. Restart Expo for web. For Android and iOS, create and install a new development or production build after setting the keys; native map configuration is compiled into the app.

## Run the App

Start the Metro development server:

```bash
npx expo start
```

For a development build on a locally configured platform:

```bash
npx expo run:ios
npx expo run:android
```

Local iOS builds require macOS and Xcode. You can also create a development build with EAS Build. After installing it, start Metro and open the project in that development build. To use the native sign-in flow, do not open it in Expo Go.

For web:

```bash
npm run web
```

