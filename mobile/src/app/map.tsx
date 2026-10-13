import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(14);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('ڕێگەپێدان بە GPS نەدرا');
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
      } catch {
        setError('نەتوانرا شوێنی تۆ بدۆزرێتەوە');
      }
    })();
  }, []);

  const { latitude, longitude } = location?.coords ?? {
    latitude: 0,
    longitude: 0,
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <style>
        html, body, #map {
          height: 100%; width: 100%; margin: 0; padding: 0;
          background: #eaf1f5;
          font-family: Arial, sans-serif;
        }
        .leaflet-control-attribution {
          font-size: 9px;
          background: rgba(255,255,255,.8);
          border-radius: 8px 0 0 0;
        }
        .driver-pin-wrap {
          background: transparent;
          border: none;
        }
        .driver-pin {
          width: 38px; height: 38px;
          background: #123047;
          border: 3px solid white;
          border-radius: 50% 50% 50% 8px;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(18,48,71,.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .driver-pin-core {
          transform: rotate(45deg);
          color: white;
          font-size: 17px;
          font-weight: bold;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 5px 20px rgba(18,48,71,.18);
        }
        .leaflet-popup-content {
          margin: 12px 16px;
          color: #123047;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], ${zoom});
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
        }).addTo(map);
        const driverIcon = L.divIcon({
          className: 'driver-pin-wrap',
          html: '<div class="driver-pin"><div class="driver-pin-core">D</div></div>',
          iconSize: [42, 50],
          iconAnchor: [21, 46],
          popupAnchor: [0, -42]
        });
        const marker = L.marker([${latitude}, ${longitude}], {
          icon: driverIcon
        }).addTo(map).bindPopup('<b>شوێنی تۆ</b>').openPopup();

        window.setZoom = function(level) {
          map.setZoom(level);
        };
        window.goToMyLocation = function(lat, lon) {
          map.setView([lat, lon], Math.max(map.getZoom(), 16));
          marker.setLatLng([lat, lon]);
          marker.openPopup();
        };
      </script>
    </body>
    </html>
  `;

  const changeZoom = (amount: number) => {
    const next = Math.max(5, Math.min(19, zoom + amount));
    setZoom(next);
    webViewRef.current?.injectJavaScript(`window.setZoom(${next}); true;`);
  };

  const goToLocation = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = current.coords;
      setLocation(current);
      webViewRef.current?.injectJavaScript(
        `window.goToMyLocation(${latitude}, ${longitude}); true;`
      );
    } catch {
      Alert.alert('GPS', 'نەتوانرا شوێنی نوێی تۆ بدۆزرێتەوە.');
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>شوێنی تۆ دەدۆزرێتەوە...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
      />
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>D</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>DriverLink</Text>
          <Text style={styles.headerSubtitle}>نەخشە و GPS</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => changeZoom(1)}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => changeZoom(-1)}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Pressable style={styles.locationButton} onPress={goToLocation}>
          <Text style={styles.locationText}>◎ شوێنی من</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loading: { marginTop: 12, fontSize: 16 },
  error: { fontSize: 17, textAlign: 'center' },
  header: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 96,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 15,
    gap: 8,
    elevation: 6,
    shadowColor: '#123047',
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#123047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#123047',
    fontSize: 24,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#123047',
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    position: 'absolute',
    right: 28,
    top: 180,
    alignItems: 'center',
    gap: 9,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123047',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: '#123047', fontSize: 24, fontWeight: '600' },
  locationButton: {
    backgroundColor: '#123047',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#123047',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  locationText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});
