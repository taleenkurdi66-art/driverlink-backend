import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Driver = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  status?: string;
};

const API_URL = 'http://127.0.0.1:5000';

export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  async function loadDrivers() {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      const response = await fetch(`${API_URL}/api/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load drivers');
      }

      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.log('Load drivers error:', error);
      Alert.alert('هەڵە', 'نەتوانرا شۆفێرەکان بهێنرێن');
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadDrivers();
    }, [])
  );

  async function refreshDrivers() {
    setRefreshing(true);
    try {
      await loadDrivers();
    } finally {
      setRefreshing(false);
    }
  }

  function openDriver(driver: Driver) {
    setSelectedDriver(driver);
    setName(driver.name || '');
    setEmail(driver.email || '');
    setPhone(driver.phone || '');
    setLocation(driver.location || '');
    setVehicleType(driver.vehicle_type || '');
    setVehicleNumber(driver.vehicle_number || '');
    setEditing(false);
  }

  function closeDriver() {
    setSelectedDriver(null);
    setEditing(false);
    setAdding(false);
  }

  function openAddDriver() {
    setSelectedDriver(null);
    setAdding(true);
    setEditing(true);
    setName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setVehicleType('');
    setVehicleNumber('');
  }

  async function createDriver() {
    if (!name.trim() || !email.trim()) {
      Alert.alert('تێبینی', 'تکایە ناو و ئیمەیل پڕبکەرەوە');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      const response = await fetch(`${API_URL}/api/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          location,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
        }),
      });

      if (!response.ok) {
        Alert.alert('هەڵە', 'زیادکردنی شۆفێر سەرکەوتوو نەبوو');
        return;
      }

      Alert.alert('سەرکەوتوو ✅', 'شۆفێرەکە بە سەرکەوتوویی زیاد کرا');

      await loadDrivers();

      setName('');
      setEmail('');
      setPhone('');
      setLocation('');
      setVehicleType('');
      setVehicleNumber('');
      setAdding(false);
      setEditing(false);
    } catch (error) {
      Alert.alert('هەڵە', 'پەیوەندی بە سێرڤەرەوە نەکرا');
    }
  }

  async function saveDriver() {
    if (!selectedDriver) return;

    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      const response = await fetch(
        `${API_URL}/api/drivers/${selectedDriver.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            location,
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber,
          }),
        }
      );

      if (!response.ok) {
        Alert.alert('هەڵە', 'پاشەکەوتکردن سەرکەوتوو نەبوو');
        return;
      }

      Alert.alert('سەرکەوتوو', 'زانیارییەکان پاشەکەوت کران');

      await loadDrivers();
      setSelectedDriver(null);
      setEditing(false);
    } catch (error) {
      Alert.alert('هەڵە', 'پەیوەندی بە سێرڤەرەوە نەکرا');
    }
  }

  async function deleteDriver(id: number) {
    Alert.alert(
      'سڕینەوەی شۆفێر',
      'دڵنیایت دەتەوێت ئەم شۆفێرە بسڕیتەوە؟',
      [
        {
          text: 'نەخێر',
          style: 'cancel',
        },
        {
          text: 'بەڵێ، بسڕەوە',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('driverlink_token');

              const response = await fetch(
                `${API_URL}/api/drivers/${id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                await loadDrivers();

                if (selectedDriver?.id === id) {
                  closeDriver();
                }
              } else {
                Alert.alert('هەڵە', 'سڕینەوە سەرکەوتوو نەبوو');
              }
            } catch {
              Alert.alert('هەڵە', 'پەیوەندی بە سێرڤەرەوە نەکرا');
            }
          },
        },
      ]
    );
  }

  if (adding) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.smallTitle}>DriverLink</Text>
            <Text style={styles.pageTitle}>زیادکردنی شۆفێر</Text>
            <Text style={styles.subtitle}>
              زانیاری شۆفێری نوێ داخڵ بکە
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>👤</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>زانیاری کەسی</Text>

          <Text style={styles.label}>ناوی شۆفێر *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ناوی شۆفێر"
          />

          <Text style={styles.label}>ئیمەیل *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ئیمەیل"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>ژمارەی تەلەفۆن</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="ژمارەی تەلەفۆن"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>شوێن</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="شوێن"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>زانیاری ئۆتۆمبێل</Text>

          <Text style={styles.label}>جۆری ئۆتۆمبێل</Text>
          <TextInput
            style={styles.input}
            value={vehicleType}
            onChangeText={setVehicleType}
            placeholder="وەک: Truck / تریلی / ڤان"
          />

          <Text style={styles.label}>ژمارەی ئۆتۆمبێل</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="ژمارەی ئۆتۆمبێل"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={createDriver}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            ➕ زیادکردنی شۆفێر
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={closeDriver}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            ← گەڕانەوە بۆ شۆفێرەکان
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (selectedDriver) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.smallTitle}>DriverLink</Text>
            <Text style={styles.pageTitle}>زانیاری شۆفێر</Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🚛</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>👤</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {selectedDriver.name}
            </Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {selectedDriver.status === 'online'
                  ? 'بەردەستە'
                  : 'ئۆفلاین'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>زانیاری کەسی</Text>

          <Text style={styles.label}>ناوی شۆفێر</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={name}
            onChangeText={setName}
            placeholder="ناوی شۆفێر"
            editable={editing}
          />

          <Text style={styles.label}>ئیمەیل</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={email}
            onChangeText={setEmail}
            placeholder="ئیمەیل"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={editing}
          />

          <Text style={styles.label}>ژمارەی تەلەفۆن</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={phone}
            onChangeText={setPhone}
            placeholder="ژمارەی تەلەفۆن"
            keyboardType="phone-pad"
            editable={editing}
          />

          <Text style={styles.label}>شوێن</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={location}
            onChangeText={setLocation}
            placeholder="شوێن"
            editable={editing}
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>زانیاری ئۆتۆمبێل</Text>

          <Text style={styles.label}>جۆری ئۆتۆمبێل</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={vehicleType}
            onChangeText={setVehicleType}
            placeholder="جۆری ئۆتۆمبێل"
            editable={editing}
          />

          <Text style={styles.label}>ژمارەی ئۆتۆمبێل</Text>
          <TextInput
            style={[styles.input, !editing && styles.disabledInput]}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="ژمارەی ئۆتۆمبێل"
            editable={editing}
          />
        </View>

        {!editing ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setEditing(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>✏️  دەستکاری زانیاری</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={saveDriver}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>✓  پاشەکەوتکردن</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={closeDriver}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>←  گەڕانەوە بۆ شۆفێرەکان</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const onlineDrivers = drivers.filter(
    (driver) => driver.status === 'online'
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshDrivers}
          tintColor="#1264F4"
          colors={["#1264F4"]}
        />
      }
    >
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.smallTitle}>DriverLink</Text>
          <Text style={styles.pageTitle}>شۆفێرەکان</Text>
          <Text style={styles.subtitle}>
            بەڕێوەبردنی شۆفێرەکان و زانیارییەکانیان
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🚛</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>کۆی شۆفێرەکان</Text>
          <Text style={styles.heroNumber}>{drivers.length}</Text>
          <Text style={styles.heroSubtext}>
            {onlineDrivers} شۆفێر ئێستا بەردەستن
          </Text>
        </View>

        <Text style={styles.heroTruck}>🚚</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statNumber}>{drivers.length}</Text>
          <Text style={styles.statLabel}>هەموو شۆفێرەکان</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🟢</Text>
          <Text style={styles.statNumber}>{onlineDrivers}</Text>
          <Text style={styles.statLabel}>بەردەست</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={openAddDriver}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>
          ➕ زیادکردنی شۆفێری نوێ
        </Text>
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.listTitle}>لیستی شۆفێرەکان</Text>
          <Text style={styles.listSubtitle}>
            بۆ بینینی وردەکاری کلیک بکە
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{drivers.length}</Text>
        </View>
      </View>

      {drivers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>هیچ شۆفێرێک نییە</Text>
          <Text style={styles.emptyText}>
            کاتێک شۆفێر زیاد بکرێت لێرە پیشان دەدرێت
          </Text>
        </View>
      ) : (
        drivers.map((driver) => (
          <View key={driver.id} style={styles.driverCard}>
            <TouchableOpacity
              style={styles.driverMain}
              onPress={() => openDriver(driver)}
              activeOpacity={0.75}
            >
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>👤</Text>
              </View>

              <View style={styles.driverDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {driver.name}
                  </Text>

                  <View
                    style={[
                      styles.miniStatus,
                      driver.status === 'online'
                        ? styles.onlineStatus
                        : styles.offlineStatus,
                    ]}
                  >
                    <View
                      style={[
                        styles.miniDot,
                        driver.status === 'online'
                          ? styles.onlineDot
                          : styles.offlineDot,
                      ]}
                    />
                    <Text
                      style={[
                        styles.miniStatusText,
                        driver.status === 'online'
                          ? styles.onlineText
                          : styles.offlineText,
                      ]}
                    >
                      {driver.status === 'online'
                        ? 'بەردەست'
                        : 'ئۆفلاین'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.email} numberOfLines={1}>
                  {driver.email}
                </Text>

                {driver.phone ? (
                  <Text style={styles.metaText} numberOfLines={1}>
                    📞 {driver.phone}
                  </Text>
                ) : null}

                {driver.vehicle_type || driver.vehicle_number ? (
                  <Text style={styles.metaText} numberOfLines={1}>
                    🚛 {driver.vehicle_type || 'ئۆتۆمبێل'}
                    {driver.vehicle_number
                      ? ` • ${driver.vehicle_number}`
                      : ''}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => openDriver(driver)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewButtonText}>بینین</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteDriver(driver.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteText}>سڕینەوە</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          DriverLink • Driver Management
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  content: {
    padding: 18,
    paddingBottom: 35,
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  smallTitle: {
    color: '#1264F4',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },

  pageTitle: {
    color: '#14213D',
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#718096',
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#E8F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerIconText: {
    fontSize: 27,
  },

  heroCard: {
    backgroundColor: '#1264F4',
    borderRadius: 22,
    padding: 22,
    minHeight: 145,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#1264F4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 7,
  },

  heroText: {
    flex: 1,
  },

  heroTitle: {
    color: '#DCE9FF',
    fontSize: 14,
    fontWeight: '700',
  },

  heroNumber: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 2,
  },

  heroSubtext: {
    color: '#EAF1FF',
    fontSize: 13,
    marginTop: 2,
  },

  heroTruck: {
    fontSize: 58,
    marginLeft: 10,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6EBF2',
    elevation: 2,
  },

  statIcon: {
    fontSize: 23,
  },

  statNumber: {
    color: '#14213D',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },

  statLabel: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  listTitle: {
    color: '#14213D',
    fontSize: 21,
    fontWeight: '900',
  },

  listSubtitle: {
    color: '#8A94A6',
    fontSize: 12,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#E8F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  countBadgeText: {
    color: '#1264F4',
    fontWeight: '900',
    fontSize: 16,
  },

  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EBF2',
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  driverMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  driverAvatarSmall: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#EAF1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  driverAvatarText: {
    fontSize: 27,
  },

  driverDetails: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  name: {
    flex: 1,
    color: '#172033',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 8,
  },

  email: {
    color: '#6B778C',
    fontSize: 12,
    marginTop: 4,
  },

  metaText: {
    color: '#7C8798',
    fontSize: 12,
    marginTop: 4,
  },

  miniStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  onlineStatus: {
    backgroundColor: '#E8F8EF',
  },

  offlineStatus: {
    backgroundColor: '#F1F3F5',
  },

  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  onlineDot: {
    backgroundColor: '#20A464',
  },

  offlineDot: {
    backgroundColor: '#98A2B3',
  },

  miniStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  onlineText: {
    color: '#16834E',
  },

  offlineText: {
    color: '#667085',
  },

  arrow: {
    color: '#A0A9B8',
    fontSize: 30,
    marginLeft: 5,
  },

  cardActions: {
    flexDirection: 'row',
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    gap: 9,
  },

  viewButton: {
    flex: 1,
    backgroundColor: '#EAF1FF',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  viewButtonText: {
    color: '#1264F4',
    fontSize: 13,
    fontWeight: '900',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#FFF0F0',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  deleteText: {
    color: '#D92D20',
    fontSize: 13,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EBF2',
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    color: '#172033',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 10,
  },

  emptyText: {
    color: '#7C8798',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EBF2',
  },

  profileCard: {
    backgroundColor: '#1264F4',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  bigAvatarText: {
    fontSize: 36,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 9,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#B9FFD8',
    marginRight: 6,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  sectionTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 15,
  },

  label: {
    color: '#526074',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DDE3EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 13,
    fontSize: 15,
    color: '#172033',
  },

  disabledInput: {
    backgroundColor: '#F1F4F8',
    color: '#4B5565',
  },

  primaryButton: {
    backgroundColor: '#1264F4',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 3,
    elevation: 3,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3EC',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  secondaryButtonText: {
    color: '#526074',
    fontSize: 14,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },

  footerText: {
    color: '#A0A9B8',
    fontSize: 11,
  },
});
