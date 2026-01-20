import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const PermissionScreen = () => {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    notification: false,
    background: true, 
  });

  const checkPermissions = async () => {
    // 1. Check Notifications
    const { status: notifStatus } = await Notifications.getPermissionsAsync();
    
    setPermissions({
      notification: notifStatus === 'granted',
      background: true, 
    });
  };

  useEffect(() => {
    checkPermissions();
    // Re-check when app comes to foreground (simple poll or event listener)
    const interval = setInterval(checkPermissions, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
        checkPermissions();
        Toast.show({ type: 'success', text1: 'Notifications Enabled' });
    } else {
        Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Please enable notifications in settings' });
        Linking.openSettings();
    }
  };

  const openAppInfo = () => {
    Linking.openSettings(); 
  };

  const handleContinue = async () => {
    if (permissions.notification) { 
      await AsyncStorage.setItem('permissions_shown', 'true');
      router.replace('/(tabs)'); 
    } else {
      Toast.show({ type: 'error', text1: 'Action Required', text2: 'Please grant notification permissions.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="shield-checkmark" size={100} color="#4A90E2" style={{ marginBottom: 20 }} />
        
        <Text style={styles.title}>Essential Permissions</Text>
        <Text style={styles.subtitle}>
          To receive high-priority booking alerts even when the app is closed, please enable the following:
        </Text>

        {/* 1. Notification Permission */}
        <View style={[styles.card, permissions.notification && styles.cardActive]}>
          <View style={[styles.cardIcon, permissions.notification && styles.iconActive]}>
             <Ionicons name="notifications" size={24} color={permissions.notification ? "#FFF" : "#4A90E2"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Push Notifications</Text>
            <Text style={styles.cardDesc}>Instant alerts for new jobs</Text>
          </View>
          <TouchableOpacity 
            style={[styles.buttonSmall, permissions.notification ? styles.buttonDone : {}]}
            onPress={requestNotificationPermission}
            disabled={permissions.notification}
          >
             {permissions.notification ? (
               <Ionicons name="checkmark" size={16} color="#FFF" />
             ) : (
               <Text style={styles.buttonTextSmall}>Enable</Text>
             )}
          </TouchableOpacity>
        </View>

        {/* 2. Critical Background Permission */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
             <Ionicons name="layers" size={24} color="#FF9800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Display Over Apps</Text>
            <Text style={styles.cardDesc}>"Start in Background" / "Popup"</Text>
          </View>
          <TouchableOpacity style={styles.buttonSmall} onPress={openAppInfo}>
             <Text style={styles.buttonTextSmall}>Open Settings</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.mainButton, !permissions.notification && styles.mainButtonDisabled]} 
          onPress={handleContinue}
          disabled={!permissions.notification}
        >
          <Text style={styles.mainButtonText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#1a1a1a' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  cardActive: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  
  cardIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#eef4ff',
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  iconActive: { backgroundColor: '#2ECC71' },
  
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#888' },
  
  buttonSmall: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#4A90E2',
    minWidth: 80, alignItems: 'center'
  },
  buttonDone: { backgroundColor: '#2ECC71', borderWidth: 0, minWidth: 40, paddingHorizontal: 0, width: 40, height: 40, justifyContent: 'center' },
  buttonTextSmall: { color: '#4A90E2', fontSize: 13, fontWeight: '600' },
  
  mainButton: {
    backgroundColor: '#4A90E2', paddingVertical: 18, paddingHorizontal: 32,
    borderRadius: 14, marginTop: 40, width: '100%', alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    elevation: 4
  },
  mainButtonDisabled: { backgroundColor: '#ccc', elevation: 0 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default PermissionScreen;
