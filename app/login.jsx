// app/(auth)/login.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { initializeSocket } from "../services/socket";
import { useAppDispatch } from "../store/hooks";
import { loginPartnerAsync } from "../store/slices/authSlice";

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) =>
    /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ""));

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields",
      });
      return;
    }

    if (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Enter valid email or phone",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        loginPartnerAsync({ emailOrPhone, password }),
      ).unwrap();

      // Connect socket after login
      await initializeSocket();

      Toast.show({
        type: "success",
        text1: "Welcome back!",
        text2: "Login successful",
      });

      router.replace("/(onboarding)/permissions");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: err || "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }} edges={["top"]}>
      <StatusBar barStyle={"dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        >
          <Text
            style={{ fontSize: 36, fontWeight: "bold", marginVertical: 32 }}
          >
            Partner Login
          </Text>

          <View style={inputStyle}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Email or Phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType={
                isValidPhone(emailOrPhone) ? "phone-pad" : "email-address"
              }
              autoCapitalize="none"
              style={{ flex: 1, fontSize: 16 }}
              placeholderTextColor="#c4c3c3ff"
            />
          </View>

          <View style={inputStyle}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ flex: 1, fontSize: 16, color: "#000000ff" }}
              placeholderTextColor="#c4c3c3ff"
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: "#2ECC71",
              borderRadius: 24,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 24,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>
                Login
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Component — Must be at root level */}
      <Toast />
    </SafeAreaView>
  );
}

const inputStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F5F5F5",
  borderRadius: 12,
  paddingHorizontal: 16,
  height: 56,
  marginBottom: 16,
};
