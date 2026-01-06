// store/slices/partnerEarningsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  totalEarnings: 0,
  todayEarnings: 0,
  thisWeekEarnings: 0,
  completedBookings: 0,
  loading: false,
  error: null,
};

// GET /partners/me/earnings
export const fetchEarnings = createAsyncThunk(
  'partnerEarnings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/partners/me/earnings');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch earnings');
    }
  }
);

const partnerEarningsSlice = createSlice({
  name: 'partnerEarnings',
  initialState,
  reducers: {
    resetEarnings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEarnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.loading = false;
        state.totalEarnings = action.payload.total || 0;
        state.todayEarnings = action.payload.today || 0;
        state.thisWeekEarnings = action.payload.week || 0;
        state.completedBookings = action.payload.completedCount || 0;
      })
      .addCase(fetchEarnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetEarnings } = partnerEarningsSlice.actions;
export default partnerEarningsSlice.reducer;