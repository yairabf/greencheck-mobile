import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseServices } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function deviceIdSyncFallback(): string {
  return Application.applicationId ?? `device-${Platform.OS}`;
}

async function resolveDeviceId(): Promise<string> {
  const androidId = Application.getAndroidId();
  if (androidId) return androidId;

  if (typeof Application.getIosIdForVendorAsync === 'function') {
    const iosVendorId = await Application.getIosIdForVendorAsync();
    if (iosVendorId) return iosVendorId;
  }

  return deviceIdSyncFallback();
}

export async function registerPushToken(user: User): Promise<{ ok: boolean; reason?: string }> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'Push notifications require a physical device.' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
    });
  }

  let perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) {
    perms = await Notifications.requestPermissionsAsync();
  }

  if (!perms.granted) {
    return { ok: false, reason: 'Notification permission denied.' };
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenResult.data;
  const devId = await resolveDeviceId();

  const { firestore } = getFirebaseServices();
  const ref = doc(firestore, 'users', user.uid, 'devices', devId);
  await setDoc(
    ref,
    {
      pushToken,
      platform: Platform.OS,
      active: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true };
}
