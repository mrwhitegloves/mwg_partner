import api from '@/services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

export default function PaymentsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('payouts');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    onlineEarnings: 0,
    cashEarnings: 0,
    totalBookings: 0,
  });

  // Date Filter State
  const [customRange, setCustomRange] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Temp dates for picker (never affect main state until "Done")
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { partner } = useSelector((state) => state.auth);

  // Fetch bookings
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/partners/payments');
      setBookings(res.data.bookings || []);
      setSummary(res.data.summary || { totalEarnings: 0, onlineEarnings: 0, cashEarnings: 0, totalBookings: 0 });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load earnings',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // REPLACE THIS ENTIRE filteredBookings BLOCK with this CORRECT version
const filteredBookings = bookings.filter((booking) => {
  if (!customRange) return true;

  // CRITICAL FIX: Correctly parse dd/mm/yyyy → Date object
  const [day, month, year] = booking.date.split('/').map(Number);
  const bookingDate = new Date(year, month - 1, day); // month is 0-indexed!
  bookingDate.setHours(0, 0, 0, 0);

  const start = new Date(customRange.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(customRange.endDate);
  end.setHours(23, 59, 59, 999);

  return bookingDate >= start && bookingDate <= end;
});

  // Recalculate summary for filtered data
  const filteredSummary = filteredBookings.reduce(
    (acc, b) => ({
      totalEarnings: acc.totalEarnings + b.payableAmount,
      onlineEarnings: acc.onlineEarnings + b.onlineAmount,
      cashEarnings: acc.cashEarnings + b.cashAmount,
      totalBookings: acc.totalBookings + 1,
    }),
    { totalEarnings: 0, onlineEarnings: 0, cashEarnings: 0, totalBookings: 0 }
  );

  // REPLACE your openDatePicker function with this
const openDatePicker = () => {
  setTempStartDate(customRange ? new Date(customRange.startDate) : null);
  setTempEndDate(customRange ? new Date(customRange.endDate) : null);
  setShowDatePicker(true);
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content"/>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <TouchableOpacity style={{ padding: 4 }} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginLeft: 12 }}>Payments</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFF', margin: 16, marginBottom: 8, borderRadius: 12, padding: 4 }}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payouts' && styles.activeTab]}
          onPress={() => setActiveTab('payouts')}
        >
          <MaterialIcons name="account-balance-wallet" size={20} color={activeTab === 'payouts' ? '#FFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'payouts' && { color: '#FFF' }]}>Payouts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cash' && styles.activeTab]}
          onPress={() => setActiveTab('cash')}
        >
          <MaterialIcons name="receipt" size={20} color={activeTab === 'cash' ? '#FFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'cash' && { color: '#FFF' }]}>Cash Audit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'payouts' ? (
          <>
            {/* Filter Button */}
            <TouchableOpacity
              onPress={openDatePicker}
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                backgroundColor: customRange ? '#5C6BC0' : '#FFF',
                borderWidth: customRange ? 0 : 1.5,
                borderColor: '#DDD',
                padding: 16,
                borderRadius: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={22} color={customRange ? '#FFF' : '#333'} />
                <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: customRange ? '#FFF' : '#333' }}>
                  {customRange
                    ? `${customRange.startDate.toLocaleDateString('en-IN')} – ${customRange.endDate.toLocaleDateString('en-IN')}`
                    : 'All Time'}
                </Text>
              </View>
              {customRange && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setCustomRange(null);
                    Toast.show({ type: 'info', text1: 'Filter cleared' });
                  }}
                >
                  <Ionicons name="close-circle" size={26} color="#FFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Summary */}
            {loading ? (
              <ActivityIndicator size="large" color="#5C6BC0" style={{ marginTop: 40 }} />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 }}>
                {[
                  { label: 'Total Payments', icon: 'account-balance-wallet', value: `₹${filteredSummary.totalEarnings}`, color: '#9C27B0' },
                  { label: 'Online', icon: 'book-online', value: `₹${filteredSummary.onlineEarnings}`, color: '#4CAF50' },
                  { label: 'Cash', icon: 'money', value: `₹${filteredSummary.cashEarnings}`, color: '#F44336' },
                ].map((item, i) => (
                  <View key={i} style={styles.summaryCard}>
                    <MaterialIcons name={item.icon} size={28} color={item.color} />
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{item.label}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: item.color }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <View style={{ padding: 60, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#999' }}>
                  {customRange ? 'No bookings in this range' : 'No completed bookings yet'}
                </Text>
              </View>
            ) : (
              filteredBookings.map((booking) => (
                <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/paymentDetails?id=${booking.id}`)}
      >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 17, fontWeight: '700' }}>Booking #{booking.bookingId}</Text>
                      <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                        {booking.serviceName} • {booking.customerName || 'Customer'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>PAID</Text>
                    </View>
                  </View>
                  <Text style={{ marginTop: 12, color: '#666' }}>{booking.date} at {booking.time}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                    <Text style={{ fontSize: 15, color: '#666' }}>Total Amount</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#4CAF50' }}>₹{booking.payableAmount}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            {/* Request Deposit Button */}
            {/* <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 12, marginBottom: 16, marginHorizontal: 16 }}>
              <MaterialIcons name="account-balance" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '700', marginLeft: 8 }}>Request Deposit</Text>
            </TouchableOpacity> */}

            {/* Cash Holdings */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginHorizontal: 16 }}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: '#E8F5E9' }}>
                  <MaterialIcons name="account-balance-wallet" size={28} color="#4CAF50" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Current Cash Holdings</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 }}>₹{partner?.currentCashInHand
}</Text>
                  <Text style={{ fontSize: 11, color: '#999' }}>Available for deposit</Text>
                </View>
              </View>

              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: '#E3F2FD' }}>
                  <MaterialIcons name="trending-up" size={28} color="#2196F3" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Lifetime Cash Collected</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 }}>₹{partner?.allTimeCashCollected}</Text>
                  <Text style={{ fontSize: 11, color: '#999' }}>Total earnings</Text>
                </View>
              </View>
            </View>

            {/* Transactions */}
            {/* {cashTransactions.map((transaction, index) => (
              <View key={index} style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: transaction.bgColor }}>
                  <MaterialIcons name="account-balance-wallet" size={24} color={transaction.isPositive ? '#4CAF50' : '#F44336'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>{transaction.type}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: transaction.isPositive ? '#4CAF50' : '#F44336' }}>
                      {transaction.amount}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{transaction.date}</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                    <View style={{ backgroundColor: '#E8F5E9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginRight: 8 }}>
                      <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>{transaction.status}</Text>
                    </View>
                    <View style={{ backgroundColor: '#E8F5E9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                      <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>{transaction.paymentType}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Type: {transaction.bookingType}</Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Booking: #{transaction.bookingId}</Text>
                </View>
              </View>
            ))} */}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* DATE PICKER MODAL - 100% WORKING */}
      <Modal visible={showDatePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={{ fontSize: 17, color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 19, fontWeight: '700' }}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => {
                  if (tempStartDate && tempEndDate && tempEndDate >= tempStartDate) {
                    const endWithTime = new Date(tempEndDate);
                    endWithTime.setHours(23, 59, 59, 999);
                    setCustomRange({ startDate: tempStartDate, endDate: endWithTime });
                    setShowDatePicker(false);
                    Toast.show({ type: 'success', text1: 'Filter Applied!' });
                  } else {
                    Toast.show({ type: 'error', text1: 'Invalid range', text2: 'End date must be after start date' });
                  }
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#5C6BC0' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Text style={[styles.dateText, tempStartDate && styles.dateTextSelected]}>
                {tempStartDate ? tempStartDate.toLocaleDateString('en-IN') : 'Start Date'}
              </Text>
              <Ionicons name="calendar" size={24} color="#5C6BC0" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dateButton, { marginTop: 16 }]} onPress={() => setShowEndPicker(true)}>
              <Text style={[styles.dateText, tempEndDate && styles.dateTextSelected]}>
                {tempEndDate ? tempEndDate.toLocaleDateString('en-IN') : 'End Date'}
              </Text>
              <Ionicons name="calendar" size={24} color="#5C6BC0" />
            </TouchableOpacity>

            {/* Native Date Pickers */}
            {showStartPicker && (
              <DateTimePicker
                value={tempStartDate || new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(e, date) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (date) {
                    setTempStartDate(date);
                    if (!tempEndDate || date > tempEndDate) setTempEndDate(date);
                  }
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={tempEndDate || new Date()}
                mode="date"
                minimumDate={tempStartDate || undefined}
                maximumDate={new Date()}
                onChange={(e, date) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (date) setTempEndDate(date);
                }}
              />
            )}

            {(tempStartDate || tempEndDate) && (
              <TouchableOpacity
                style={{ marginTop: 24, alignItems: 'center' }}
                onPress={() => {
                  setTempStartDate(null);
                  setTempEndDate(null);
                }}
              >
                <Text style={{ color: '#666' }}>Clear dates</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = {
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  activeTab: { backgroundColor: '#5C6BC0' },
  tabText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, width: '31%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  bookingCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dateButton: {
    backgroundColor: '#F8F9FA',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 17,
    color: '#999',
  },
  dateTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
};