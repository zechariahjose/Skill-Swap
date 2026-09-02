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


# Prerequisites
Before running the project, make sure you have installed:

- Node.js **v16+**
- npm or yarn
- Expo CLI

Install Expo CLI globally:

```bash
npm install -g expo-cli
```

You will also need:
- A Firebase project *(optional for demo mode)*
- Android Studio / Xcode emulator or Expo Go mobile app

---

# Getting Started

```bash
git clone <repository-url>
cd my-app
```

---

## Install Dependencies

Using npm:
```bash
npm install
```

---

## Configure Firebase (Optional)
Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> If Firebase credentials are not provided, the app automatically runs in **Demo Mode**.

---

#  Running the App
## Start Development Server

```bash
npm start
```
---
## Run on Android

```bash
npm run android
```
---
## Run on iOS

```bash
npm run ios
```
---
## Run on iPhone
```bash
npx expo start
```

---


