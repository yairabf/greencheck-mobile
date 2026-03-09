# GreenCheck Mobile

React Native (Expo + TypeScript) mobile app for team safety check-ins.

## Prerequisites
- Node 20+
- npm
- Expo Go app or emulator/simulator

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env
   ```
3. Fill Firebase values in `.env`.

## Run
- Start dev server:
  ```bash
  npm run start
  ```
- Android:
  ```bash
  npm run android
  ```
- iOS:
  ```bash
  npm run ios
  ```

## Quality
- Type check:
  ```bash
  npm run typecheck
  ```
- Lint:
  ```bash
  npm run lint
  ```
- Format:
  ```bash
  npm run format
  ```

## Project structure
- `src/navigation` - root and stack navigators
- `src/screens` - screen placeholders
- `src/config` - typed env config
- `src/components` - reusable UI components
- `src/services` - data/service integrations
- `src/types` - shared TS types

## Firebase setup
1. Create a Firebase project.
2. Enable Authentication (Phone provider) and Cloud Firestore.
3. Copy `.env.example` to `.env` and fill:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`

If env vars are missing, app still boots in dev and logs a warning.
