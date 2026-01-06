// store/slices/bookingHistorySlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  bookings: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
};

export const fetchBookingHistory = createAsyncThunk(
  'bookingHistory/fetch',
  async ({ page = 1, limit = 10 }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/partners/me/bookings?page=${page}&limit=${limit}`);
      return { bookings: res.data.bookings, page, hasMore: res.data.hasMore };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load history');
    }
  }
);

const bookingHistorySlice = createSlice({
  name: 'bookingHistory',
  initialState,
  reducers: {
    resetHistory: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingHistory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.bookings = action.payload.bookings;
        } else {
          state.bookings.push(...action.payload.bookings);
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchBookingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetHistory } = bookingHistorySlice.actions;
export default bookingHistorySlice.reducer;