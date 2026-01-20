import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { clearIncomingBooking } from '@/store/slices/bookingSlice';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { stopRingtone } from '@/services/sound';
import Toast from 'react-native-toast-message';

export default function IncomingBookingModal() {
  const dispatch = useDispatch();
  const { booking, showModal } = useSelector((state) => state.incomingBooking);

  const handleNotificationAccept = async () => {
    if (!booking?.bookingId) return;

    try {
      await stopRingtone();
      await api.put(`/bookings/${booking.bookingId}/confirm`, {
        partnerLiveLocation: { latitude: 0, longitude: 0 },
      });

      const socket = getSocket();
      socket?.emit("acceptBooking", { bookingId: booking.bookingId });

      Toast.show({ type: "success", text1: "Booking Accepted!" });
      dispatch(clearIncomingBooking());
    } catch (err) {
      const msg = err.response?.data?.message || "Booking already taken";
      Toast.show({ type: "error", text1: msg });
      dispatch(clearIncomingBooking());
    } finally {
      await stopRingtone();
    }
  };

  const handleNotificationDecline = async () => {
    const socket = getSocket();
    socket?.emit("declineBooking", { bookingId: booking?.bookingId });
    await stopRingtone();
    dispatch(clearIncomingBooking());
    Toast.show({ type: "info", text1: "Booking Declined" });
  };

  return (
    <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, width: "90%", alignItems: "center" }}>
            <Ionicons name="car-sport" size={70} color="#4A90E2" />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginVertical: 20 }}>
              New Booking Alert!
            </Text>

            {booking && (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 8 }}>
                  <Text style={{ fontSize: 16, color: "#666" }}>Service</Text>
                  <Text style={{ fontSize: 18, fontWeight: "600" }}>
                    {booking.service}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 8 }}>
                  <Text style={{ fontSize: 16, color: "#666" }}>Amount</Text>
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: "#2ECC71" }}>
                     ₹{booking.total || booking.amount}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 8 }}>
                  <Text style={{ fontSize: 16, color: "#666" }}>Time</Text>
                  <Text style={{ fontSize: 16, textAlign: "right", flex: 1, marginLeft: 20 }}>
                    {booking.scheduledTime}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 8 }}>
                  <Text style={{ fontSize: 16, color: "#666" }}>Date</Text>
                  <Text style={{ fontSize: 16, textAlign: "right", flex: 1, marginLeft: 20 }}>
                    {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-GB') : "Today"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 8 }}>
                  <Text style={{ fontSize: 16, color: "#666" }}>Address</Text>
                  <Text style={{ fontSize: 16, textAlign: "right", flex: 1, marginLeft: 20 }}>
                    {typeof booking.address === 'object' 
                      ? `${booking.address.street}, ${booking.address.city}` 
                      : booking.address || "N/A"}
                  </Text>
                </View>
              </>
            )}

            <View style={{ flexDirection: "row", gap: 16, marginTop: 32, width: "100%" }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#E74C3C", padding: 16, borderRadius: 12, alignItems: "center" }}
                onPress={handleNotificationDecline}
              >
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#2ECC71", padding: 16, borderRadius: 12, alignItems: "center" }}
                onPress={handleNotificationAccept}
              >
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </Modal>
  );
}
