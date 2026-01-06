// app/bookingDetails.jsx
import api from '@/services/api';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { getSocket, updateBookingStatus } from '../services/socket';

const { width } = Dimensions.get('window');

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [staticMapUrl, setStaticMapUrl] = useState(null);
  const [otp, setOtp] = useState('');
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState('');
  const [splitOnlineAmount, setSplitOnlineAmount] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null); // 'online' | 'cash' | 'split' | null
  const [qrPollingInterval, setQrPollingInterval] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    fetchBooking();
    requestLocationPermission();
    socket.emit("joinBooking", id);

    socket.on('booking.status.updated', () => fetchBooking());
    return () => socket.off('booking.status.updated');
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

  // ACTION HANDLERS
  const startService = async () => {
    await api.post(`/partners/booking/${id}/start-service`);
    updateBookingStatus(id, "enroute");
    fetchBooking();
  };

  const markArrived = async () => {
    await api.post(`/partners/booking/${id}/mark-arrived`);
    updateBookingStatus(id, "arrived");
    fetchBooking();
  };

  const verifyOtp = async () => {
    if (otp.length !== 4) return Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter 4-digit OTP' });
    await api.post(`/partners/booking/${id}/verify-otp`, { otp });
    updateBookingStatus(id, "in-progress");
    setOtp('');
    fetchBooking();
  };

  // Start polling when QR is shown
const startPaymentPolling = (qrCodeId) => {
  // Clear any existing interval first
  if (qrPollingInterval) {
    clearInterval(qrPollingInterval);
  }

  const interval = setInterval(async () => {
    try {
      const res = await api.get(`/payments/status/${qrCodeId}`);
      console.log("res in startPaymentPolling: ", res)

      if (res.data.success && res.data.data.status === 'completed') {
        // Payment completed!
        clearInterval(interval);
        setQrPollingInterval(null);

        handlePaymentSuccess(); // Your existing success handler
        Toast.show({
          type: 'success',
          text1: 'Payment Received!',
          text2: `₹${res.data.data.totalPaid} paid online`,
        });
      }
      // Optional: Handle partial payment
      else if (res.data.success && res.data.data.status === 'partial') {
        Toast.show({
          type: 'info',
          text1: 'Partial Payment',
          text2: `₹${res.data.data.onlinePaid} received online`,
        });
      }
    } catch (err) {
      console.log('Payment status polling error:', err);
      // Don't stop polling on error — network might be temporary
    }
  }, 4000); // Poll every 4 seconds (gentle on server)

  setQrPollingInterval(interval);
};

// Cleanup when QR screen closes or component unmounts
useEffect(() => {
  return () => {
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval);
      setQrPollingInterval(null);
    }
  };
}, [qrPollingInterval]);

  const openRazorpayQR = async (amount) => {
  if (!amount || amount <= 0) {
    Toast.show({ type: 'error', text1: 'Invalid Amount' });
    return;
  }

  try {
    setLoading(true);
    const res = await api.post('/payments/create-upi-qr', {
      amount: parseInt(amount),
      bookingId: booking._id,
      bookingNumber: booking.bookingId,
      // customerId: booking.customer?._id || null,
    });

    const { imageUrl } = res.data;

    // Save QR image URL in state to show full screen
    setRazorpayHtml(`
      <div style="background:#000;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;font-family:sans-serif">
        <h2>Customer Scan & Pay ₹${amount}</h2>
        <img src="${imageUrl}" style="width:700px;height:80vh;margin:20px;border-radius:16px" />
        <p>Waiting for payment...</p>
      </div>
    `);
    setShowRazorpay(true);

    // Start polling for payment
    startPaymentPolling(res.data.qrCodeId);

  } catch (err) {
    Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not generate QR' });
  } finally {
    setLoading(false);
  }
};

