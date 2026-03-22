import { createNavigationContainerRef } from '@react-navigation/native';

/** Single ref so drawer / services can open stack screens without fragile getParent() chains */
export const navigationRef = createNavigationContainerRef();

export function navigateRoot(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
