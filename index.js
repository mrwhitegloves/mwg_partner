import { AppRegistry } from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import 'expo-router/entry';
import { displayIncomingCallNotification } from './services/notifeeService';

// BACKGROUND MESSAGE HANDLER (Data-only or Notification FCM)
// This handler listens for FCM messages when the app is in the background or killed.
// It is CRITICAL for the "Uber-style" wakeup.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  // If the message contains data about a new booking, trigger the full-screen notification
  if (remoteMessage.data && remoteMessage.data.type === 'new_booking') {
      try {
        const booking = remoteMessage.data.payload ? JSON.parse(remoteMessage.data.payload) : remoteMessage.data;
        console.log("Wake up! Displaying full screen notification...");
        await displayIncomingCallNotification(booking);
      } catch (error) {
        console.error("Error processing background notification:", error);
      }
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log('Background Event:', type, detail);
  
  if (type === EventType.ACTION_PRESS && pressAction.id === 'accept') {
    // Handle accept logic in background or await app open
    await notifee.cancelNotification(notification.id);
  }
});

