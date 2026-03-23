import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_STORAGE_KEY = 'push_registration';
const INSTALLATION_ID_STORAGE_KEY = 'push_installation_id';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Get the token used by Expo Push Service for this EAS project
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error('Missing EAS projectId for push notifications');
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  if (!token) return null;

  const installationId = await getOrCreateInstallationId();
  const registration = {
    pushToken: token,
    installationId,
    platform: Platform.OS,
    deviceName: Device.deviceName || Device.modelName || 'Unknown device',
  };

  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, JSON.stringify(registration));
  return registration;
};

export const scheduleLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // immediate
  });
};

export const getStoredPushRegistration = async () => {
  try {
    const raw = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const clearStoredPushRegistration = async () => {
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
};

async function getOrCreateInstallationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = `install-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALLATION_ID_STORAGE_KEY, generated);
  return generated;
}
