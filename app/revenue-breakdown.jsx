// revenue-breakdown.jsx
import api from "@/services/api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RevenueBreakdownScreen() {
  const router = useRouter();

  const [breakdown, setBreakdown] = useState({
    totalRevenue: 0,
    totalGstAmount: 0,
    totalPlatformFee: 0,
    totalIncome: 0,
  });
  const [partnerDetail, setPartnerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all', 'last7days', 'last30days', 'last90days',

  const FILTER_OPTIONS = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "current_billing_period" },
    { label: "Last Month", value: "previous_billing_period" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "Last 90 Days", value: "last90days" },
    { label: "Past Year", value: "past_year" },
  ];

  // ─── Helper to format date range text for header ─────────────────
  const getDateRangeText = () => {
    const today = new Date();
    const formatDate = (date) =>
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    if (selectedFilter === "all") {
      return "Earning of All Time";
    }

    if (selectedFilter === "current_billing_period") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return `Earning from ${formatDate(start)} to ${formatDate(today)}`;
    }

    if (selectedFilter === "previous_billing_period") {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return `Earning from ${formatDate(firstDay)} to ${formatDate(lastDay)}`;
    }

    if (selectedFilter === "past_year") {
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return `Earning from ${formatDate(oneYearAgo)} to ${formatDate(today)}`;
    }

    // Relative days (last 7/30/90)
    let daysBack = 0;
    if (selectedFilter === "last7days") daysBack = 7;
    if (selectedFilter === "last30days") daysBack = 30;
    if (selectedFilter === "last90days") daysBack = 90;

    if (daysBack > 0) {
      const start = new Date(today);
      start.setDate(today.getDate() - daysBack);
      return `Earning from ${formatDate(start)} to ${formatDate(today)}`;
    }

    return "Earning of All Time";
  };

  // ─── Fetch Data with current filter ──────────────────────────────
  const fetchRevenueBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);

      let params = {};

      if (selectedFilter !== "all") {
        params.filterType = selectedFilter;
      }

      const response = await api.get("/partners/me/revenue-breakdown", {
        params,
      });

      if (response.data?.success && response.data?.breakdownData) {
        setBreakdown(response.data.breakdownData);
      }
    } catch (err) {
      console.log("Revenue fetch error:", err);
      const errMsg = err.response?.data?.error || "Failed to load revenue data";
      setError(errMsg);
      Toast.show({ type: "error", text1: "Error", text2: errMsg });
    } finally {
      setLoading(false);
    }
  };

  // Fetch partner commission percent (unchanged)
  const fetchPartnerDetail = async () => {
    try {
      const response = await api.get("/partners/me");
      if (response?.data?.partner) {
        setPartnerDetail(response.data.partner);
      }
    } catch (err) {
      console.log("Partner detail error:", err);
    }
  };

  // Load data on mount + whenever filter changes
  useEffect(() => {
    fetchRevenueBreakdown();
    if (!partnerDetail) fetchPartnerDetail();
  }, [selectedFilter]);

  // Calculate revenue after deductions
  const revenueAfterDeductions =
    breakdown.totalRevenue -
    breakdown.totalGstAmount -
    breakdown.totalPlatformFee;

  const partnerFinalEarning = partnerDetail?.commissionPercent
    ? Math.round(
        (revenueAfterDeductions * partnerDetail.commissionPercent) / 100,
      )
    : 0;

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F5F5F5",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ef4343" />
        <Text style={{ marginTop: 16, color: "#666" }}>
          Loading revenue data...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F5F5F5",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="alert-circle" size={64} color="#ef4343" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: "#333",
            textAlign: "center",
          }}
        >
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
            backgroundColor: "#ef4343",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F5F5" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          backgroundColor: "#FFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0F0",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#000",
            flex: 1,
            marginLeft: 12,
          }}
        >
          Revenue Breakdown
        </Text>

        {/* Filter Button */}
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color="#ef4343" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text
          style={{
            marginVertical: 5,
            marginHorizontal: 16,
            fontSize: 14,
            color: "#333",
            fontWeight: "600",
            fontStyle: "italic",
          }}
        >
          {getDateRangeText()}
        </Text>
        {/* Total Revenue Card */}
        <View
          style={{
            backgroundColor: "#FFF",
            marginVertical: 10,
            marginHorizontal: 16,
            padding: 20,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F0F0F0",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                backgroundColor: "#E8E3F3",
              }}
            >
              <Ionicons name="wallet" size={32} color="#7C5CFF" />
            </View>
            <View
              style={{
                flexDirection: "coloum",
                alignItems: "left",
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  flex: 1,
                }}
              >
                Total Revenue (Collected)
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                ₹
                {breakdown?.totalRevenue?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: "#999",
            }}
          >
            * Includes GST and platform fees.
          </Text>
        </View>

        {/* Deductions Section */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#333",
            marginHorizontal: 16,
            marginBottom: 10,
          }}
        >
          Deductions
        </Text>

        {/* GST Deduction */}
        <View
          style={{
            backgroundColor: "#FFF",
            marginHorizontal: 16,
            marginBottom: 10,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                backgroundColor: "#F5F5F5",
              }}
            >
              <Ionicons name="wallet" size={24} color="#666" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#333",
              }}
            >
              GST (18%)
            </Text>
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#333",
            }}
          >
            − ₹
            {breakdown?.totalGstAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Platform Fee */}
        <View
          style={{
            backgroundColor: "#FFF",
            marginHorizontal: 16,
            marginBottom: 10,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  backgroundColor: "#FFF3E0",
                }}
              >
                <MaterialCommunityIcons name="cog" size={24} color="#FF9800" />
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Platform Fee
                  </Text>
                  <TouchableOpacity style={{ marginLeft: 6, padding: 2 }}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#999",
                    marginTop: 4,
                  }}
                >
                  Tech, leads, CRM & support
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#333",
            }}
          >
            − ₹
            {breakdown?.totalPlatformFee.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Revenue After Deductions */}
        <View
          style={{
            backgroundColor: "#E8F5E9",
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 16,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 2,
            borderColor: "#42bc4c",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#333",
            }}
          >
            Revenue After Deductions:
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#2ECC71",
            }}
          >
            ₹
            {revenueAfterDeductions.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#FFF",
            marginHorizontal: 16,
            marginBottom: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#F0F0F0",
              flex: 1,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                backgroundColor: "#F5F5F5",
              }}
            >
              <Ionicons name="wallet" size={22} color="#666" />
            </View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: "#333",
              }}
            >
              Partner Commission ({partnerDetail?.commissionPercent}%)
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                {partnerDetail?.commissionPercent}% of ₹
                {revenueAfterDeductions.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#5f5f5f",
                }}
              >
                Calculation: ₹
                {revenueAfterDeductions.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                × {partnerDetail?.commissionPercent}% = ₹
                {partnerFinalEarning.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "coloum",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 8,
                backgroundColor: "#E8F5E9",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "#42bc4c",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                My Final Earnings
              </Text>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#333",
                }}
              >
                ₹
                {partnerFinalEarning.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* View Commission Details Button */}
        {/* <TouchableOpacity
          style={{
            marginHorizontal: 16,
            marginBottom: 32,
            backgroundColor: "#4A90E2",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => router.push("/commission-details")}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#FFF",
            }}
          >
            View Commission Details
          </Text>
        </TouchableOpacity> */}
      </ScrollView>

      {/* Filter Modal – same style as your Bookings.jsx */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
                color: "#000",
              }}
            >
              Filter Revenue By
            </Text>

            {FILTER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => {
                  setSelectedFilter(item.value);
                  setFilterModalVisible(false);
                }}
                style={{
                  padding: 16,
                  backgroundColor:
                    selectedFilter === item.value ? "#ef4343" : "#F5F5F5",
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: selectedFilter === item.value ? "#FFF" : "#000",
                    fontWeight: "600",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={{ padding: 16, marginTop: 16 }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#E53935",
                  fontWeight: "600",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
