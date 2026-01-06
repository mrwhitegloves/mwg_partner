// app/_layout.jsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../store/store';
import SplashScreen from './(onboarding)/splash';

import { getSocket, initializeSocket } from '@/services/socket';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// ────── ROOT LAYOUT ──────
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Initialize socket
      socketRef.current = await initializeSocket();
    })();
  }, []);

  // // Handle notification tap (foreground & background)
  // useEffect(() => {
  //   const unsubscribe = Notifications.addNotificationResponseReceivedListener(response => {
  //     const data = response.notification.request.content.data;
  //     if (data?.type === 'new_booking' && data.bookingId) {
  //       stopRingtone();
  //       router.replace(`/incoming-booking/${data.bookingId}`);
  //     }
  //   });
  //   return () => unsubscribe();
  // }, []);

  // // Handle foreground notifications (ringtone + Notifee)
  // useEffect(() => {
  //   const unsubscribe = Notifications.addNotificationReceivedListener(async notification => {
  //     const data = notification.request.content.data;
  //     if (data?.type === 'new_booking') {
  //       await playRingtone();
  //       await showBookingNotification(data);
  //     }
  //   });
  //   return () => unsubscribe();
  // }, []);

  // Socket fallback (in case FCM fails)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = async (data) => {
      // await playRingtone();
      console.log("data:-notifee ", data)
      // await showBookingNotification(data);
    // console.log(`New Booking! ₹${data.total} at ${data.scheduledTime}`)
    // alert(`New Booking! ₹${data.total} at ${data.scheduledTime}`);
    };

    socket.on('newBooking', handler);
    return () => socket.off('newBooking', handler);
  }, []);

  // ────── RECONNECT SOCKET ──────
  useEffect(() => {
  // Initial connection
  initializeSocket().then((s) => {
    socketRef.current = s;
  });

  const subscription = AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      if (!socketRef.current?.connected) {
        socketRef.current = await initializeSocket();
      }
    }
  });

  return () => subscription.remove();
}, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="bookingDetails" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
          <Toast />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

// // Keep your existing showBookingNotification function
// async function showBookingNotification(booking) {
//   await notifee.requestPermission();
//   const channelId = await notifee.createChannel({
//     id: 'booking',
//     name: 'New Booking',
//     importance: AndroidImportance.HIGH,
//     sound: 'ringtone',
//     vibration: true,
//     vibrationPattern: [300, 500],
//   });

//   await notifee.displayNotification({
//     title: 'New Booking!',
//     body: `${booking.service || 'Service'} - ₹${booking.total} - ${booking.address}`,
//     data: { type: 'new_booking', bookingId: booking.bookingId },
//     android: {
//       channelId,
//       sound: 'ringtone',
//       vibrationPattern: [300, 500],
//       pressAction: { id: 'default' },
//       autoCancel: false,
//       ongoing: true,
//     },
//   });
// }