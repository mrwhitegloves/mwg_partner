import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeSocket } from "@/services/socket";
import { useAppDispatch } from "@/store/hooks";
import {
  fetchPartnerMe,
  loadPartnerTokenAsync,
} from "@/store/slices/authSlice";
import { fetchEarnings } from "@/store/slices/partnerEarningsSlice";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  DevSettings,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NotificationProvider from "../../services/NotificationProvider";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (__DEV__) {
      return;
    }

    // ENABLE DEV MENU IN PRODUCTION (ONLY FOR TESTING!)
    DevSettings.addMenuItem("Show Logs & Reload", () => {
      DevSettings.reload();
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeSocket();
      dispatch(loadPartnerTokenAsync());
      dispatch(fetchPartnerMe());
      dispatch(fetchEarnings());
    };
    init();
  }, [dispatch]);

  // Map route names to tab identifiers
  const tabMap = {
    "/": "home",
    "/bookings": "bookings",
    "/dashboard": "dashboard",
    "/payments": "payments",
    "/profile": "profile",
  };

  const currentTab = tabMap[pathname] || "home";

  const handleTabPress = (tab) => {
    let route = "/";
    switch (tab) {
      case "home":
        route = "/";
        break;
      case "bookings":
        route = "/bookings";
        break;
      case "dashboard":
        route = "/dashboard";
        break;
      case "payments":
        route = "/payments";
        break;
      case "profile":
        route = "/profile";
        break;
    }
    router.replace(route);
  };

  return (
    <>
      <NotificationProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" }, // Hide default tab bar
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
            }}
          />
          <Tabs.Screen
            name="bookings"
            options={{
              title: "Bookings",
            }}
          />
          {/* Add placeholder screens so navigation works */}
          <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
          <Tabs.Screen name="payments" options={{ title: "Payments" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>

        {/* Custom Bottom Navigation */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#FFF",
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderTopWidth: 1,
            borderTopColor: "#F0F0F0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 5,
            paddingBottom: Platform.OS === "ios" ? 20 : 24,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
              onPress={() => handleTabPress("home")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="home"
                size={24}
                color={currentTab === "home" ? "#4A90E2" : "#999"}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: currentTab === "home" ? "#4A90E2" : "#999",
                  marginTop: 4,
                  fontWeight: currentTab === "home" ? "600" : "500",
                }}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
              onPress={() => handleTabPress("bookings")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color={currentTab === "bookings" ? "#4A90E2" : "#999"}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: currentTab === "bookings" ? "#4A90E2" : "#999",
                  marginTop: 4,
                  fontWeight: currentTab === "bookings" ? "600" : "500",
                }}
              >
                Bookings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 0,
                marginTop: -20,
              }}
              onPress={() => handleTabPress("dashboard")}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#FFF",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 6,
                  borderWidth: 1,
                  borderColor: "#F0F0F0",
                  marginBottom: 4,
                }}
              >
                <Ionicons name="grid-outline" size={28} color="#333" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: "#999",
                  marginTop: 4,
                  fontWeight: "500",
                }}
              >
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
              onPress={() => handleTabPress("payments")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="wallet-outline"
                size={24}
                color={currentTab === "payments" ? "#4A90E2" : "#999"}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: currentTab === "payments" ? "#4A90E2" : "#999",
                  marginTop: 4,
                  fontWeight: currentTab === "payments" ? "600" : "500",
                }}
              >
                Payments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
              onPress={() => handleTabPress("profile")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={currentTab === "profile" ? "#4A90E2" : "#999"}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: currentTab === "profile" ? "#4A90E2" : "#999",
                  marginTop: 4,
                  fontWeight: currentTab === "profile" ? "600" : "500",
                }}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </NotificationProvider>
    </>
  );
}

// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { initializeSocket } from '@/services/socket';
// import { useAppDispatch } from '@/store/hooks';
// import { fetchPartnerMe, loadPartnerTokenAsync } from '@/store/slices/authSlice';
// import { fetchEarnings } from '@/store/slices/partnerEarningsSlice';
// import { Ionicons } from '@expo/vector-icons';
// import { Tabs, usePathname, useRouter } from 'expo-router';
// import { useEffect } from 'react';
// import { DevSettings, Platform, Text, TouchableOpacity, View } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import NotificationProvider from '../../services/NotificationProvider';
// import { icon, spacing, radius, font } from '@/services/ui';  // ← Your responsive system

// export default function TabLayout() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const pathname = usePathname();
//   const dispatch = useAppDispatch();
//   const insets = useSafeAreaInsets();  // ← For responsive bottom padding

//   useEffect(() => {
//     if (__DEV__) {
//       return;
//     }

//     // ENABLE DEV MENU IN PRODUCTION (ONLY FOR TESTING!)
//     DevSettings.addMenuItem('Show Logs & Reload', () => {
//       DevSettings.reload();
//     });
//   }, []);

//   useEffect(() => {
//     const init = async () => {
//       await initializeSocket();
//       dispatch(loadPartnerTokenAsync());
//       dispatch(fetchPartnerMe());
//       dispatch(fetchEarnings());
//     };
//     init();
//   }, [dispatch]);

