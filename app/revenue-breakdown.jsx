import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RevenueBreakdownScreen() {
  const router = useRouter();

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
        {/* Subtitle */}
        <Text style={{
          fontSize: 15,
          color: '#999',
          textAlign: 'center',
          marginVertical: 20,
          paddingHorizontal: 24
        }}>
          How your earnings are calculated
        </Text>

        {/* Total Revenue Card */}
        <View style={{
          backgroundColor: '#FFF',
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
            ₹25,030.20
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
            − ₹3,818.50
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
            − ₹2,503.00
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
            ₹18,708.70
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