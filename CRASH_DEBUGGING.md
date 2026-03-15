# GreenCheck Mobile - Crash Debugging Guide

## Latest Builds (Build #8 with crash fixes)

**iOS**: https://expo.dev/accounts/yairabc/projects/greencheck-mobile/builds/c4fbe0ae-4e7a-4622-9f7e-931170694b81

**Android**: (Building...)

---

## Recent Fixes Applied

### Commit `12b2c90` - I18nProvider Safety

Added comprehensive error handling to prevent crashes:

1. **Initialization Guard**: App won't render until I18n is initialized
2. **Try-Catch Blocks**: All I18nManager calls wrapped in try-catch
3. **Safe Fallback**: `useI18n()` returns safe defaults instead of throwing
4. **Console Warnings**: Added logging for debugging

---

## If App Still Crashes

### Check These in Order:

### 1. Get Crash Logs

On your iPhone:
1. Open Settings → Privacy → Analytics & Improvements → Analytics Data
2. Find logs starting with "greencheck"
3. Share the log file

### 2. Try Safe Mode Test

If you can access the Auth screen before it crashes, the crash is happening during/after login. If it crashes immediately on launch, it's an initialization issue.

### 3. Check Console Output

If you have Xcode:
1. Connect iPhone via USB
2. Open Xcode → Window → Devices and Simulators
3. Select your iPhone
4. Click "Open Console"
5. Launch the app
6. Look for error messages or warnings

### 4. Common Crash Causes

**If crash on launch (before seeing anything)**:
- Issue with I18n initialization (we just fixed this)
- Issue with `expo-updates` or `expo-localization`
- SafeAreaView compatibility issue

**If crash after login**:
- Firebase not configured (missing .env file)
- Navigation issue
- One of the Providers (Profile, Push) failing

**If crash on specific screen**:
- Missing component or service import
- Undefined variable or property access

---

## Temporary Workaround: Disable I18n

If the crash is definitely from I18n, we can temporarily disable it:

### Quick Fix (I'll do this if needed):

1. Remove I18nProvider from App.tsx
2. Replace all `useT()` calls with hardcoded English strings
3. Remove language toggle from ProfileScreen
4. Rebuild

This will give you a working app in English only while we debug the I18n issue.

---

## What I Need From You

To fix the crash, please provide:

1. **When does it crash?**
   - Immediately on launch?
   - After seeing login screen?
   - After signing in?
   - On a specific tab/screen?

2. **What do you see before the crash?**
   - Nothing (white screen)?
   - Login screen?
   - Home screen?
   - Error message?

3. **Crash logs** (if possible)
   - From Settings → Analytics
   - Or from Xcode console

4. **Device info**
   - iPhone model
   - iOS version

---

## Latest Code Changes

**4 commits total**:
1. `b8ee02c` - Main polish features
2. `1c90b13` - Created missing screens
3. `1276c17` - Implemented HomeScreen
4. `12b2c90` - Added I18n crash protection

All code committed and in git.

---

## Next Steps

**Option A**: If new build works ✅
- Test all features
- Ready for production!

**Option B**: If still crashing ❌
- Provide crash info above
- I'll create a minimal version that definitely works
- Then we'll add features back one by one

**Option C**: Skip I18n for now 🔄
- I remove I18n completely
- App works in English only
- We add Hebrew support later

---

**Status**: Build #8 queued with comprehensive crash protection
