// app/providers/NotificationProvider.jsx
import api from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/expoNotifications';
import { playRingtone } from './sound';
import { displayIncomingCallNotification } from './notifeeService';
import { initializeSocket } from '@/services/socket';
import { setIncomingBooking } from '@/store/slices/bookingSlice';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Platform } from 'react-native';
import notifee, { EventType, TriggerType, AndroidImportance, AndroidCategory } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

export default function NotificationProvider({ children }) {
  const dispatch = useDispatch();
  const { partner } = useSelector((state) => state.auth);
  const notificationListener = useRef(null);

  // 0. SOCKET LISTENER (Real-time Fallback)
  useEffect(() => {
    let socketCleanup = null;

    const setupSocketListener = async () => {
      const socket = await initializeSocket();
      if (!socket) return;

      const handler = async (data) => {
        console.log('SOCKET: New Booking Received', data);
        
        const Toast = require("react-native-toast-message").default;
        Toast.show({ type: 'info', text1: 'New Booking Received', text2: `ID: ${data.bookingId}` });
        
        // Trigger Full Screen Notification (Notifee) even in foreground
        await displayIncomingCallNotification(data);

        try {
          await playRingtone();
        } catch (e) {
          console.log("Ringtone error", e);
        }
        dispatch(setIncomingBooking(data));
      };

      socket.on('newBooking', handler);

      socketCleanup = () => {
        socket.off('newBooking', handler);
      };
    };

    setupSocketListener();

    return () => {
      if (socketCleanup) socketCleanup();
    };
  }, [dispatch, partner?._id]);

  // 1. Register push token + Foreground listener
  useEffect(() => {
    if (!partner?._id) return;

    let isMounted = true;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && isMounted) {
          await api.post('/partners/me/update-push-token', { pushToken: token });
        }
      } catch (err) {
        console.log('Push setup failed:', err);
      }

      // FOREGROUND: Only one listener
      notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
        const data = notification.request.content.data;
        if (data?.type === 'new_booking') {
          await playRingtone();
          dispatch(setIncomingBooking(data));
        }
      });
    };

    setupNotifications();

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
    };
  }, [partner?._id, dispatch]);

  // 2. CHECK IF APP WAS OPENED BY NOTIFEE (Initial Notification / Full Screen Launch)
  useEffect(() => {
    async function checkInitialNotification() {
      try {
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification) {
          console.log('App opened via Notifee Initial Notification', initialNotification);
          const { notification } = initialNotification;
          if (notification.data?.type === 'new_booking') {
              let bookingData = notification.data.payload;
              if (typeof bookingData === 'string') {
                try { bookingData = JSON.parse(bookingData); } 
                catch (e) { bookingData = notification.data; }
              } else if (!bookingData) { bookingData = notification.data; }
              
              dispatch(setIncomingBooking(bookingData));
              await playRingtone(); 
          }
        }
      } catch (e) {
        console.error("Error checking initial notification:", e);
      }
    }
    checkInitialNotification();
  }, [dispatch]);

  // 3. LISTEN FOR NOTIFEE FOREGROUND EVENTS (User Taps)
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          if (detail.notification?.data?.type === 'new_booking') {
             let bookingData = detail.notification.data.payload;
              if (typeof bookingData === 'string') {
                 try { bookingData = JSON.parse(bookingData); } catch (e) {}
              }
             dispatch(setIncomingBooking(bookingData || detail.notification.data));
          }
          break;
      }
    });
  }, [dispatch]);

  return <>{children}</>;
}