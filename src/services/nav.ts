import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateSafe(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (...args: unknown[]) => void)(name, params);
  }
}
