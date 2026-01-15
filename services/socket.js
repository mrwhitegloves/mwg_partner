// services/socket.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import api from '../services/api';

let socket = null;
let socketPromise = null;

const connect = async () => {
  const token = await AsyncStorage.getItem('partnerToken');
  if (!token) return null;
  let partner = null;
  try {
    const res = await api.get('/partners/me');
    partner = res.data.partner;
  } catch (err) {
    console.log('Failed to fetch partner/me:', err.response?.data || err.message);
    return null;
  }

  const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

  if (!SOCKET_URL) {
    console.error("EXPO_PUBLIC_SOCKET_URL is not defined! Check .env file");
    return null;
  }

  // Use local variable to prevent null reference in callbacks
  // Also connect to the /partner namespace
  const newSocket = io(process.env.EXPO_PUBLIC_SOCKET_URL + '/partner', {
    auth: { access_token: token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 3000,
    timeout: 20000,
  });

  socket = newSocket;

  newSocket.on('connect', () => {
    console.log('Socket Connected to /partner namespace');
    // GO ONLINE
    if(partner?.isAvailable === true){
      newSocket.emit('goOnline')
    }
  });

  newSocket.on('connect_error', (err) => {
    console.log('Socket error:', err.message);
  });

  newSocket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Optional: Listen for new bookings (debug)
  newSocket.on('newBooking', (data) => {
    console.log('New Booking Received:', data);
  });

  return newSocket;
};

export const initializeSocket = async () => {
  if (socket?.connected) return socket;
  if (socketPromise) return socketPromise;

  socketPromise = connect();
  socket = await socketPromise;
  socketPromise = null;
  return socket;
};

export const getSocket = () => {
  return socket; // Now returns actual socket when ready
};

// GO ONLINE (with optional location)
export const goOnline = (location = null) => {
  if (!socket?.connected) {
    console.log('Socket not connected, cannot go online');
    return;
  }
  socket.emit('goOnline', location ? { latitude: location.latitude, longitude: location.longitude } : {});
};

// GO OFFLINE
export const goOffline = () => {
  if (!socket?.connected) return;
  socket.emit('goOffline');
};

export const updateBookingStatus = (bookingId, status) => {
  if (!socket?.connected) return;
  socket.emit("booking.status.change", { bookingId, status });
};


export const disconnectSocket = () => {
  socket?.emit('goOffline')
  socket?.disconnect();
  socket = null;
  socketPromise = null;
};