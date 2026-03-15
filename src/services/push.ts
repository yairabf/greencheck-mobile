import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Platform } from 'react-native';
import { env } from '../config/env';
import { getFirebaseServices } from './firebase';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function registerWebPush(user: User): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'Web push is not supported on this browser/device.' };
  }

  if (!env.webPushVapidPublicKey) {
    return { ok: false, reason: 'Web push VAPID key is missing in app config.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'Notification permission denied.' };
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(env.webPushVapidPublicKey) as unknown as BufferSource,
    });
  }

  const endpoint = subscription.endpoint;
  const endpointId = endpoint.split('/').pop() || btoa(endpoint).slice(0, 32);

  const { firestore } = getFirebaseServices();
  const ref = doc(firestore, 'users', user.uid, 'devices', `web-${endpointId}`);
  await setDoc(
    ref,
    {
      platform: 'web',
      active: true,
      webPushSubscription: subscription.toJSON(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true };
}

export async function registerPushToken(user: User): Promise<{ ok: boolean; reason?: string }> {
  if (Platform.OS === 'web') {
    return registerWebPush(user);
  }

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
  if (!perms.granted) perms = await Notifications.requestPermissionsAsync();
  if (!perms.granted) return { ok: false, reason: 'Notification permission denied.' };

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
