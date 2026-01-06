// app/(tabs)/bookings/index.jsx or wherever your screen is
import api from '@/services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { font, spacing, radius, icon } from '@/services/ui';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  // { label: 'Enroute', value: 'enroute' },
  // { label: 'Arrived', value: 'arrived' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  // { label: 'Failed', value: 'failed' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const LIMIT = 20;

  // Fetch all bookings
  // const fetchBookings = async () => {
  //   try {
  //     const res = await api.get('/partners/me/bookings/all');
  //     console.log("res in fetchBookings: ", res)
  //     setBookings(res.data.bookings || []);
  //     applyFilter(res.data.bookings || [], filterStatus);
  //   } catch (err) {
  //     Toast.show({ type: 'error', text1: 'Failed to load bookings' });
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // };

  const fetchBookings = async (pageNum = 1, isRefresh = false) => {
    if (!isRefresh && pageNum > 1) setLoadingMore(true);
    if (isRefresh) setRefreshing(true);

    try {
      const res = await api.get('/partners/me/bookings/all', {
        params: { page: pageNum, limit: LIMIT },
      });

      const newBookings = res.data.bookings || [];
      const fetchedHasMore = res.data.pagination.hasMore;

      if (isRefresh || pageNum === 1) {
        setBookings(newBookings);
        applyFilter(newBookings, filterStatus);
      } else {
        setBookings(prev => [...prev, ...newBookings]);
        applyFilter([...bookings, ...newBookings], filterStatus);
      }

      setHasMore(fetchedHasMore);
      setPage(pageNum);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load bookings' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Apply filter (frontend only)
  const applyFilter = (data, status) => {
    if (status === 'all') {
      setFilteredBookings(data);
    } else {
      setFilteredBookings(data.filter(b => b.status === status));
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setFilterStatus('all');
    fetchBookings(1, true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchBookings(page + 1);
    }
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    applyFilter(bookings, status);
    setFilterModalVisible(false);
  };

  useEffect(() => {
    fetchBookings(1);
  }, []);

  // Status Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { color: '#4CAF50', bg: '#E8F5E9', icon: 'check-circle' };
      case 'in-progress': return { color: '#1976D2', bg: '#E3F2FD', icon: 'access-time' };
      case 'confirmed': case 'enroute': case 'arrived': return { color: '#FF9800', bg: '#FFF3E0', icon: 'access-time' };
      case 'cancelled': case 'failed': return { color: '#F44336', bg: '#FFEBEE', icon: 'cancel' };
      default: return { color: '#666', bg: '#F5F5F5', icon: 'hourglass-empty' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content"/>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', flex: 1, marginLeft: 12 }}>
          Latest Bookings ({filteredBookings.length})
        </Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="options-outline" size={24} color="#000" />
          <Text style={{ fontSize: 16, color: '#000', marginLeft: 4 }}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} tintColor="#1976D2" />
        }
      >
        {loading && page === 1 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={{ marginTop: spacing.lg, fontSize: font.lg, color: '#666' }}>Loading bookings...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="car-sport-outline" size={icon.xl * 2} color="#CCC" />
            <Text style={{ fontSize: font.xl, color: '#999', marginTop: spacing.xl }}>No bookings found</Text>
          </View>
        ) : (
          <>
            {filteredBookings.map((booking) => {
              const statusStyle = getStatusStyle(booking.status);
              return (
                <TouchableOpacity
                  key={booking._id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/bookingDetails?id=${booking._id}`)}
                  style={{ marginBottom: spacing.md }}
                >
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Image
                          source={{ uri: booking.services[0]?.imageUrl || 'https://via.placeholder.com/50' }}
                          style={{ width: 50, height: 50, borderRadius: radius.md, marginRight: spacing.md }}
                        />
                        <Text style={{ fontSize: font.xl, fontWeight: '700', color: '#000' }}>
                          #{booking.bookingId || booking._id.slice(-6).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: font.sm, color: '#999', marginBottom: spacing.xs }}>Total Amount</Text>
                        <Text style={{ fontSize: font.xl, fontWeight: '700', color: '#4CAF50' }}>₹{booking.pricing.total}</Text>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#E0E0E0', marginBottom: spacing.md }} />

                    <View style={{ marginBottom: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                        <Ionicons name="location" size={icon.md} color="#E53935" />
                        <Text style={{ fontSize: font.md, color: '#666', marginLeft: spacing.sm, flex: 1 }}>
                          {booking.serviceLocation.address}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="calendar-outline" size={icon.md} color="#666" />
                          <Text style={{ fontSize: font.md, color: '#666', marginLeft: spacing.xs }}>{formatDate(booking.scheduledDate)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={icon.md} color="#666" />
                          <Text style={{ fontSize: font.md, color: '#666', marginLeft: spacing.xs }}>{formatTime(booking.scheduledTime)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      borderRadius: radius.lg,
                      backgroundColor: statusStyle.bg,
                    }}>
                      <MaterialIcons name={statusStyle.icon} size={icon.lg} color={statusStyle.color} />
                      <Text style={{ fontSize: font.md, fontWeight: '700', marginLeft: spacing.sm, color: statusStyle.color }}>
                        {booking.status?.toUpperCase().replace('-', ' ')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                style={{
                  backgroundColor: '#1976D2',
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  marginTop: spacing.xl,
                  marginBottom: spacing.lg,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: spacing.md,
                  opacity: loadingMore ? 0.7 : 1,
                }}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Ionicons name="arrow-down-circle" size={icon.lg} color="#FFF" />
                )}
                <Text style={{ color: '#FFF', fontSize: font.md, fontWeight: '700' }}>
                  {loadingMore ? 'Loading...' : 'Load More Bookings'}
                </Text>
              </TouchableOpacity>
            )}

            {!hasMore && filteredBookings.length > 0 && (
              <Text style={{
                textAlign: 'center',
                marginTop: spacing.xl,
                marginBottom: spacing.lg,
                fontSize: font.lg,
                color: '#999',
                fontStyle: 'italic',
              }}>
                You've reached the end!
              </Text>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>Filter by Status</Text>
            {STATUS_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => handleFilter(item.value)}
                style={{ padding: 16, backgroundColor: filterStatus === item.value ? '#1976D2' : '#F5F5F5', borderRadius: 12, marginBottom: 8 }}
              >
                <Text style={{ textAlign: 'center', color: filterStatus === item.value ? '#FFF' : '#000', fontWeight: '600' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={{ padding: 16 }}>
              <Text style={{ textAlign: 'center', color: '#E53935', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}