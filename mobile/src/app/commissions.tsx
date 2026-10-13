import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

const API_URL = 'http://127.0.0.1:5000';

type Commission = {
  id: number;
  trip_id: number;
  driver_id?: number | null;
  driver_name?: string;
  fare: number;
  commission_rate: number;
  commission_amount: number;
  driver_amount: number;
  status: string;
  created_at?: string;
};

export default function CommissionsScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommissions = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('driverlink_token');

      if (!token) {
        Alert.alert('هەڵە', 'تکایە دووبارە بچۆ ژوورەوە.');
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_URL}/api/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load commissions');
      }

      setCommissions(data);
    } catch (error) {
      console.log('COMMISSIONS LOAD ERROR:', error);
      Alert.alert('هەڵە', 'کۆمیشنەکان نەهاتنەوە ❌');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadCommissions();
    }, [])
  );

  const addCommission = async () => {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');
      if (!token) {
        Alert.alert('هەڵە', 'تکایە دووبارە بچۆ ژوورەوە.');
        return;
      }

      const [tripsResponse, commissionsResponse] = await Promise.all([
        fetch(`${API_URL}/api/trips`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/commissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const trips = await tripsResponse.json();
      const existing = await commissionsResponse.json();

      if (!tripsResponse.ok || !commissionsResponse.ok ||
          !Array.isArray(trips) || !Array.isArray(existing)) {
        throw new Error('نەتوانرا زانیارییەکان بهێنرێنەوە');
      }

      const existingIds = new Set(
        existing.map((c: Commission) => Number(c.trip_id))
      );

      const trip = trips.find((t: any) =>
        String(t.status).toLowerCase() === 'completed' &&
        !existingIds.has(Number(t.id))
      );

      if (!trip) {
        Alert.alert(
          'تێبینی',
          'هەموو گەشتە تەواوبووەکان کۆمیشنیان هەیە، یان گەشتی تەواوبوو نییە.'
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/commissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: trip.id,
          driver_id: trip.driver_id ?? null,
          fare: Number(trip.fare),
          commission_rate: 10,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'زیادکردنی کۆمیشن سەرکەوتوو نەبوو');
      }

      Alert.alert('سەرکەوتوو', 'کۆمیشن زیاد کرا.');
      await loadCommissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('ADD COMMISSION ERROR:', message);
      Alert.alert('هەڵەی کۆمیشن', message);
    }
  };

  const updateCommissionStatus = (item: Commission) => {
    if (item.status !== 'pending') return;

    Alert.alert(
      'دڵنیابوونەوە',
      `دڵنیایت پارەی کۆمیشنی گەشت #${item.trip_id} وەرگیراوە؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ، پارەکە وەرگیراوە',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('driverlink_token');
              if (!token) {
                Alert.alert('هەڵە', 'تکایە دووبارە بچۆ ژوورەوە.');
                return;
              }

              const response = await fetch(
                `${API_URL}/api/commissions/${item.id}/status`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status: 'paid' }),
                }
              );

              const result = await response.json();
              if (!response.ok) {
                throw new Error(result.error || 'گۆڕینی دۆخ سەرکەوتوو نەبوو');
              }

              await loadCommissions();
              Alert.alert('سەرکەوتوو', 'دۆخی کۆمیشن نوێ کرایەوە.');
            } catch (error) {
              console.log('UPDATE COMMISSION STATUS ERROR:', error);
              Alert.alert(
                'هەڵە',
                error instanceof Error ? error.message : String(error)
              );
            }
          },
        },
      ]
    );
  };

  const refreshCommissions = async () => {
    setRefreshing(true);
    try {
      await loadCommissions();
    } finally {
      setRefreshing(false);
    }
  };

  const totalFare = commissions.reduce(
    (sum, item) => sum + Number(item.fare || 0),
    0
  );

  const totalCommission = commissions.reduce(
    (sum, item) => sum + Number(item.commission_amount || 0),
    0
  );

  const totalDriver = commissions.reduce(
    (sum, item) => sum + Number(item.driver_amount || 0),
    0
  );

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
          <Text style={styles.title}>کۆمیشن و داهات 💰</Text>
          <Text style={styles.subtitle}>
            بەڕێوەبردنی پارە و کۆمیشنەکان
          </Text>
        </View>


        <Pressable
          style={styles.refreshButton}
          onPress={refreshCommissions}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCommissions}
            tintColor="#1264F4"
            colors={["#1264F4"]}
          />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>پوختەی دارایی</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryNumber}>
                ${totalFare.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>کۆی گەشتەکان</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryNumber}>
                ${totalCommission.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>کۆی کۆمیشن</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryNumber}>
                ${totalDriver.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>پارەی شۆفێر</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryNumber}>
                {commissions.length}
              </Text>
              <Text style={styles.summaryLabel}>کۆی مامەڵە</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>کۆمیشنەکان</Text>

        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>چاوەڕوان بە...</Text>
          </View>
        ) : commissions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>
              هیچ کۆمیشنێک نییە
            </Text>
            <Text style={styles.emptyText}>
              کاتێک کۆمیشن زیاد بکرێت لێرە دەردەکەوێت.
            </Text>
          </View>
        ) : (
          commissions.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.tripTitle}>
                  گەشت #{item.trip_id}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {item.status === 'paid'
                      ? 'پارەدراوە'
                      : 'چاوەڕوانە'}
                  </Text>
                </View>
              </View>

              <Text style={styles.driver}>
                🚗 {item.driver_name || 'بێ شۆفێر'}
              </Text>

              <View style={styles.line}>
                <Text style={styles.label}>نرخی گەشت</Text>
                <Text style={styles.value}>
                  ${Number(item.fare || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.line}>
                <Text style={styles.label}>
                  کۆمیشن ({Number(item.commission_rate || 0)}%)
                </Text>
                <Text style={styles.commission}>
                  ${Number(item.commission_amount || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.driverAmount}>
                <Text style={styles.label}>پارەی شۆفێر</Text>
                <Text style={styles.driverValue}>
                  ${Number(item.driver_amount || 0).toFixed(2)}
                </Text>
              </View>

              {item.status === 'pending' ? (
                <Pressable
                  onPress={() => updateCommissionStatus(item)}
                  style={{
                    backgroundColor: '#E8F7EE',
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 12,
                  }}
                >
                  <Text style={{ color: '#18794E', fontWeight: 'bold' }}>
                    پارەکە وەرگیراوە ✓
                  </Text>
                </Pressable>
              ) : null}

              {item.created_at ? (
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#fff',
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
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshText: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '800',
  },

  content: {
    padding: 14,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
  },

  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  summaryBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 13,
    padding: 13,
  },

  summaryNumber: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111827',
    marginTop: 22,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7e9ee',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tripTitle: {
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '800',
    color: '#374151',
  },

  driver: {
    marginTop: 12,
    fontSize: 13,
    color: '#555',
    fontWeight: '700',
  },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },

  label: {
    color: '#666',
    fontSize: 13,
  },

  value: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },

  commission: {
    color: '#b45309',
    fontSize: 15,
    fontWeight: '900',
  },

  driverAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  driverValue: {
    color: '#15803d',
    fontSize: 17,
    fontWeight: '900',
  },

  date: {
    marginTop: 10,
    color: '#999',
    fontSize: 11,
  },

  empty: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
    color: '#111827',
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },
});