const closeQr = () => {
  setShowRazorpay(false);
  if (qrPollingInterval) {
    clearInterval(qrPollingInterval)
    setQrPollingInterval(null);
  };
};

  const handlePaymentSuccess = async () => {
    setShowRazorpay(false);
    await api.post(`/partners/booking/${id}/collect-payment`, { paymentMode: 'full-online', onlineAmount: booking.pricing.total });
    updateBookingStatus(id, "completed");
    fetchBooking();
    Toast.show({ type: 'success', text1: 'Payment Received!' });
  };

  const collectCash = async () => {
    await api.post(`/partners/booking/${id}/collect-payment`, { paymentMode: 'full-cash', cashAmount: booking.pricing.total });
    updateBookingStatus(id, "completed");
    fetchBooking();
  };

  const collectSplit = async () => {
    const online = parseInt(splitOnlineAmount);
    if (!online || online <= 0 || online >= booking.pricing.total) {
      return Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter valid online amount' });
    }
    await api.post(`/partners/booking/${id}/collect-payment`, {
      paymentMode: 'split',
      onlineAmount: online,
      cashAmount: booking.pricing.total - online
    });
    updateBookingStatus(id, "completed");
    fetchBooking();
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
      <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 12 }}>Booking ID: #{booking.bookingId || id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        {/* Vehicle Info */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Vehicle Details</Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef1f1ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="car-hatchback" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Company Name</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.vehicleDetails?.make || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef1f1ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="car-select" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Model</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.vehicleDetails?.model || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef1f1ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="segment" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Segment</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.vehicleDetails?.type || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef1f1ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="numbers" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>RC Number</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.vehicleDetails?.rc_number || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef1f1ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="invert-colors" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Vehicle Color</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.vehicleDetails?.color || 'N/A'}
              </Text>
            </View>
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

        {/* ACTION BUTTONS */}
        {status === 'confirmed' && (
          <TouchableOpacity style={{ backgroundColor: '#1976D2', margin: 16, padding: 18, borderRadius: 12 }} onPress={startService}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>Start Service</Text>
          </TouchableOpacity>
        )}

        {status === 'enroute' && (
          <TouchableOpacity style={{ backgroundColor: '#FF9800', margin: 16, padding: 18, borderRadius: 12 }} onPress={markArrived}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>I Have Reached</Text>
          </TouchableOpacity>
        )}

        {status === 'arrived' && (
          <View style={{ backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Enter Customer OTP</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 12, fontSize: 28, textAlign: 'center', letterSpacing: 12 }}
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              placeholder="0000"
              placeholderTextColor="#c4c3c3ff"
              autoFocus={false}
            />
            <TouchableOpacity style={{ backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, marginTop: 16 }} onPress={verifyOtp}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Verify OTP & Start Service</Text>
            </TouchableOpacity>
          </View>
        )}

        {(status === 'in-progress' || status === 'completed') && (
          <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 }}>Reached OTP</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ width: '100%', height: 70, borderRadius: 12, backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#2E7D32' }}>{booking.otp}</Text>
              </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            <Text style={{ fontSize: 14, color: '#2E7D32', fontWeight: '600', marginLeft: 8 }}>OTP Verified Successfully</Text>
          </View>
        </View>
        )}

        {/* {status === 'in-progress' && booking.paymentSplit?.status !== 'completed' && (
          <View style={{ backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>Collect Payment - ₹{total}</Text>

            <TouchableOpacity style={{ backgroundColor: '#9C27B0', padding: 16, borderRadius: 12, marginBottom: 12 }} onPress={() => openRazorpayQR(total)}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Full Online (Show QR)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, marginBottom: 12 }} onPress={collectCash}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Full Cash</Text>
            </TouchableOpacity>

            <View>
              <Text style={{ marginVertical: 12, fontWeight: '600' }}>Split Payment</Text>
              <TextInput
                placeholder="Online amount (e.g. 800)"
                keyboardType="number-pad"
                value={splitOnlineAmount}
                onChangeText={setSplitOnlineAmount}
                style={{ borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 12, marginBottom: 12 }}
              />
              <TouchableOpacity style={{ backgroundColor: '#FF9800', padding: 16, borderRadius: 12 }} onPress={collectSplit}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Collect Split Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} */}

                {/* NEW PROFESSIONAL COLLECT PAYMENT SECTION */}
        {status === 'in-progress' && (!booking.paymentSplit || booking.paymentSplit.status !== 'completed') && (
          <View style={{ backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, elevation: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20, textAlign: 'center' }}>
              Collect Payment - ₹{total}
            </Text>

            {/* Payment Method Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#374151' }}>
                Customer chose to pay via:
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                {['online', 'cash', 'split'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setSelectedPaymentMode(mode)}
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedPaymentMode === mode ? '#1976D2' : '#E5E7EB',
                      backgroundColor: selectedPaymentMode === mode ? '#EBF5FF' : '#F9FAFB',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={
                        mode === 'online' ? 'card' :
                        mode === 'cash' ? 'cash' : 'swap-horizontal'
                      }
                      size={28}
                      color={selectedPaymentMode === mode ? '#1976D2' : '#6B7280'}
                    />
                    <Text style={{ marginTop: 8, fontWeight: '600', textTransform: 'capitalize' }}>
                      {mode === 'online' ? 'Online' : mode === 'split' ? 'Split' : 'Cash'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ONLINE PAYMENT */}
            {selectedPaymentMode === 'online' && (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#059669', fontWeight: '600', marginBottom: 16 }}>
                  Full Amount: ₹{total} (Online)
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#9C27B0', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  onPress={() => openRazorpayQR(total)}
                >
                  <Ionicons name="qr-code" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    Show QR Code to Customer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CASH PAYMENT */}
            {selectedPaymentMode === 'cash' && (
              <View>
                <View style={{ backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, color: '#166534', fontWeight: '600' }}>
                    Cash to Collect
                  </Text>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: '#166534', marginTop: 8 }}>
                    ₹{total}.00
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#10B981', padding: 18, borderRadius: 12 }}
                  onPress={async () => {
                    await collectCash();
                    setSelectedPaymentMode(null);
                  }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>
                    Complete Service & Confirm Cash
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SPLIT PAYMENT */}
            {selectedPaymentMode === 'split' && (
              <View>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                  Enter Online Amount
                </Text>
                <TextInput
                  placeholder="Enter online amount"
                  keyboardType="number-pad"
                  value={splitOnlineAmount}
                  onChangeText={(val) => {
                    const num = val.replace(/[^0-9]/g, '');
                    if (num && parseInt(num) >= total) {
                      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Online amount cannot be same or maximum to total amount' });
                      return;
                    }
                    if (num && parseInt(num) === 0) {
                      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter more than ₹0 amount' });
                      return;
                    }
                    setSplitOnlineAmount(num);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 18,
                    textAlign: 'center',
                    backgroundColor: '#F9FAFB',
                    marginBottom: 16
                  }}
                  placeholderTextColor="#c4c3c3ff"
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#9C27B0', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}
                  onPress={() => openRazorpayQR(splitOnlineAmount || total / 2)}
                >
                  <Ionicons name="qr-code" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Collect Online Part (₹{splitOnlineAmount || Math.round(total / 2)})
                  </Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                  Remaining Cash Amount
                </Text>
                <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#92400E', fontWeight: '600', textAlign: 'center' }}>
                    Cash to collect: ₹{(total - (parseInt(splitOnlineAmount) || Math.round(total / 2) || 0))}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#10B981',
                    padding: 18,
                    borderRadius: 12,
                    opacity: splitOnlineAmount ? 1 : 0.5
                  }}
                  disabled={!splitOnlineAmount}
                  onPress={async () => {
                    await collectSplit();
                    setSelectedPaymentMode(null);
                    setSplitOnlineAmount('');
                  }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>
                    Complete Service & Confirm Split Payment
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Payment Details */}
        {status === 'completed' && booking.paymentSplit?.status === 'completed' && (
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 }}>Payment Details</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialIcons name="money" size={20} color="#666" />
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>Service Amount</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#000', fontWeight: '600', marginRight: 8 }}>₹{booking?.pricing?.servicePrice}.00</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Entypo name="price-tag" size={20} color="#666" />
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>GST (18%)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#000', fontWeight: '600', marginRight: 8 }}>₹{booking?.pricing?.tax}.00</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialIcons name="money" size={20} color="#666" />
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>Convenience Fee</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#000', fontWeight: '600', marginRight: 8 }}>₹{booking?.pricing?.charges}.00</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#000" />
              <Text style={{ fontSize: 16, color: '#000', fontWeight: '700', marginLeft: 8 }}>Total Amount</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: '#000', fontWeight: '700', marginRight: 8 }}>₹{booking?.pricing?.total}.00</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32', marginLeft: 8 }}>All Payments Collected</Text>
          </View>
        </View>
        )}

        {/* Payment History */}
        {status === 'completed' && booking.paymentSplit?.status === 'completed' && (
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <MaterialIcons name="history" size={24} color="#1976D2" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginLeft: 8 }}>Payment History</Text>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>Booking Payment Online</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32' }}>₹{booking?.paymentSplit?.onlineAmount}.00</Text>
              </View>
                {booking?.paymentSplit?.onlinePaidAt && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#999', flex: 1 }}>
                  {new Date(booking?.paymentSplit?.onlinePaidAt).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )}{' • '}
  {new Date(booking?.paymentSplit?.onlinePaidAt).toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  )}
                </Text>
                
                <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#2E7D32' }}>PAID</Text>
                </View>
              </View>
              )}
              <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>System message: Total amount paid online by customer</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>Booking Payment Cash</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32' }}>₹{booking?.paymentSplit?.cashAmount
}.00</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#999', flex: 1 }}>
                  {new Date(booking?.paymentSplit?.cashCollectedAt).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )}{' • '}
  {new Date(booking?.paymentSplit?.cashCollectedAt).toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  )}
                </Text>
                <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#2E7D32' }}>PAID</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>Cash payment collected</Text>
            </View>
          </View>
        </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* RAZORPAY QR FULL SCREEN */}
      {showRazorpay && (
        <View style={{ position: 'absolute', top: 40, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', padding: 16, backgroundColor: '#fff', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => closeQr()}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 18 }}>Customer Scan QR</Text>
          </View>
          <WebView
            source={{ html: razorpayHtml }}
            onMessage={(e) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                if (data.type === 'success') handlePaymentSuccess();
                if (data.type === 'cancel') setShowRazorpay(false);
              } catch {}
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}