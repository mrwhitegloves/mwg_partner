import notifee, { AndroidImportance, AndroidVisibility, AndroidCategory, AndroidStyle } from '@notifee/react-native';

const CHANNEL_ID = 'new-bookings-v8'; // Bump version for fresh creation

export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'New Bookings',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default', // Fallback to default since booking.wav is missing
    vibration: true,
    vibrationPattern: [100, 250, 100, 250],
  });
};

export const displayIncomingCallNotification = async (booking) => {
  try {
    // Ensure channel exists
    await createNotificationChannel();

    // Display a notification
    await notifee.displayNotification({
      title: 'New Booking Request',
      body: `${booking.service || 'Service'} - ₹${booking.total || '0'}`,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.CALL,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        fullScreenAction: {
          id: 'default',
        },
        importance: AndroidImportance.HIGH,
        
        // CRITICAL: Full Screen Intent Configuration
        // This 'fullScreenAction' tells Android that this notification is high-priority
        // and should attempt to launch the app's Activity immediately (like an incoming call),
        // rather than just appearing as a banner in the tray.
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default', // Ensures Main Activity is launched
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        sound: 'default', // Fallback
        loopSound: false, // Cannot loop default sound easily
        autoCancel: false,
        ongoing: true, 
        
        // Additional properties
        timeoutAfter: 30000,
        showTimestamp: true,


      
      // Actions (Buttons on Notification)
      actions: [
        {
          title: 'Accept',
          pressAction: { id: 'accept', launchActivity: 'default' },
        },
        {
          title: 'Decline',
          pressAction: { id: 'decline' }, 
        },
      ],
    },
    data: {
      bookingId: booking.bookingId || '',
      type: 'new_booking',
      payload: JSON.stringify(booking),
    },
  });
  } catch (error) {
    console.error("Error displaying notification:", error);
  }
};

export const cancelBookingNotification = async () => {
  await notifee.cancelAllNotifications();
};
