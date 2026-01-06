// store/slices/bookingSlice.js
import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'incomingBooking',
  initialState: {
    booking: null,
    showModal: false,
  },
  reducers: {
    setIncomingBooking: (state, action) => {
      state.booking = action.payload;
      state.showModal = true;
    },
    clearIncomingBooking: (state) => {
      state.booking = null;
      state.showModal = false;
    },
  },
});

export const { setIncomingBooking, clearIncomingBooking } = bookingSlice.actions;
export default bookingSlice.reducer;