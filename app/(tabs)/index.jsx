// app/(tabs)/home/index.jsx
import api from "@/services/api";
import { getSocket } from "@/services/socket";
import { clearIncomingBooking } from "@/store/slices/bookingSlice";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartnerMe } from "../../store/slices/authSlice";
import { toggleOnlineStatus } from "../../store/slices/onlineStatusSlice";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { partner, loading } = useSelector((state) => state.auth);
  const onlineStatus = useSelector((state) => state.onlineStatus);

  // Removed local duplicate state (modalVisible, currentBooking)
  const [todayBookings, setTodayBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Fetch Today's Bookings
  const fetchTodayBookings = async () => {
    try {
      const res = await api.get('/partners/me/bookings/today');
      setTodayBookings(res.data.bookings || []);
    } catch (err) {
      console.log("err in fetchTodayBookings", err);
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
    dispatch(fetchPartnerMe());
  }, [dispatch]);

  // Handle Online Toggle
  const handleToggleOnline = () => {
    if (partner) {
      dispatch(toggleOnlineStatus(partner.isAvailable)); // true → false, false → true
    }
  };

  const isOnline = partner?.isAvailable;

  // Helper: Format time
  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '';

  // Helper: Status Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { bg: '#E8F5E8', color: '#4CAF50' };
      case 'in-progress': return { bg: '#E3F2FD', color: '#1976D2' };
      case 'confirmed': case 'assigned': return { bg: '#FFF3E0', color: '#FF9800' };
      default: return { bg: '#F5F5F5', color: '#666' };
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
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#4A90E2", justifyContent: "center", alignItems: "center", }} >
              <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "bold" }}>
                {partner?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isOnline && (
              <View style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#2ECC71", borderWidth: 2, borderColor: "#FFF", }} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 2, }} >
              Hi {partner?.name}
            </Text>
            <Text style={{ fontSize: 13, color: isOnline ? "#2ECC71" : "#E74C3C", fontWeight: "500", }} >
              {isOnline ? "Ready for New Services" : "You are Offline"}
            </Text>
          </View>
        </View>

        {/* Online/Offline Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {onlineStatus.loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <View style={[ { backgroundColor: isOnline ? "#2ECC71" : "#E74C3C", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, }, ]} >
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
            disabled={onlineStatus.loading}
          />
        </View>
      </View>

      {/* Today's Bookings List with Pull to Refresh */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} tintColor="#1976D2" />
        }
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 }}>
          Today Services ({todayBookings.length})
        </Text>

        {loadingBookings ? (
          <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 40 }} />
        ) : todayBookings.length === 0 ? (
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: "center" }}>
            <Ionicons name="car-sport-outline" size={48} color="#CCC" />
            <Text style={{ fontSize: 16, color: "#999", marginTop: 12 }}>No bookings for today</Text>
          </View>
        ) : (
          todayBookings.map((bookingItem) => {
            const statusStyle = getStatusStyle(bookingItem.status);
            return (
              <TouchableOpacity
                key={bookingItem._id}
                activeOpacity={0.8}
                onPress={() => router.push(`/bookingDetails?id=${bookingItem._id}`)}
              >
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Image source={{ uri: bookingItem.services[0].imageUrl }} style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: '#F5F5F5', marginRight: 12 }} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>
                        #{bookingItem.bookingId || bookingItem._id.slice(-6)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>Total Amount</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#4CAF50' }}>₹{bookingItem.pricing.total}</Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E0E0E0', marginBottom: 16 }} />

                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                      <Ionicons name="location" size={20} color="#E53935" />
                      <Text style={{ fontSize: 14, color: '#666', marginLeft: 8, flex: 1, lineHeight: 20 }}>
                        {bookingItem.serviceLocation.address}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                        <Ionicons name="calendar-outline" size={18} color="#666" />
                        <Text style={{ fontSize: 14, color: '#666', marginLeft: 6 }}>Today</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={18} color="#666" />
                        <Text style={{ fontSize: 14, color: '#666', marginLeft: 6 }}>{formatTime(bookingItem.scheduledTime)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: statusStyle.bg }}>
                    <MaterialIcons name={bookingItem.status === 'completed' ? 'check-circle' : 'access-time'} size={20} color={statusStyle.color} />
                    <Text style={{ fontSize: 14, fontWeight: '700', marginLeft: 8, color: statusStyle.color }}>
                      {bookingItem.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
