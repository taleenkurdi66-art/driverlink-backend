import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const API_URL = 'http://127.0.0.1:5000';
const DRIVER_ID = 2;

export default function DriverLiveLocationScreen() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('ئامادەیە');
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      subscription.current?.remove();
    };
  }, []);

  async function startLiveLocation() {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      if (!token) {
        setMessage('Token نەدۆزرایەوە');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setMessage('ڕێگەپێدان بە GPS نەدرا');
        return;
      }

      subscription.current?.remove();

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          setCoords(location.coords);

          try {
            const response = await fetch(
              `${API_URL}/api/drivers/${DRIVER_ID}/location`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  latitude,
                  longitude,
                }),
              }
            );

            if (response.ok) {
              setMessage('شوێنەکە نوێکرایەوە ✅');
            } else {
              setMessage(`هەڵەی سێرڤەر: ${response.status}`);
            }
          } catch {
            setMessage('پەیوەندی بە سێرڤەر نەکرا');
          }
        }
      );

      setRunning(true);
      setMessage('Live Location چالاکە 🟢');
    } catch {
      setMessage('هەڵە لە GPS');
    }
  }

  function stopLiveLocation() {
    subscription.current?.remove();
    subscription.current = null;
    setRunning(false);
    setMessage('Live Location وەستا 🔴');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Live Location</Text>

      <Text style={styles.driver}>شۆفێر: Ali Driver</Text>

      <View style={styles.card}>
        {coords ? (
          <>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>{coords.latitude.toFixed(6)}</Text>

            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>{coords.longitude.toFixed(6)}</Text>
          </>
        ) : (
          <Text style={styles.waiting}>شوێنی GPS هێشتا نەدۆزرایەوە...</Text>
        )}
      </View>

      <Text style={styles.message}>{message}</Text>

      {running ? (
        <TouchableOpacity style={styles.stopButton} onPress={stopLiveLocation}>
          <Text style={styles.buttonText}>🔴 وەستاندنی Live Location</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.startButton} onPress={startLiveLocation}>
          <Text style={styles.buttonText}>🟢 دەستپێکردنی Live Location</Text>
        </TouchableOpacity>
      )}

      {running && <ActivityIndicator size="large" style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#14213D',
    marginBottom: 10,
  },
  driver: {
    fontSize: 17,
    color: '#718096',
    marginBottom: 25,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
  },
  value: {
    color: '#14213D',
    fontSize: 20,
    fontWeight: '800',
  },
  waiting: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 14,
  },
  stopButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loader: {
    marginTop: 20,
  },
});
