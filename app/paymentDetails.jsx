// app/bookingDetails.jsx
import api from '@/services/api';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { getSocket } from '../services/socket';

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { partner } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [staticMapUrl, setStaticMapUrl] = useState(null);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const socket = getSocket();
    fetchBooking();
    requestLocationPermission();

    socket.on('bookingStatusUpdate', () => fetchBooking());
    return () => socket.off('bookingStatusUpdate');
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/partners/booking/${id}`);
      setBooking(res.data.booking);
      generateStaticMap(res.data.booking.serviceLocation.address);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load booking' });
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setPartnerLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } else {
      Toast.show({ 
        type: 'info', 
        text1: 'Location Access Required', 
        text2: 'Please allow location to show route',
        visibilityTime: 4000
      });
    }
  };

  const generateStaticMap = async (address) => {
    try {
      const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      if (!key) return setStaticMapUrl(null);

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
      );
      const data = await res.json();
      if (data.results[0]) {
        const loc = data.results[0].geometry.location;
        const partner = partnerLocation || { latitude: loc.lat, longitude: loc.lng };
        setStaticMapUrl(
          `https://maps.googleapis.com/maps/api/staticmap?center=${loc.lat},${loc.lng}&zoom=15&size=400x300&markers=color:blue|label:S|${loc.lat},${loc.lng}&markers=color:red|label:P|${partner.latitude},${partner.longitude}&key=${key}`
        );
      }
    } catch (err) {
      console.log('Static map failed:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 16 }}>Loading booking...</Text>
      </SafeAreaView>
    );
  }

  const status = booking.status;
  const total = booking.pricing.total;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar barStyle="dark-content" />
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 12 }}>Booking ID: #{booking.bookingId || id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* MAP - Only during active service */}
          <View style={{ height: 320, margin: 16, borderRadius: 12, overflow: 'hidden' }}>
            {staticMapUrl ? (
              <Image source={{ uri: staticMapUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                <Ionicons name="map" size={64} color="#ccc" />
                <Text style={{ marginTop: 8, color: '#666' }}>Loading map...</Text>
              </View>
            )}
            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#1976D2', padding: 12, borderRadius: 30 }}
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.serviceLocation.address}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="navigate" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

        {/* Service Location */}
        <View style={{ backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row' }}>
          <Ionicons name="location" size={24} color="#E53935" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Service Location</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>{booking.serviceLocation.address}</Text>
          </View>
        </View>

        {/* Status Banner */}
        {status === 'completed' && (
          <View style={{ backgroundColor: '#E8F5E9', margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row' }}>
            <Ionicons name="checkmark-circle" size={28} color="#2E7D32" />
            <Text style={{ marginLeft: 12, fontWeight: '700', color: '#2E7D32' }}>Service Completed Successfully</Text>
          </View>
        )}

        {/* Booking Info */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Booking Details</Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="car-wash" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.services[0]?.name || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={24} color="#9CA3AF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Time</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{booking.scheduledTime}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{new Date(booking.scheduledDate).getDate()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Date</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{new Date(booking.scheduledDate).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Payment Details</Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#F0FDF4', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <FontAwesome name="rupee" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1, backgroundColor: '#f9f9f9', paddingTop: 2, borderRadius: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Service Price</Text>
              <Text>₹{booking?.pricing?.servicePrice}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>GST (18%)</Text>
              <Text>₹{booking?.pricing?.tax}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Convenience Fee</Text>
              <Text>₹{booking?.pricing?.charges}.00</Text>
            </View>
            {booking?.pricing?.discount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#16a34a' }}>Discount</Text>
                <Text style={{ color: '#16a34a', fontWeight: '700' }}>-₹{booking?.pricing?.discount}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>Total Amount</Text>
              <Text style={{ fontWeight: '700', color: '#22C55E' }}>₹{booking?.pricing?.total}.00</Text>
            </View>
          </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 12 }}>
            <View style={{ width: 48, height: 48, backgroundColor: '#F0FDF4', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>{booking?.paymentType === 'pay online' ? ("Online Payment") : ("Offline Payment")}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{booking?.paymentType === 'pay online' ? ("Your payment completed") : ("Pay when service provider arrives")}</Text>
            </View>
            <View style={{ backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}>{booking?.paymentType === 'pay online' ? ("ONLINE") : ("OFFLINE")}</Text>
            </View>
            {booking?.paymentType === 'pay online' && (
            <View style={{ paddingHorizontal: 1, paddingVertical: 6, borderRadius: 6 }}>
              <Ionicons name="checkmark-done-circle" size={24} color="#F97316" />
            </View>
            )}
          </View>
        </View>

        {/* Customer */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Customer</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={32} color="#666" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>{booking.customer?.name || 'Customer'}</Text>
              <Text>{booking.customer?.phone || 'N/A'}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.customer.phone}`)}>
              <Ionicons name="call" size={28} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

                {/* ====== PARTNER EARNINGS / REVENUE BREAKDOWN ====== */}
        {status === 'completed' && booking.paymentSplit?.status === 'completed' && (
          <View style={{ 
            backgroundColor: '#fff', 
            marginHorizontal: 16, 
            marginBottom: 16, 
            padding: 20, 
            borderRadius: 16,
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ 
                width: 48, height: 48, 
                backgroundColor: '#10B981', 
                borderRadius: 24, 
                justifyContent: 'center', 
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="wallet" size={26} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>
                  Your Earnings
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                  Amount you received after all deductions
                </Text>
              </View>
            </View>

            {/* Calculations */}
            {(() => {
              const total = booking.pricing.total;
              const servicePrice = booking.pricing.servicePrice || 0;
              const tax = booking.pricing.tax || 0;
              const charges = booking.pricing.charges || 0;
              const commissionRate = partner?.commissionPercent || 20; // fallback 20%
              const partnerEarning = Math.round((servicePrice * commissionRate) / 100);

              return (
                <>
                  <View style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#4B5563' }}>Total Booking Amount</Text>
                      <Text style={{ fontWeight: '600' }}>₹{total}.00</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#4B5563' }}>- Convenience Fee</Text>
                      <Text style={{ color: '#DC2626' }}>- ₹{charges}.00</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#4B5563' }}>- GST (18%)</Text>
                      <Text style={{ color: '#DC2626' }}>- ₹{tax}.00</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '600', color: '#111827' }}>Base Service Amount</Text>
                      <Text style={{ fontWeight: '700', color: '#111827' }}>₹{servicePrice}.00</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#065F46', fontWeight: '600' }}>
                        Your Commission ({commissionRate}%)
                      </Text>
                      <Text style={{ fontSize: 14, color: '#065F46' }}>
                        ₹{servicePrice}.00 × {commissionRate}% = ₹{partnerEarning}.00
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#065F46' }}>
                        You Earned
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: '#10B981' }}>
                        ₹{partnerEarning}.00
                      </Text>
                    </View>
                  </View>

                  <View style={{ 
                    marginTop: 16, 
                    padding: 12, 
                    backgroundColor: '#F0FDF4', 
                    borderRadius: 8, 
                    flexDirection: 'row', 
                    alignItems: 'center' 
                  }}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={{ marginLeft: 8, fontSize: 13, color: '#166534', fontWeight: '600' }}>
                      This amount has been credited to your wallet
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}