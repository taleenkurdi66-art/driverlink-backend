import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
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

type Payment = {
  id: number;
  amount_usd?: number | string | null;
  amount_iqd?: number | string | null;
  currency?: string;
  payment_method?: string;
  status?: string;
  description?: string | null;
  created_at?: string;
};

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('driverlink_token');
      if (!token) {
        Alert.alert('هەڵە', 'تکایە دووبارە بچۆ ژوورەوە.');
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'نەتوانرا پارەدانەکان بهێنرێنەوە');
      }
      if (!Array.isArray(result)) {
        throw new Error('وەڵامی سێرڤەر دروست نییە');
      }
      setPayments(result);
    } catch (error) {
      console.log('PAYMENTS LOAD ERROR:', error);
      Alert.alert('هەڵە', 'پارەدانەکان نەهاتنەوە. تکایە پەیوەندی سێرڤەر بپشکنە.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadPayments();
    }, [])
  );

  const money = (value?: number | string | null) =>
    Number(value || 0).toLocaleString();

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ گەڕانەوە</Text>
        </Pressable>
        <Text style={styles.title}>پارەدان</Text>
        <Text style={styles.subtitle}>مێژووی پارەدانە تۆمارکراوەکان</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPayments} />
        }
      >
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>دۆخی پارەدان</Text>
          <Text style={styles.noticeText}>
            پەیوەندی پارەدانی ڕاستەقینەی FIB هێشتا چالاک نەکراوە.
            ئەم پەڕەیە تەنها پارەدانە تۆمارکراوەکان پیشان دەدات.
          </Text>
        </View>

        {loading && payments.length === 0 ? (
          <ActivityIndicator size="large" color="#38BDF8" />
        ) : payments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>هێشتا پارەدانێک نییە</Text>
            <Text style={styles.emptyText}>
              کاتێک پارەدانێک تۆمار بکرێت، لێرە پیشان دەدرێت.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>
                  پارەدان #{payment.id}
                </Text>
                <Text style={styles.status}>
                  {payment.status === 'paid'
                    ? 'پارەدراو'
                    : payment.status === 'pending'
                    ? 'چاوەڕوان'
                    : payment.status || 'نادیار'}
                </Text>
              </View>

              <Text style={styles.amount}>
                {payment.currency === 'IQD'
                  ? `${money(payment.amount_iqd)} دینار`
                  : `$${money(payment.amount_usd)}`}
              </Text>

              <Text style={styles.detail}>
                شێوازی پارەدان: {payment.payment_method || 'نادیار'}
              </Text>
              {!!payment.description && (
                <Text style={styles.detail}>{payment.description}</Text>
              )}
              {!!payment.created_at && (
                <Text style={styles.date}>
                  {new Date(payment.created_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0B1220' },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 18 },
  back: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 10 },
  backText: { color: '#38BDF8', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'right', marginTop: 6 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  notice: { backgroundColor: '#172554', borderRadius: 14, padding: 16 },
  noticeTitle: { color: '#BFDBFE', fontSize: 17, fontWeight: 'bold', textAlign: 'right' },
  noticeText: { color: '#DBEAFE', fontSize: 14, lineHeight: 23, textAlign: 'right', marginTop: 8 },
  empty: { backgroundColor: '#111C2E', borderRadius: 16, padding: 28, alignItems: 'center' },
  emptyIcon: { fontSize: 38, marginBottom: 12 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: '#111C2E', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#243247' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  status: { color: '#86EFAC', fontSize: 13 },
  amount: { color: '#38BDF8', fontSize: 25, fontWeight: 'bold', textAlign: 'right', marginVertical: 12 },
  detail: { color: '#CBD5E1', fontSize: 14, textAlign: 'right', marginTop: 5 },
  date: { color: '#64748B', fontSize: 12, textAlign: 'right', marginTop: 10 },
});
