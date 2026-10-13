import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

const API_URL = 'http://127.0.0.1:5000';

type Trip = {
  id: number;
  customer_id?: number | null;
  driver_id?: number | null;
  pickup: string;
  destination: string;
  fare: number;
  status: string;
  created_at?: string;
  customer_name?: string;
  driver_name?: string;
};

type Customer = {
  id: number;
  name: string;
};

type Driver = {
  id: number;
  name: string;
};

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('');
  const [status, setStatus] = useState('pending');

  const getToken = async () => {
    return await AsyncStorage.getItem('driverlink_token');
  };

  const loadTrips = async () => {
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/trips`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load trips');
      }

      setTrips(data);
    } catch (error) {
      console.log('TRIPS LOAD ERROR:', error);
      Alert.alert('هەڵە', 'گەشتەکان نەهاتنەوە ❌');
    }
  };

  const loadCustomers = async () => {
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCustomers(data);
      }
    } catch (error) {
      console.log('CUSTOMERS LOAD ERROR:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDrivers(data);
      }
    } catch (error) {
      console.log('DRIVERS LOAD ERROR:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadTrips();
      void loadCustomers();
      void loadDrivers();
    }, [])
  );

  const refreshTrips = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTrips(),
        loadCustomers(),
        loadDrivers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const saveTripStatus = async (trip: Trip, newStatus: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/trips/${trip.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'گۆڕینی دۆخ سەرکەوتوو نەبوو');
      }

      await loadTrips();
      Alert.alert('سەرکەوتوو', 'دۆخی گەشت گۆڕدرا.');
    } catch (error) {
      console.log('UPDATE TRIP STATUS ERROR:', error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('هەڵە', message);
    }
  };

  const chooseTripStatus = (trip: Trip) => {
    Alert.alert('گۆڕینی دۆخی گەشت', 'دۆخی نوێ هەڵبژێرە:', [
      { text: 'چاوەڕوانە', onPress: () => saveTripStatus(trip, 'pending') },
      { text: 'لە ڕێگادایە', onPress: () => saveTripStatus(trip, 'on_route') },
      { text: 'تەواوبوو', onPress: () => saveTripStatus(trip, 'completed') },
      { text: 'هەڵوەشایەوە', onPress: () => saveTripStatus(trip, 'cancelled') },
      { text: 'پاشگەزبوونەوە', style: 'cancel' },
    ]);
  };

  const deleteTrip = (trip: Trip) => {
    Alert.alert(
      'سڕینەوەی گەشت',
      `دڵنیایت دەتەوێت گەشت #${trip.id} بسڕیتەوە؟`,
      [
        {
          text: 'پاشگەزبوونەوە',
          style: 'cancel',
        },
        {
          text: 'بسڕەوە',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(
                `${API_URL}/api/trips/${trip.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'سڕینەوە سەرکەوتوو نەبوو');
              }

              await loadTrips();
              Alert.alert('سەرکەوتوو بوو', 'گەشتەکە سڕایەوە.');
            } catch (error) {
              console.log('DELETE TRIP ERROR:', error);
              const message =
                error instanceof Error ? error.message : String(error);
              Alert.alert(
                'هەڵەی سڕینەوە',
                `هۆکاری هەڵە: ${message}`
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setCustomerId(null);
    setDriverId(null);
    setPickup('');
    setDestination('');
    setFare('');
    setStatus('pending');
  };

  const addTrip = async () => {
    if (!pickup.trim() || !destination.trim() || !fare.trim()) {
      Alert.alert(
        'تێبینی',
        'شوێنی دەستپێک، مەبەست و نرخ پڕبکەرەوە.'
      );
      return;
    }

    const fareNumber = Number(fare);

    if (!Number.isFinite(fareNumber) || fareNumber < 0) {
      Alert.alert('هەڵە', 'نرخی گەشت دروست نییە.');
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();

      const response = await fetch(`${API_URL}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          driver_id: driverId,
          pickup: pickup.trim(),
          destination: destination.trim(),
          fare: fareNumber,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add trip');
      }

      setModalVisible(false);
      resetForm();

      await loadTrips();

      Alert.alert('سەرکەوتوو', 'گەشت بە سەرکەوتوویی زیاد کرا ✅');
    } catch (error: any) {
      console.log('ADD TRIP ERROR:', error);
      Alert.alert('هەڵە', error.message || 'گەشت زیاد نەکرا ❌');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const text = `${trip.pickup} ${trip.destination} ${trip.customer_name || ''} ${trip.driver_name || ''}`
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const totalFare = trips.reduce(
    (sum, trip) => sum + Number(trip.fare || 0),
    0
  );

  const completed = trips.filter(
    (trip) => trip.status === 'completed'
  ).length;

  const pending = trips.filter(
    (trip) => trip.status === 'pending'
  ).length;

  const statusLabel = (value: string) => {
    switch (value) {
      case 'completed':
        return 'تەواوبوو';
      case 'cancelled':
        return 'هەڵوەشایەوە';
      case 'on_route':
        return 'لە ڕێگادایە';
      default:
        return 'چاوەڕوانە';
    }
  };

  const statusButton = (value: string) => {
    setStatus(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>گەشتەکان 🚕</Text>
          <Text style={styles.subtitle}>
            بەڕێوەبردنی هەموو گەشتەکان
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ زیادکردن</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>هەموو گەشت</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completed}</Text>
          <Text style={styles.statLabel}>تەواوبوو</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pending}</Text>
          <Text style={styles.statLabel}>چاوەڕوان</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ${totalFare.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>کۆی نرخ</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="گەڕان بە شوێن، کڕیار یان شۆفێر..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTrips}
            tintColor="#1264F4"
            colors={["#1264F4"]}
          />
        }
      >
        {filteredTrips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚕</Text>
            <Text style={styles.emptyTitle}>
              هیچ گەشتێک نییە
            </Text>
            <Text style={styles.emptyText}>
              لەسەر «+ زیادکردن» کلیک بکە بۆ زیادکردنی یەکەم گەشت.
            </Text>
          </View>
        ) : (
          filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripTop}>
                <Text style={styles.tripId}>
                  گەشت #{trip.id}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {statusLabel(trip.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.routeBox}>
                <Text style={styles.routeText}>
                  📍 {trip.pickup}
                </Text>
                <Text style={styles.arrow}>↓</Text>
                <Text style={styles.routeText}>
                  🏁 {trip.destination}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  👤 {trip.customer_name || 'بێ کڕیار'}
                </Text>

                <Text style={styles.infoText}>
                  🚗 {trip.driver_name || 'بێ شۆفێر'}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.fare}>
                  ${Number(trip.fare || 0).toFixed(2)}
                </Text>

                <Text style={styles.date}>
                  {trip.created_at
                    ? new Date(trip.created_at).toLocaleDateString()
                    : ''}
                </Text>
              </View>

              <Pressable
                style={{
                  backgroundColor: '#DBEAFE',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 12,
                }}
                onPress={() => chooseTripStatus(trip)}
              >
                <Text style={{ color: '#1D4ED8', fontWeight: 'bold' }}>
                  🔄 گۆڕینی دۆخی گەشت
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: '#FEE2E2',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 12,
                }}
                onPress={() => deleteTrip(trip)}
              >
                <Text style={{ color: '#B91C1C', fontWeight: 'bold' }}>
                  🗑 سڕینەوەی گەشت
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                ➕ زیادکردنی گەشت
              </Text>

              <Text style={styles.label}>کڕیار</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontal}
              >
                <Pressable
                  style={[
                    styles.selectButton,
                    customerId === null && styles.selected,
                  ]}
                  onPress={() => setCustomerId(null)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      customerId === null && styles.selectedText,
                    ]}
                  >
                    بێ کڕیار
                  </Text>
                </Pressable>

                {customers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    style={[
                      styles.selectButton,
                      customerId === customer.id && styles.selected,
                    ]}
                    onPress={() => setCustomerId(customer.id)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        customerId === customer.id &&
                          styles.selectedText,
                      ]}
                    >
                      {customer.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>شۆفێر</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontal}
              >
                <Pressable
                  style={[
                    styles.selectButton,
                    driverId === null && styles.selected,
                  ]}
                  onPress={() => setDriverId(null)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      driverId === null && styles.selectedText,
                    ]}
                  >
                    بێ شۆفێر
                  </Text>
                </Pressable>

                {drivers.map((driver) => (
                  <Pressable
                    key={driver.id}
                    style={[
                      styles.selectButton,
                      driverId === driver.id && styles.selected,
                    ]}
                    onPress={() => setDriverId(driver.id)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        driverId === driver.id &&
                          styles.selectedText,
                      ]}
                    >
                      {driver.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>شوێنی دەستپێک *</Text>

              <TextInput
                style={styles.input}
                placeholder="نموونە: ئەکرێ"
                value={pickup}
                onChangeText={setPickup}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>مەبەست *</Text>

              <TextInput
                style={styles.input}
                placeholder="نموونە: هەولێر"
                value={destination}
                onChangeText={setDestination}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>نرخی گەشت *</Text>

              <TextInput
                style={styles.input}
                placeholder="نموونە: 100"
                value={fare}
                onChangeText={setFare}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>دۆخی گەشت</Text>

              <View style={styles.statusOptions}>
                {[
                  ['pending', 'چاوەڕوانە'],
                  ['on_route', 'لە ڕێگادایە'],
                  ['completed', 'تەواوبوو'],
                  ['cancelled', 'هەڵوەشایەوە'],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[
                      styles.statusOption,
                      status === value && styles.selected,
                    ]}
                    onPress={() => statusButton(value)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === value && styles.selectedText,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  loading && styles.disabledButton,
                ]}
                onPress={addTrip}
                disabled={loading}
              >
                <Text style={styles.saveText}>
                  {loading ? 'چاوەڕوان بە...' : '💾 پاشەکەوتکردنی گەشت'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>داخستن</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eef1f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#222',
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
  },

  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 11,
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 12,
    gap: 7,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  statLabel: {
    fontSize: 10,
    color: '#777',
    marginTop: 3,
  },

  search: {
    margin: 14,
    marginBottom: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e3e6eb',
  },

  list: {
    padding: 14,
    paddingTop: 8,
    paddingBottom: 40,
  },

  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ebef',
  },

  tripTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tripId: {
    fontWeight: '800',

    fontSize: 15,
    color: '#111827',
  },

  statusBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  routeBox: {
    marginTop: 13,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },

  routeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },

  arrow: {
    color: '#9ca3af',
    fontSize: 18,
    marginVertical: 2,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  infoText: {
    fontSize: 12,
    color: '#555',
    maxWidth: '48%',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  fare: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  date: {
    fontSize: 11,
    color: '#888',
  },

  empty: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '92%',
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dfe3e8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },

  horizontal: {
    marginBottom: 5,
  },

  selectButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 7,
  },

  selected: {
    backgroundColor: '#111827',
  },

  selectText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },

  selectedText: {
    color: '#fff',
  },

  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  statusOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  statusOptionText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },

  cancelButton: {
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },

  cancelText: {
    color: '#666',
    fontWeight: '700',
  },
});
