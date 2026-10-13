import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '../i18n/LanguageContext';

type DashboardData = {
  drivers: number | string;
  active_drivers: number | string;
  customers: number | string;
  trips: number | string;
  commission: number | string;
};

const API_URL = 'http://127.0.0.1:5000';
const initialData: DashboardData = {
  drivers: 0, active_drivers: 0, customers: 0, trips: 0, commission: 0,
};

export default function DashboardScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const token = await AsyncStorage.getItem('driverlink_token');
      if (!token) {
        setLoadError('تکایە دووبارە بچۆ ژوورەوە.');
        return;
      }
      const response = await fetch(`${API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        setLoadError('ماوەی چوونەژوورەوەت بەسەرچووە؛ تکایە دووبارە بچۆ ژوورەوە.');
        return;
      }
      if (!response.ok) throw new Error('Dashboard request failed');
      const result = await response.json();
      setData({
        drivers: result.drivers ?? 0,
        active_drivers: result.active_drivers ?? 0,
        customers: result.customers ?? 0,
        trips: result.trips ?? 0,
        commission: result.commission ?? 0,
      });
    } catch {
      setLoadError('پەیوەندی بە سێرڤەرەکە نەکرا. بۆ دووبارە هەوڵدان کرتە بکە.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [])
  );

  const items = [
    { icon: '🚗', title: t.drivers, value: String(data.drivers), sub: `${data.active_drivers} ${t.active}`, route: '/drivers' },
    { icon: '👤', title: t.customers, value: String(data.customers), sub: t.total, route: '/customers' },
    { icon: '🏢', title: t.companies, value: '›', sub: t.companies, route: '/companies' },
    { icon: '🚕', title: t.trips, value: String(data.trips), sub: t.total, route: '/trips' },
    { icon: '💰', title: t.revenue, value: Number(data.commission).toLocaleString(), sub: `IQD · ${t.today}`, route: '/commissions' },
    { icon: '💳', title: t.subscriptions, value: '›', sub: t.subscriptionPlans, route: '/subscriptions' },
    { icon: '💵', title: t.payments, value: '›', sub: t.paymentHistory, route: '/payments' },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadDashboard}
          tintColor="#38BDF8"
          colors={["#38BDF8"]}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.small}>DriverLink</Text>
          <Text style={styles.title}>{t.dashboard}</Text>
          <Text style={styles.subtitle}>{t.welcome}</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>O</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/language')}
        style={{ alignSelf: 'flex-start', marginTop: 14, padding: 10, borderRadius: 10, backgroundColor: '#1E293B' }}
      >
        <Text style={{ color: '#38BDF8', fontWeight: '700' }}>🌐 {t.languageButton}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color="#38BDF8" size="large" style={{ marginTop: 16 }} />}
    {!!loadError && (
      <TouchableOpacity onPress={loadDashboard} style={{ backgroundColor: '#7F1D1D', padding: 12, borderRadius: 12, marginTop: 12 }}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>{loadError}</Text>
      </TouchableOpacity>
    )}

    <View style={styles.status}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>{t.systemActive}</Text>
      </View>

      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => router.push('/map')}
      >
        <Text style={styles.mapIcon}>📍</Text>
        <View>
          <Text style={styles.mapTitle}>{t.mapGps}</Text>
          <Text style={styles.mapSub}>{t.currentLocation}</Text>
        </View>
        <Text style={styles.mapArrow}>‹</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t.mainSections}</Text>

      <View style={styles.menu}>
        {[
          ['🚗', 'بەڕێوەبردنی شۆفێرەکان'],
          ['👥', 'کڕیارەکان'],
          ['🏢', 'کۆمپانیاکان'],
          ['🚕', 'گەشتەکان'],
          ['💰', 'کۆمیشن و پارەدان'],
          ['💵', 'پارەدان'],
          ['💳', 'اشتراکات'],
          ['📊', 'ڕاپۆرتەکان'],
          ['🔔', 'ئاگادارکردنەوەکان'],
          ['⭐', 'هەڵسەنگاندن'],
          ['⚙️', 'ڕێکخستنەکان'],
        ].map(([icon, title]) => (
          <TouchableOpacity
            key={title}
            style={styles.menuItem}
            onPress={() => {
              if (title === 'کڕیارەکان') router.push('/customers');
              if (title === 'بەڕێوەبردنی شۆفێرەکان') router.push('/drivers');
              if (title === 'کۆمیشن و پارەدان') router.push('/commissions');
              if (title === 'پارەدان') router.push('/payments');
              if (title === 'اشتراکات') router.push('/subscriptions');
              if (title === 'کۆمپانیاکان') router.push('/companies');
            }}
          >
            <Text style={styles.menuIcon}>{icon}</Text>
            <Text style={styles.menuText}>{title}</Text>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
  },
  small: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 7,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  avatarText: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '800',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#111C2E',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 9,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 14,
  },

  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111C2E',
    padding: 17,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mapIcon: {
    fontSize: 27,
    marginRight: 14,
  },
  mapTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  mapSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  mapArrow: {
    color: '#64748B',
    fontSize: 25,
    marginLeft: 'auto',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  card: {
    width: '48%',
    backgroundColor: '#111C2E',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  icon: {
    fontSize: 26,
  },
  cardTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 4,
  },
  sub: {
    color: '#38BDF8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 12,
  },
  menu: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111C2E',
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  menuIcon: {
    fontSize: 23,
    width: 42,
  },
  menuText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    color: '#64748B',
    fontSize: 25,
  },
});
