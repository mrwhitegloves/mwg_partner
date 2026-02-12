// store/slices/authSlice.js (PARTNER APP)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import * as Notifications from 'expo-notifications';
import api from "../../services/api";
import { disconnectSocket, initializeSocket } from "../../services/socket";

const initialState = {
  token: null,
  partner: null,
  fcmToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// ────── UPLOAD EXPO PUSH TOKEN (WORKS WITH YOUR EXISTING BACKEND) ──────
export const uploadFcmTokenAsync = createAsyncThunk(
  "partnerAuth/uploadFcmToken",
  async (_, { rejectWithValue }) => {
    // try {
    //   // 1. Must be real device
    //   if (!Device.isDevice) {
    //     console.log("Expo push tokens only work on physical devices");
    //     return rejectWithValue("Physical device required");
    //   }
    //   // 2. Request permission
    //   const { status } = await Notifications.requestPermissionsAsync();
    //   if (status !== 'granted') {
    //     console.log("Notification permission denied");
    //     return rejectWithValue("Permission not granted");
    //   }
    //   // 3. Set Android channel (optional but recommended)
    //   if (Platform.OS === 'android') {
    //     await Notifications.setNotificationChannelAsync('booking', {
    //       name: 'New Booking Alerts',
    //       importance: Notifications.AndroidImportance.MAX,
    //       vibrationPattern: [0, 250, 250, 250],
    //       sound: 'ringtone.wav', // your custom sound
    //       enableVibrate: true,
    //     });
    //   }
    //   // 4. Get Expo Push Token (this IS a valid FCM token!)
    //   const projectId = Constants?.expoConfig?.extra?.eas?.projectId
    //                  || Constants?.manifest?.extra?.eas?.projectId;
    //   const tokenData = await Notifications.getExpoPushTokenAsync({
    //     projectId, // Required for EAS builds
    //   });
    //   const expoPushToken = tokenData.data;
    //   console.log("Expo Push Token Generated:", expoPushToken);
    //   // 5. Send to your backend (same endpoint you already use!)
    //   await api.put('/me/fcm/me', { fcmToken: expoPushToken });
    //   return expoPushToken;
    // } catch (error) {
    //   console.error("Failed to get/upload Expo push token:", error);
    //   return rejectWithValue(error.message);
    // }
  },
);

// ────── POST /partners/login ──────
export const loginPartnerAsync = createAsyncThunk(
  "partnerAuth/login",
  async ({ emailOrPhone, password }, { rejectWithValue, dispatch }) => {
    try {
      const res = await api.post("/partners/login", { emailOrPhone, password });
      const { token, partner } = res.data;

      // Save token
      await AsyncStorage.setItem("partnerToken", token);

      // Connect socket after login
      await initializeSocket();

      // ← SEND FCM TOKEN AFTER SUCCESSFUL LOGIN
      // await dispatch(uploadFcmTokenAsync());

      return { token, partner };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Login failed");
    }
  },
);

// ────── GET /partners/:id (Fetch logged-in partner) ──────
export const fetchPartnerMe = createAsyncThunk(
  "partnerAuth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/partners/me"); // ← Add this route in backend
      return res.data.partner;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to fetch partner",
      );
    }
  },
);

// Update online status
export const toggleOnlineStatus = createAsyncThunk(
  "partnerAuth/toggleOnline",
  async (isOnline, { rejectWithValue, dispatch }) => {
    try {
      const updates = { isAvailable: !isOnline }; // true → false, false → true
      const res = await api.patch("/partners/me", updates);
      await dispatch(fetchPartnerMe()); // Refresh partner data
      return res.data.partner;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to update status",
      );
    }
  },
);

// ────── LOGOUT ──────
export const logoutPartnerAsync = createAsyncThunk(
  "partnerAuth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Optional: Call backend logout
      await api.post("/partners/logout");
      await AsyncStorage.removeItem("partnerToken");
      disconnectSocket(); // ← Disconnect socket
      return;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Logout failed");
    }
  },
);

// ────── LOAD TOKEN FROM STORAGE ──────
export const loadPartnerTokenAsync = createAsyncThunk(
  "partnerAuth/loadToken",
  async () => {
    try {
      const token = await AsyncStorage.getItem("partnerToken");
      return token;
    } catch (err) {
      console.error("Error loading token from AsyncStorage:", err);
      return null;
    }
  },
);

const partnerAuthSlice = createSlice({
  name: "partnerAuth",
  initialState,
  reducers: {
    setPartnerToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setPartnerLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPartnerError: (state, action) => {
      state.error = action.payload;
    },
    updatePartner: (state, action) => {
      state.partner = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────── LOGIN ──────
      .addCase(loginPartnerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginPartnerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.partner = action.payload.partner;
        state.isAuthenticated = true;
      })
      .addCase(loginPartnerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────── LOAD TOKEN ──────
      .addCase(loadPartnerTokenAsync.fulfilled, (state, action) => {
        const token = action.payload;
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
        } else {
          state.token = null;
          state.isAuthenticated = false;
        }
      })

      // ────── FETCH ME ──────
      .addCase(fetchPartnerMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPartnerMe.fulfilled, (state, action) => {
        state.loading = false;
        state.partner = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchPartnerMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.isAuthenticated = false;
        AsyncStorage.removeItem("partnerToken");
        disconnectSocket();
      })

      // ────── UPLOAD FCM TOKEN ──────
      .addCase(uploadFcmTokenAsync.fulfilled, (state, action) => {
        state.fcmToken = action.payload;
      })
      .addCase(uploadFcmTokenAsync.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // ────── UPDATE PROFILE ──────
      .addCase(toggleOnlineStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleOnlineStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.partner = action.payload;
      })
      .addCase(toggleOnlineStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────── LOGOUT ──────
      .addCase(logoutPartnerAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutPartnerAsync.fulfilled, (state) => {
        state.token = null;
        state.partner = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutPartnerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  loadPartnerToken,
  setPartnerLoading,
  setPartnerError,
  updatePartner,
} = partnerAuthSlice.actions;

export default partnerAuthSlice.reducer;
