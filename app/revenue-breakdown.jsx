// revenue-breakdown.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import api from '@/services/api';

export default function RevenueBreakdownScreen() {
  const router = useRouter();

  const [breakdown, setBreakdown] = useState({
    totalRevenue: 0,
    totalGstAmount: 0,
    totalPlatformFee: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRevenueBreakdown = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/partners/me/revenue-breakdown');
        console.log("response: ",response)

        if (response.data?.breakdownData) {
          setBreakdown(response.data.breakdownData);
        }
      } catch (err) {
        console.error('Revenue fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueBreakdown();
  }, []);

  // Calculate revenue after deductions
  const revenueAfterDeductions = 
    breakdown.totalRevenue - breakdown.totalGstAmount - breakdown.totalPlatformFee;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4343" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading revenue data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle" size={64} color="#ef4343" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#333', textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
            // Re-fetch on retry
            setTimeout(() => setLoading(false), 1000); // Simulate retry delay
          }}
          style={{
            marginTop: 24,
            backgroundColor: '#ef4343',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
      }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333',
          flex: 1,
          textAlign: 'center'
        }}>
          Revenue Breakdown
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Total Revenue Card */}
        <View style={{
          backgroundColor: '#FFF',
          marginVertical: 20,
          marginHorizontal: 16,
          marginBottom: 24,
          padding: 24,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              backgroundColor: '#E8E3F3'
            }}>
              <Ionicons name="wallet" size={24} color="#7C5CFF" />
            </View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333',
              flex: 1
            }}>
              Total Revenue (Collected)
            </Text>
          </View>

          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 8
          }}>
            ₹{breakdown?.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <Text style={{
            fontSize: 14,
            color: '#999'
          }}>
            Includes GST from customers
          </Text>
        </View>

        {/* Deductions Section */}
        <Text style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: '#333',
          marginHorizontal: 16,
          marginBottom: 16
        }}>
          Deductions
        </Text>

        {/* GST Deduction */}
        <View style={{
          backgroundColor: '#FFF',
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 20,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              backgroundColor: '#F5F5F5'
            }}>
              <Ionicons name="wallet" size={24} color="#666" />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333'
            }}>
              GST (18%)
            </Text>
          </View>

          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333'
          }}>
            − ₹{breakdown?.totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Platform Fee */}
        <View style={{
          backgroundColor: '#FFF',
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 20,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start'
            }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                backgroundColor: '#FFF3E0'
              }}>
                <MaterialCommunityIcons name="cog" size={24} color="#FF9800" />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Platform Fee
                  </Text>
                  <TouchableOpacity style={{ marginLeft: 6, padding: 2 }}>
                    <Ionicons name="information-circle-outline" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
                <Text style={{
                  fontSize: 13,
                  color: '#999',
                  marginTop: 4
                }}>
                  Tech, leads, CRM & support
                </Text>
              </View>
            </View>
          </View>

          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333'
          }}>
            − ₹{breakdown?.totalPlatformFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Revenue After Deductions */}
        <View style={{
          backgroundColor: '#E8F5E9',
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 24,
          padding: 20,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333'
          }}>
            Revenue After Deductions
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#2ECC71'
          }}>
            ₹{revenueAfterDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* View Commission Details Button */}
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            marginBottom: 32,
            backgroundColor: '#4A90E2',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center'
          }}
          onPress={() => router.push('/commission-details')}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#FFF'
          }}>
            View Commission Details
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}