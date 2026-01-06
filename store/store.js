import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import authReducer from './slices/authSlice';
import incomingBookingReducer from './slices/bookingSlice';
import onlineStatusReducer from './slices/onlineStatusSlice';
import userReducer from './slices/userSlice';

// 1️⃣ Combine all slices first
const rootReducer = combineReducers({
  auth: authReducer,
  onlineStatus: onlineStatusReducer,
  incomingBooking: incomingBookingReducer,
  user: userReducer,
});

// 2️⃣ Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // only persist auth slice
};

// 3️⃣ Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4️⃣ Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

// 5️⃣ Create persistor
export const persistor = persistStore(store);

// 6️⃣ Utility
export const getState = () => store.getState();
