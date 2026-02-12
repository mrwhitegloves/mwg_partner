// app/splash.jsx  (or wherever you render it)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StatusBar,
  Text,
  View,
} from 'react-native';
import api from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const SplashScreen = () => {
  const router = useRouter();
//   const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);

  const logo = require("../../assets/images/mwg-logo.png")

  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  // Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigation Logic
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        let currentToken = token || (await AsyncStorage.getItem('partnerToken'));

        if (!currentToken) {
          setChecking(false);
          router.replace('/login');
          return;
        }

        const res = await api.get('/partners/me');
        const partner = res.data.partner;

        // Check if user has already seen permissions screen
        const hasPermissions = await AsyncStorage.getItem('permissions_shown');

        if (partner) {
           if (hasPermissions) {
             router.replace('/(tabs)');
           } else {
             router.replace('/(onboarding)/permissions'); 
           }
        } else {
           router.replace('/login');
        }
      } catch (err) {
        await AsyncStorage.removeItem('partnerToken');
        router.replace('/login');
      }
    };

    // Start checking after splash animation (or immediately)
    // const timer = setTimeout(() => {
      checkAuthAndRedirect();
    // }, 2000);

    // return () => clearTimeout(timer);
  }, [token, router]);

  // Show loading until we redirect
  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ff0000', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />

        {/* Animated Logo */}
        <Animated.View
          style={[
            { alignItems: 'center', marginBottom: 60 },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={{ width: 240, height: 140, justifyContent: 'center', alignItems: 'center' }}>
            <Image
                          source={logo}
                          style={{ width: 200, height: 200 }}
                          resizeMode="contain"
                        />
          </View>
        </Animated.View>

        {/* Loader */}
        <View style={{ alignItems: 'center', position: 'absolute', bottom: 120 }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: '#ffffffff', fontSize: 14, marginTop: 12, fontWeight: '500', opacity: 0.9 }}>
            Loading...
          </Text>
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 40 }}>
          <Text style={{ color: '#ffffffff', fontSize: 14, fontWeight: '500', opacity: 0.8 }}>
            Mr White Gloves
          </Text>
        </View>
      </View>
    );
  }

  // After checking, this won't render (router.replace will unmount)
  return null;
};

export default SplashScreen;