// app/(tabs)/dashboard/index.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ← NEW STATE
  const [data, setData] = useState({
    performance: { totalBookings: 0, completed: 0, pending: 0, cancelled: 0 },
    revenue: { totalRevenue: 0, pendingRevenue: 0 },
    currentMonthEarnings: 0,
    history: []
  });

  const fetchDashboard = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setLoading(true);
      setRefreshing(true);

      const [summaryRes, earningsRes, historyRes] = await Promise.all([
        api.get('/partners/me/dashboard'),
        api.get('/partners/me/earnings/monthly'),
        api.get('/partners/me/status-history')
      ]);

      setData({
        performance: summaryRes.data.performance,
        revenue: summaryRes.data.revenue,
        currentMonthEarnings: earningsRes.data.currentMonthEarnings,
        history: historyRes.data.history
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to refresh dashboard' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, []);

  const performanceData = [
    { label: 'Total Bookings', value: data.performance.totalBookings.toString(), icon: 'calendar', color: '#4CAF50', bgColor: '#E8F5E9' },
    { label: 'Completed', value: data.performance.completed.toString(), icon: 'checkmark-circle-sharp', color: '#2196F3', bgColor: '#E3F2FD' },
    { label: 'Pending', value: data.performance.pending.toString(), icon: 'time-outline', color: '#FF9800', bgColor: '#FFF3E0' },
    { label: 'Cancelled', value: data.performance.cancelled.toString(), icon: 'close-circle', color: '#F44336', bgColor: '#FFEBEE' },
  ];

  const revenueData = [
    { label: 'Total Revenue', value: `₹${data.revenue.totalRevenue}`, icon: 'wallet', color: '#9C27B0', bgColor: '#F3E5F5' },
    { label: 'Pending Revenue', value: `₹${data.revenue.pendingRevenue}`, icon: 'time-outline', color: '#795548', bgColor: '#EFEBE9' },
  ];

  const quickActions = [
    { label: 'Home', icon: 'home-outline', screen: '/' },
    { label: 'View Bookings', icon: 'calendar-outline', screen: '/bookings' },
    { label: 'Payments', icon: 'wallet-outline', screen: '/payments' },
    { label: 'My Profile', icon: 'person-outline', screen: '/profile' },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content"/>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginLeft: 12 }}>Dashboard</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={ // ← THIS IS THE ONLY NEW LINE YOU SEE
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
      >
        {/* === ALL YOUR BEAUTIFUL UI BELOW (UNCHANGED) === */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16 }}>Performance Summary</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {performanceData.map((item, index) => (
            <View key={index} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '48%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: item.bgColor }}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{item.label}</Text>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#000' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Revenue, Earnings Overview, History, Quick Actions — ALL SAME AS BEFORE */}
        <View style={{ marginBottom: 16 }}>
          {revenueData.map((item, index) => (
            <View key={index} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16, backgroundColor: item.bgColor }}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#000' }}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>Earnings Overview</Text>
            <Text style={{ fontSize: 14, color: '#999' }}>Last 30 days</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Current Month Earnings</Text>
          <Text style={{ fontSize: 36, fontWeight: '700', color: '#9C27B0' }}>₹{data.currentMonthEarnings}</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 }}>Last 30 Days Summary</Text>
          {data.history.length === 0 ? (
            <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>No activity in last 30 days</Text>
          ) : (
            data.history.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: index < data.history.length - 1 ? 1 : 0, borderBottomColor: '#F5F5F5' }}>
                <Text style={{ fontSize: 16, color: '#000', fontWeight: '500' }}>{item._id}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                    <Ionicons name="ellipse" size={12} color="#4CAF50" />
                    <Text style={{ fontSize: 16, color: '#000', fontWeight: '600', marginLeft: 6 }}>{item.completed}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="ellipse" size={12} color="#F44336" />
                    <Text style={{ fontSize: 16, color: '#000', fontWeight: '600', marginLeft: 6 }}>{item.cancelled}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} onPress={() => router.push(action.screen)} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '48%', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name={action.icon} size={32} color="#000" />
              </View>
              <Text style={{ fontSize: 14, color: '#000', textAlign: 'center', fontWeight: '500' }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}