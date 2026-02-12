import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ordersList = [
  {
    id: 'MWG1023',
    orderAmount: 1200,
    commission: 192,
    totalEarnings: 1920,
  },
  {
    id: 'MWG1024',
    orderAmount: 850,
    commission: 136,
    totalEarnings: 136,
  },
  {
    id: 'MWG1025',
    orderAmount: 1500,
    commission: 240,
    totalEarnings: 240,
  },
];

export default function CommissionDetailsScreen() {
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
          Commission Details
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Commission Rate Card */}
        <View style={{
          backgroundColor: '#E3F2FD',
          marginHorizontal: 16,
          marginTop: 20,
          marginBottom: 24,
          padding: 24,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#4A90E2'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Ionicons name="trending-up" size={24} color="#4A90E2" />
            </View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333'
            }}>
              Commission Rate
            </Text>
          </View>

          <Text style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#4A90E2'
          }}>
            20%
          </Text>
        </View>

        {/* Commission Amount Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: '#333',
            marginHorizontal: 16,
            marginBottom: 16
          }}>
            Commission Amount
          </Text>

          <View style={{
            backgroundColor: '#FFF',
            marginHorizontal: 16,
            padding: 24,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}>
            <Text style={{
              fontSize: 36,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 8
            }}>
              ₹3,741.74
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#999'
            }}>
              20% of ₹18,708.70
            </Text>
          </View>
        </View>

        {/* Net Earnings */}
        <View style={{
          backgroundColor: '#E8F5E9',
          marginHorizontal: 16,
          marginBottom: 32,
          padding: 20,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 2,
          borderColor: '#2ECC71'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333'
          }}>
            Net Earnings
          </Text>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#2ECC71'
          }}>
            ₹14,966.96
          </Text>
        </View>

        {/* Order-wise Earnings */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: '#333',
            marginHorizontal: 16,
            marginBottom: 16
          }}>
            Order-wise Earnings
          </Text>

          {ordersList.map((order) => (
            <View key={order.id} style={{
              backgroundColor: '#FFF',
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 20,
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
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F0F0F0'
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Booking #{order.id}
                </Text>

                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: '#2ECC71'
                }}>
                  ₹{order.totalEarnings}
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Text style={{
                    fontSize: 15,
                    color: '#666'
                  }}>
                    Order Amount:
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    ₹{order.orderAmount}
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Text style={{
                    fontSize: 15,
                    color: '#666'
                  }}>
                    Your Commission:
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#4A90E2'
                  }}>
                    ₹{order.commission}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}