//   // Map route names to tab identifiers
//   const tabMap = {
//     '/': 'home',
//     '/bookings': 'bookings',
//     '/dashboard': 'dashboard',
//     '/payments': 'payments',
//     '/profile': 'profile',
//   };

//   const currentTab = tabMap[pathname] || 'home';

//   const handleTabPress = (tab) => {
//     let route = '/';
//     switch (tab) {
//       case 'home':
//         route = '/';
//         break;
//       case 'bookings':
//         route = '/bookings';
//         break;
//       case 'dashboard':
//         route = '/dashboard';
//         break;
//       case 'payments':
//         route = '/payments';
//         break;
//       case 'profile':
//         route = '/profile';
//         break;
//     }
//     router.replace(route);
//   };

//   return (
//     <>
//       <NotificationProvider>
//         <Tabs
//           screenOptions={{
//             headerShown: false,
//             tabBarStyle: { display: 'none' }, // Hide default tab bar
//           }}>
//           <Tabs.Screen name="index" options={{ title: 'Home' }} />
//           <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
//           <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
//           <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
//           <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
//         </Tabs>

//         {/* Custom Bottom Navigation — NOW FULLY RESPONSIVE */}
//         <View
//           style={{
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             backgroundColor: '#FFF',
//             paddingVertical: spacing.md,
//             paddingHorizontal: spacing.md,
//             borderTopWidth: 1,
//             borderTopColor: '#F0F0F0',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: -spacing.sm },
//             shadowOpacity: 0.05,
//             shadowRadius: spacing.lg,
//             elevation: 5,
//             paddingBottom: insets.bottom + spacing.sm,  // ← Responsive for gesture bar
//           }}>
//           <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
//             <TouchableOpacity
//               style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md }}
//               onPress={() => handleTabPress('home')}
//               activeOpacity={0.7}>
//               <Ionicons
//                 name="home"
//                 size={icon.lg}
//                 color={currentTab === 'home' ? '#4A90E2' : '#999'}
//               />
//               <Text
//                 style={{
//                   fontSize: font.sm,
//                   color: currentTab === 'home' ? '#4A90E2' : '#999',
//                   marginTop: spacing.xs,
//                   fontWeight: currentTab === 'home' ? '600' : '500',
//                 }}>
//                 Home
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md }}
//               onPress={() => handleTabPress('bookings')}
//               activeOpacity={0.7}>
//               <Ionicons
//                 name="document-text-outline"
//                 size={icon.lg}
//                 color={currentTab === 'bookings' ? '#4A90E2' : '#999'}
//               />
//               <Text
//                 style={{
//                   fontSize: font.sm,
//                   color: currentTab === 'bookings' ? '#4A90E2' : '#999',
//                   marginTop: spacing.xs,
//                   fontWeight: currentTab === 'bookings' ? '600' : '500',
//                 }}>
//                 Bookings
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{ flex: 1, alignItems: 'center', paddingVertical: 0, marginTop: -spacing.xl }}
//               onPress={() => handleTabPress('dashboard')}
//               activeOpacity={0.7}>
//               <View
//                 style={{
//                   width: spacing.xxl * 2,
//                   height: spacing.xxl * 2,
//                   borderRadius: spacing.xxl,
//                   backgroundColor: '#FFF',
//                   justifyContent: 'center',
//                   alignItems: 'center',
//                   shadowColor: '#000',
//                   shadowOffset: { width: 0, height: spacing.sm },
//                   shadowOpacity: 0.15,
//                   shadowRadius: spacing.lg,
//                   elevation: 6,
//                   borderWidth: 1,
//                   borderColor: '#F0F0F0',
//                   marginBottom: spacing.sm,
//                 }}>
//                 <Ionicons name="grid-outline" size={icon.xl} color="#333" />
//               </View>
//               <Text
//                 style={{
//                   fontSize: font.sm,
//                   color: '#999',
//                   marginTop: spacing.xs,
//                   fontWeight: '500',
//                 }}>
//                 Dashboard
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md }}
//               onPress={() => handleTabPress('payments')}
//               activeOpacity={0.7}>
//               <Ionicons
//                 name="wallet-outline"
//                 size={icon.lg}
//                 color={currentTab === 'payments' ? '#4A90E2' : '#999'}
//               />
//               <Text
//                 style={{
//                   fontSize: font.sm,
//                   color: currentTab === 'payments' ? '#4A90E2' : '#999',
//                   marginTop: spacing.xs,
//                   fontWeight: currentTab === 'payments' ? '600' : '500',
//                 }}>
//                 Payments
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md }}
//               onPress={() => handleTabPress('profile')}
//               activeOpacity={0.7}>
//               <Ionicons
//                 name="person-outline"
//                 size={icon.lg}
//                 color={currentTab === 'profile' ? '#4A90E2' : '#999'}
//               />
//               <Text
//                 style={{
//                   fontSize: font.sm,
//                   color: currentTab === 'profile' ? '#4A90E2' : '#999',
//                   marginTop: spacing.xs,
//                   fontWeight: currentTab === 'profile' ? '600' : '500',
//                 }}>
//                 Profile
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </NotificationProvider>
//     </>
//   );
// }
