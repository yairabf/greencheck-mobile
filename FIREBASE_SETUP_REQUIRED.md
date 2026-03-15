# 🔥 FIREBASE CONFIGURATION REQUIRED

## ⚠️ Why the App is Crashing

The app is crashing because **Firebase credentials are not configured** in the EAS build.

The build output shows:
```
No environment variables with visibility "Plain text" and "Sensitive" found for the "preview" environment on EAS.
```

This means the app has NO Firebase configuration and will crash when trying to authenticate or use any Firebase features.

---

## ✅ Solution: Configure Firebase in EAS

You need to add your Firebase credentials to EAS. You have 2 options:

### Option 1: Use EAS Secrets (Recommended for Production)

```bash
# Add each Firebase credential as a secret
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "YOUR_API_KEY" --type string

eas secret:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "YOUR_PROJECT.firebaseapp.com" --type string

eas secret:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "YOUR_PROJECT_ID" --type string

eas secret:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "YOUR_PROJECT.appspot.com" --type string

eas secret:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "YOUR_SENDER_ID" --type string

eas secret:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "YOUR_APP_ID" --type string

eas secret:create --name EXPO_PUBLIC_ENABLE_CLIENT_PUSH --value "true" --type string

eas secret:create --name EXPO_PUBLIC_AUTH_TEST_MODE --value "false" --type string
```

### Option 2: Create a .env File (Easier for Testing)

Create `/home/ubuntu/projects/greencheck-mobile/.env` with your actual Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=greencheck-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=greencheck-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=greencheck-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abcdef
EXPO_PUBLIC_ENABLE_CLIENT_PUSH=true
EXPO_PUBLIC_AUTH_TEST_MODE=false
```

Then rebuild:
```bash
npx eas build --platform ios --profile preview --non-interactive --no-wait
```

---

## 🔑 Where to Find Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your GreenCheck project
3. Click the gear icon → Project settings
4. Scroll down to "Your apps"
5. Click on your iOS app
6. Copy the `firebaseConfig` values:
   - `apiKey` → EXPO_PUBLIC_FIREBASE_API_KEY
   - `authDomain` → EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN  
   - `projectId` → EXPO_PUBLIC_FIREBASE_PROJECT_ID
   - `storageBucket` → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
   - `messagingSenderId` → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - `appId` → EXPO_PUBLIC_FIREBASE_APP_ID

---

## Current Build Status

**Latest Build (without Firebase)**: 
- iOS: https://expo.dev/accounts/yairabc/projects/greencheck-mobile/builds/ec45ef79-a5a3-4949-aa8e-0093af88da85
- Android: (queued)

**⚠️ This build will CRASH** because Firebase is not configured!

---

## What to Do Now

1. **Create .env file** with your Firebase credentials (see Option 2 above)
2. **Rebuild** after adding the .env file
3. **Test** the new build

OR

1. **Configure EAS secrets** (see Option 1 above)
2. **Rebuild** after configuring secrets
3. **Test** the new build

---

## Temporary Workaround

If you want to test the UI/navigation features without Firebase:

I can modify the app to have a "demo mode" that works without Firebase, showing placeholder data. But for real testing, you need Firebase configured.

---

**Next Step**: Please provide your Firebase credentials so I can create the .env file, then we'll rebuild.
