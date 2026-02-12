// app/providers/NotificationProvider.jsx
import api from "@/services/api";
import { registerForPushNotificationsAsync } from "@/services/expoNotifications";
import { setIncomingBooking } from "@/store/slices/bookingSlice";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function NotificationProvider({ children }) {
  const dispatch = useDispatch();
  const { partner } = useSelector((state) => state.auth);
  const notificationListener = useRef(null);

  // 1. Register push token + Foreground listener
  useEffect(() => {
    if (!partner?._id) return;

    let isMounted = true;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && isMounted) {
          await api.post("/partners/me/update-push-token", {
            pushToken: token,
          });
        }
      } catch (err) {
        console.log("Push setup failed:", err);
      }

      // FOREGROUND: Only one listener
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("notification test 1: ", notification);
          const data = notification.request.content.data;
          console.log("notification test 2: ", data);
          if (data?.type === "new_booking") {
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

  // 2. BACKGROUND + KILLED → TAP (NEW EXPO WAY — PERFECT)
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data?.type ===
        "new_booking" &&
      lastNotificationResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      console.log("notification test 3: ", lastNotificationResponse);
      const data = lastNotificationResponse.notification.request.content.data;
      console.log("notification test 4: ", data);
      dispatch(setIncomingBooking(data));
    }
  }, [lastNotificationResponse]);

  return <>{children}</>;
}
