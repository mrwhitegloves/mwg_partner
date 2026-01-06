// import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getState } from '../store/store'; // Import store getter

// Helper to get token (async)
const getToken = async () => {
  try {
    // Check Redux state first
    const state = getState();
    const token = state.auth.token;
    if (token) {
      return token;
    }
    // Fallback to AsyncStorage
    const storedToken = await AsyncStorage.getItem('partnerToken');
    return storedToken;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mwg-backend.onrender.com/api' || 'http://192.168.29.36:5000/api',
  timeout: 10000,
});

// Request Interceptor: Add Bearer token if exists
api.interceptors.request.use(async (config) => {
  console.log('API Call:', config.method, config.url);
  console.log('BaseURL:', config.baseURL);
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Global error handling (e.g., 401 logout)
api.interceptors.response.use(
  (response) => {
    return response;
  },  
  async (error) => {
    console.log('API Error:', error.message, error.response?.status);
    console.log('Error URL:', error.config?.url);

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('partnerToken');
      // If using Redux, dispatch logout here (optional)
      // const { dispatch } = require('../redux/store');
      // dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;