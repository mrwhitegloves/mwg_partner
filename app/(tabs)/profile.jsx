// app/(partner)/profile.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '../../store/hooks';
import { logoutPartnerAsync } from '../../store/slices/authSlice';
import { persistor } from '../../store/store';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const [dashboard, setDashboard] = useState({
    performance: { totalBookings: 0, completed: 0, pending: 0, cancelled: 0 },
    revenue: { totalRevenue: 0, pendingRevenue: 0 },
    currentMonthEarnings: 0,
    history: []
  });

  // FETCH PROFILE
  const fetchProfile = async () => {
    try {
      const res = await api.get('/partners/me');
      setPartner(res.data.partner);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load profile' });
    }
  };

  // FETCH DASHBOARD DATA
  const fetchDashboard = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const [profileRes, dashRes, earningsRes, historyRes] = await Promise.all([
        api.get('/partners/me'),
        api.get('/partners/me/dashboard'),
        api.get('/partners/me/earnings/monthly'),
        api.get('/partners/me/status-history')
      ]);

      setPartner(profileRes.data.partner);
      setDashboard({
        performance: dashRes.data.performance,
        revenue: dashRes.data.revenue,
        currentMonthEarnings: earningsRes.data.currentMonthEarnings || 0,
        history: historyRes.data.history || []
      });

    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to refresh data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, []);

  // IMAGE UPLOAD
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'info', text1: 'Permission Required', text2: 'Please allow access to photos' });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (image) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: 'profile.jpg',
      });

      const res = await api.patch('/partners/image-upload/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPartner(res.data.partner);
      Toast.show({ type: 'success', text1: 'Profile picture updated!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutPartnerAsync()).unwrap();
      await persistor.purge();
      router.replace('/login');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Logout failed' });
    } finally {
      setLogoutModal(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#5B6DF5" />
        <Text style={{ marginTop: 16, color: '#718096' }}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#000' }}>My Profile</Text>
        <TouchableOpacity onPress={() => setLogoutModal(true)}>
          <Ionicons name="log-out-outline" size= {28} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5B6DF5']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          borderRadius: 16,
          padding: 24,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10
        }}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: partner?.imageUrl || 'https://via.placeholder.com/150' }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
              {uploading ? (
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 50,
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={{
                  position: 'absolute', bottom: 0, right: 0,
                  backgroundColor: '#5B6DF5', width: 34, height: 34,
                  borderRadius: 17, justifyContent: 'center', alignItems: 'center',
                  borderWidth: 3, borderColor: '#fff'
                }}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1A202C' }}>
              {partner?.name}
            </Text>
            <Text style={{ fontSize: 15, color: '#718096', marginTop: 4 }}>
              {partner?.email}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D3748', marginTop: 4 }}>
              {partner?.phone}
            </Text>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1A202C' }}>
            Performance This Month
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#10B981' }}>
                  {dashboard.performance.completed}
                </Text>
                <Text style={{ color: '#718096', fontSize: 13 }}>Completed</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#F59E0B' }}>
                  {dashboard.performance.pending}
                </Text>
                <Text style={{ color: '#718096', fontSize: 13 }}>Pending</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444' }}>
                  {dashboard.performance.cancelled}
                </Text>
                <Text style={{ color: '#718096', fontSize: 13 }}>Cancelled</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings */}
        {/* Earnings Overview - UPGRADED */}
<View style={{ marginHorizontal: 16, marginBottom: 24 }}>
  <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1A202C' }}>
    Earnings Overview
  </Text>
  <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
    
    {/* This Month Earnings - Gross */}
    <View style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <Text style={{ fontSize: 15, color: '#64748B' }}>Total Earnings This Month (Gross)</Text>
      <Text style={{ fontSize: 32, fontWeight: '800', color: '#10B981', marginTop: 6 }}>
        ₹{dashboard.currentMonthEarnings.toLocaleString('en-IN')}
      </Text>
    </View>
  </View>
</View>

        {/* Services */}
        <View style={{ marginHorizontal: 16, marginBottom: 100 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1A202C' }}>
            Services You Offer
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 }}>
            {partner?.servicesOffered?.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {partner.servicesOffered.map((service, i) => (
                  <View key={i} style={{
                    backgroundColor: '#EBF5FF',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 30,
                    borderWidth: 1,
                    borderColor: '#5B6DF5'
                  }}>
                    <Text style={{ color: '#1A202C', fontWeight: '600' }}>{service}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: '#A0AEC0', fontStyle: 'italic' }}>No services listed</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '85%', alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={60} color="#EF4444" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 16, color: '#1A202C' }}>Logout</Text>
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 16 }}>
              Are you sure you want to logout?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#E5E7EB', padding: 16, borderRadius: 12 }}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#EF4444', padding: 16, borderRadius: 12 }}
                onPress={handleLogout}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#fff' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}