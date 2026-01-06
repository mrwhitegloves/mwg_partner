// app/services/expoNotifications.js
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  await new Promise(resolve => setTimeout(resolve, 500));
  let token;

  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Toast.show({
      type: 'info',
      text1: 'Notifications Disabled',
      text2: 'Enable in Settings → Notifications to get new bookings',
      visibilityTime: 4000,
      position: 'bottom',
    });
    console.log('Notification permission denied by user');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('new-bookings-v3', {
      name: 'New Bookings',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      lightColor: '#d92828ff',
    });
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.error('EAS Project ID not found!');
    Toast.show({
      type: 'error',
      text1: 'App Configuration Error',
      text2: 'Please update the app',
    });
    return null;
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = pushToken.data;
    console.log('Expo Push Token Registered:', token);

    // SUCCESS TOAST (only once per install)
    Toast.show({
      type: 'success',
      text1: 'Ready for Bookings!',
      text2: 'You will be notified for new jobs',
      visibilityTime: 3000,
      position: 'bottom',
    });

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    Toast.show({
      type: 'error',
      text1: 'Notification Setup Failed',
      text2: 'Restart app and try again',
    });
    return null;
  }
}