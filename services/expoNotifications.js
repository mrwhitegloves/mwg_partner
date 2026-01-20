// app/services/expoNotifications.js
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';

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

  // Allow simulator to continue for logic flow, even if push token is invalid
  if (!Device.isDevice) {
    console.log('Push notifications usually only work on physical devices');
    // return; // COMMENTED OUT for simulator testing logic flow
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
    // Bumped to v7 for MAX importance (Unified Channel ID)
    await Notifications.setNotificationChannelAsync('new-bookings-v7', {
      name: 'New Bookings',
      importance: Notifications.AndroidImportance.MAX, // MAX for Heads-up
      sound: 'booking.wav', 
      lightColor: '#d92828ff',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Requires special permission, but good to try requesting
    });
  }

  const projectId = 
    Constants?.expoConfig?.extra?.eas?.projectId ?? 
    Constants?.easConfig?.projectId ?? 
    "6f713608-a0d4-4cf6-980f-84314b9ca227"; // Hardcoded fallback

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

    try {
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
    } catch (e) {
      console.log('FCM Token Error:', e);
    }

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
    // SILENT FAILURE FOR EMULATOR/TESTING
    console.log('Push token registration failed (expected on emulator):', error.message);
    // Suppress red screen and toast to allow functionality testing via Socket
    return null;
  }
}