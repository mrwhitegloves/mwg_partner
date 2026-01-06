// store/slices/onlineStatusSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { fetchPartnerMe } from './authSlice';

const initialState = {
  isOnline: false,
  loading: false,
  error: null,
};

export const toggleOnlineStatus = createAsyncThunk(
  'onlineStatus/toggle',
  async (isOnline, { rejectWithValue, dispatch }) => {
    const socket = getSocket();

    try {
      const updates = { isAvailable: !isOnline };
      if (!isOnline) {
        const res = await api.patch('/partners/me', updates);
        await dispatch(fetchPartnerMe()); 
        socket?.emit('goOnline'); // No coords
        return res.data.partner;
      } else {
        const res = await api.patch('/partners/me', updates);
        await dispatch(fetchPartnerMe());
        socket?.emit('goOffline');
        return res.data.partner;
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const onlineStatusSlice = createSlice({
  name: 'onlineStatus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(toggleOnlineStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleOnlineStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isOnline = action.payload.isAvailable;
      })
      .addCase(toggleOnlineStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default onlineStatusSlice.reducer;