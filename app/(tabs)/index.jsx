// app/(tabs)/home/index.jsx
// import { registerForPushNotificationsAsync } from '@/services/expoNotifications';
import api from "@/services/api";
import { getSocket, initializeSocket } from "@/services/socket";
import { clearIncomingBooking } from "@/store/slices/bookingSlice";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartnerMe } from "../../store/slices/authSlice";
import { toggleOnlineStatus } from "../../store/slices/onlineStatusSlice";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { partner, loading } = useSelector((state) => state.auth);
  const onlineStatus = useSelector((state) => state.onlineStatus);
  const { booking, showModal } = useSelector((state) => state.incomingBooking);
  const audioSource = require("../../assets/sounds/booking.wav");
  const player = useAudioPlayer(audioSource);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);

  console.log("notification test in home: ", booking);

  // Fetch Today's Bookings
  const fetchTodayBookings = async () => {
    try {
      const res = await api.get("/partners/me/bookings/today");
      setTodayBookings(res.data.bookings || []);
    } catch (err) {
      console.log("err in fetchTodayBookings", err);
      // Toast.show({ type: 'error', text1: 'Failed to load today\'s bookings' });
    } finally {
      setLoadingBookings(false);
      setRefreshing(false);
    }
  };

  // Pull to Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodayBookings();
  }, []);

  // Initial Load
  useEffect(() => {
    fetchTodayBookings();
  }, []);

  useEffect(() => {
    let cleanup = () => {};

    const setupSocket = async () => {
      const currentSocket = await initializeSocket(); // ← Wait for connection!
      if (!currentSocket) {
        console.log("Socket failed to connect");
        return;
      }

      const handleNewBooking = (data) => {
        setCurrentBooking(data);
        setModalVisible(true);
        player.play();
      };

      const handleCancelled = () => {
        setModalVisible(false);
        Toast.show({
          type: "error",
          text1: "Booking already assigned to another partner",
        });
      };

      currentSocket.on("newBooking", handleNewBooking);
      currentSocket.on("bookingCancelled", handleCancelled);

      cleanup = () => {
        currentSocket.off("newBooking", handleNewBooking);
        currentSocket.off("bookingCancelled", handleCancelled);
      };
    };

    setupSocket();

    return () => cleanup();
  }, []); // ← Only run once

  // Handle Android back button when modal is open
  // useFocusEffect(
  //   useCallback(() => {
  //     const onBackPress = () => {
  //       if (modalVisible) {
  //         handleDecline();
  //         return true;
  //       }
  //       return false;
  //     };
  //     const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  //     return () => subscription.remove();
  //   }, [modalVisible])
  // );

  // Toggle online/offline.
  const handleToggleOnline = () => {
    if (partner) {
      dispatch(toggleOnlineStatus(partner.isAvailable)); // true → false, false → true
    }
  };

  useEffect(() => {
    dispatch(fetchPartnerMe());
  }, [dispatch]);

  const handleAccept = async () => {
    if (!currentBooking) return;
    const socket = getSocket();

    try {
      player.pause();
      await api.put(`/bookings/${currentBooking.bookingId}/confirm`, {
        partnerLiveLocation: { latitude: 0, longitude: 0 },
      });
      if (socket) {
        socket.emit("acceptBooking", { bookingId: currentBooking.bookingId });
      }

      Toast.show({ type: "success", text1: "Booking Accepted!" });
      setModalVisible(false);
      // router.replace(`/active-booking/${currentBooking.bookingId}`);
      fetchTodayBookings();
    } catch (err) {
      const msg = err.response?.data?.message || "Booking already assigned";
      Toast.show({ type: "error", text1: msg });
      player.pause();
      setModalVisible(false);
    }
  };

  const handleDecline = () => {
    if (currentBooking) {
      const socket = getSocket();
      socket?.emit("declineBooking", { bookingId: currentBooking.bookingId });
    }
    player.pause();
    setModalVisible(false);
    Toast.show({ type: "info", text1: "Booking Declined" });
  };

  const handleNotificationAccept = async () => {
    if (!booking?.bookingId) return;

    try {
      player.pause(); // Ringtone on accept
      await api.put(`/bookings/${booking.bookingId}/confirm`, {
        partnerLiveLocation: { latitude: 0, longitude: 0 },
      });

      const socket = getSocket();
      socket?.emit("acceptBooking", { bookingId: booking.bookingId });

      Toast.show({ type: "success", text1: "Booking Accepted!" });
      dispatch(clearIncomingBooking());
      fetchTodayBookings();
    } catch (err) {
      const msg = err.response?.data?.message || "Booking already taken";
      Toast.show({ type: "error", text1: msg });
      dispatch(clearIncomingBooking());
    } finally {
      player.pause();
    }
  };

  const handleNotificationDecline = () => {
    const socket = getSocket();
    socket?.emit("declineBooking", { bookingId: booking?.bookingId });
    player.pause();
    dispatch(clearIncomingBooking());
    Toast.show({ type: "info", text1: "Booking Declined" });
  };

  const isOnline = partner?.isAvailable;

  // Helper: Format time
  const formatTime = (timeStr) => timeStr?.slice(0, 5) || "";

  // Helper: Status Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#E8F5E8", color: "#4CAF50" };
      case "in-progress":
        return { bg: "#E3F2FD", color: "#1976D2" };
      case "confirmed":
      case "assigned":
        return { bg: "#FFF3E0", color: "#FF9800" };
      default:
        return { bg: "#F5F5F5", color: "#666" };
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#FFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0F0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={{ position: "relative", marginRight: 12 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#4A90E2",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "bold" }}>
                {partner?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isOnline && (
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#2ECC71",
                  borderWidth: 2,
                  borderColor: "#FFF",
                }}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 2,
              }}
            >
              Hi {partner?.name}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isOnline ? "#2ECC71" : "#E74C3C",
                fontWeight: "500",
              }}
            >
              {isOnline ? "Ready for New Services" : "You are Offline"}
            </Text>
          </View>
        </View>

        {/* Online/Offline Toggle */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {onlineStatus.loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <View
              style={[
                {
                  backgroundColor: isOnline ? "#2ECC71" : "#E74C3C",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 20,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
          )}

          <Switch
            trackColor={{ false: "#767577", true: "#10B981" }}
            thumbColor={partner?.isAvailable ? "#fff" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleToggleOnline}
            value={partner?.isAvailable || false}
            disabled={onlineStatus.loading} // ← Prevent spam tap
          />
        </View>
      </View>

      {/* Today's Bookings List with Pull to Refresh */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1976D2"]}
            tintColor="#1976D2"
          />
        }
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 8,
          }}
        >
          Today Services ({todayBookings.length})
        </Text>

        {loadingBookings ? (
          <ActivityIndicator
            size="large"
            color="#1976D2"
            style={{ marginTop: 40 }}
          />
        ) : todayBookings.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
            }}
          >
            <Ionicons name="car-sport-outline" size={48} color="#CCC" />
            <Text style={{ fontSize: 16, color: "#999", marginTop: 12 }}>
              No bookings for today
            </Text>
          </View>
        ) : (
          todayBookings.map((booking) => {
            const statusStyle = getStatusStyle(booking.status);
            return (
              <TouchableOpacity
                key={booking._id}
                activeOpacity={0.8}
                onPress={() => router.push(`/bookingDetails?id=${booking._id}`)}
              >
                <View
                  key={booking._id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Image
                        source={{ uri: booking.services[0].imageUrl }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          backgroundColor: "#F5F5F5",
                          marginRight: 12,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#000",
                        }}
                      >
                        #{booking.bookingId || booking._id.slice(-6)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{ fontSize: 12, color: "#999", marginBottom: 2 }}
                      >
                        Total Amount
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#4CAF50",
                        }}
                      >
                        ₹{booking.pricing.total}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#E0E0E0",
                      marginBottom: 16,
                    }}
                  />

                  <View style={{ marginBottom: 16 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons name="location" size={20} color="#E53935" />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                          marginLeft: 8,
                          flex: 1,
                          lineHeight: 20,
                        }}
                      >
                        {booking.serviceLocation.address}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: 24,
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#666"
                        />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginLeft: 6 }}
                        >
                          Today
                        </Text>
                      </View>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons name="time-outline" size={18} color="#666" />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginLeft: 6 }}
                        >
                          {formatTime(booking.scheduledTime)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: statusStyle.bg,
                    }}
                  >
                    <MaterialIcons
                      name={
                        booking.status === "completed"
                          ? "check-circle"
                          : "access-time"
                      }
                      size={20}
                      color={statusStyle.color}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        marginLeft: 8,
                        color: statusStyle.color,
                      }}
                    >
                      {booking.status?.toUpperCase() || "PENDING"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* INCOMING BOOKING MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleDecline}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 32,
              width: "90%",
              alignItems: "center",
            }}
          >
            <Ionicons name="car-sport" size={70} color="#4A90E2" />
            <Text
              style={{ fontSize: 28, fontWeight: "bold", marginVertical: 20 }}
            >
              New Booking Alert!
            </Text>

            {currentBooking && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Service</Text>
                  <Text style={{ fontSize: 18, fontWeight: "600" }}>
                    {currentBooking.service}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Amount</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      color: "#2ECC71",
                    }}
                  >
                    ₹{currentBooking.total}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Time</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {currentBooking.scheduledTime}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Date</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {new Date(currentBooking.scheduledDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Address</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {currentBooking?.address?.street},{" "}
                    {currentBooking?.address?.city}
                  </Text>
                </View>
              </>
            )}

            <View
              style={{
                flexDirection: "row",
                gap: 16,
                marginTop: 32,
                width: "100%",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#E74C3C",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleDecline}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                >
                  Decline
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#2ECC71",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleAccept}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                >
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATION INCOMING BOOKING MODAL */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleNotificationDecline}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 32,
              width: "90%",
              alignItems: "center",
            }}
          >
            <Ionicons name="car-sport" size={70} color="#4A90E2" />
            <Text
              style={{ fontSize: 28, fontWeight: "bold", marginVertical: 20 }}
            >
              New Booking Alert!
            </Text>

            {booking && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Service</Text>
                  <Text style={{ fontSize: 18, fontWeight: "600" }}>
                    {booking.service}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Amount</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      color: "#2ECC71",
                    }}
                  >
                    ₹{booking.amount}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Time</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {booking.scheduledTime}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Date</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {new Date(booking.scheduledDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#666" }}>Address</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 20,
                    }}
                  >
                    {booking.address || "N/A"}
                  </Text>
                </View>
              </>
            )}

            <View
              style={{
                flexDirection: "row",
                gap: 16,
                marginTop: 32,
                width: "100%",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#E74C3C",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleNotificationDecline}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                >
                  Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#2ECC71",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleNotificationAccept}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                >
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
