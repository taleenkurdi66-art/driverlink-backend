import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Plan = {
  id: number;
  name: string;
  user_type: string;
  price_usd: number;
  duration_days: number;
};

type Subscription = {
  id: number;
  plan_id: number;
  status: string;
  expires_at: string;
  plan_name?: string;
};

const API_URL = 'http://127.0.0.1:5000';

export default function SubscriptionsScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      if (!token) {
        Alert.alert('هەڵە', 'تکایە سەرەتا بچۆ ژوورەوە.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/subscription-plans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'نەتوانرا پلانەکان بهێنرێن.'
        );
      }

      setPlans(
        Array.isArray(data)
          ? data
          : data.plans || []
      );

      const myResponse = await fetch(
        `${API_URL}/api/my-subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const myData = await myResponse.json();

      if (myResponse.ok) {
        setSubscription(
          myData.subscription || null
        );
      }
    } catch (error) {
      console.error(error);

      Alert.alert(
        'هەڵە',
        error instanceof Error
          ? error.message
          : 'هەڵەیەک ڕوویدا.'
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const subscribe = async (plan: Plan) => {
    try {
      if (subscription?.plan_id === plan.id) {
        Alert.alert(
          'اشتراکات',
          'ئەمە پلانی ئێستای تۆیە.'
        );
        return;
      }

      const token = await AsyncStorage.getItem(
        'driverlink_token'
      );

      if (!token) {
        Alert.alert(
          'هەڵە',
          'تکایە سەرەتا بچۆ ژوورەوە.'
        );
        return;
      }

      setLoadingPlan(plan.id);

      const response = await fetch(
        `${API_URL}/api/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: plan.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'نەتوانرا اشتراکەکە چالاک بکرێت.'
        );
      }

      Alert.alert(
        'سەرکەوتوو بوو ✅',
        `پلانی ${planName(plan.name)} چالاک کرا.`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      Alert.alert(
        'هەڵە',
        error instanceof Error
          ? error.message
          : 'هەڵەیەک ڕوویدا.'
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const money = (value: number) =>
    `$${Number(value || 0).toFixed(2)}`;

  const planName = (name: string) => {
    const value = name.toLowerCase();

    if (value === 'free') return 'خۆڕایی';
    if (value === 'professional') return 'پیشەیی';
    if (value === 'company') return 'کۆمپانیا';

    return name;
  };

  const typeName = (type: string) => {
    const value = type.toLowerCase();

    if (value === 'driver') return 'شۆفێر';
    if (value === 'owner') return 'خاوەن';
    if (value === 'company') return 'کۆمپانیا';

    return type;
  };

  const statusName = (status?: string) => {
    const value = (status || 'unknown').toLowerCase();

    if (value === 'active') return 'چالاک';
    if (value === 'expired') return 'بەسەرچوو';
    if (value === 'cancelled') return 'هەڵوەشێنراوە';
    if (value === 'pending') return 'چاوەڕوان';

    return status || 'نەناسراو';
  };

  const renderPlan = ({
    item,
  }: {
    item: Plan;
  }) => {
    const current =
      subscription?.plan_id === item.id;

    const loading =
      loadingPlan === item.id;

    return (
      <View
        style={[
          styles.card,
          current && styles.currentCard,
        ]}
      >
        {current && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              پلانی ئێستا
            </Text>
          </View>
        )}

        <Text style={styles.planName}>
          {planName(item.name)}
        </Text>

        <Text style={styles.type}>
          جۆر: {typeName(item.user_type)}
        </Text>

        <Text style={styles.price}>
          {money(item.price_usd)}
        </Text>

        <Text style={styles.days}>
          بۆ {item.duration_days} ڕۆژ
        </Text>

        <Pressable
          disabled={loading || current}
          style={[
            styles.button,
            current && styles.currentButton,
            loading && styles.disabledButton,
          ]}
          onPress={() => subscribe(item)}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'چاوەڕوان بە...'
              : current
              ? 'پلانەکەتە'
              : 'هەڵبژاردن'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderPlan}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>
              اشتراکات
            </Text>

            <Text style={styles.subtitle}>
              پلانی گونجاو بۆ DriverLink هەڵبژێرە
            </Text>

            {subscription && (
              <View style={styles.activeCard}>
                <Text style={styles.activeTitle}>
                  اشتراکی ئێستا
                </Text>

                <Text style={styles.activePlan}>
                  {planName(
                    subscription.plan_name ||
                      'نەناسراو'
                  )}
                </Text>

                <Text style={styles.activeStatus}>
                  دۆخ:{' '}
                  {statusName(
                    subscription.status
                  )}
                </Text>

                <Text style={styles.activeDate}>
                  بەرواری کۆتایی:{' '}
                  {new Date(
                    subscription.expires_at
                  ).toLocaleDateString()}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              پلانەکان
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              هیچ پلانی اشتراکات بەردەست نییە.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 18,
  },

  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  activeTitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 6,
  },

  activePlan: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 8,
  },

  activeStatus: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 5,
  },

  activeDate: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  currentCard: {
    borderWidth: 2,
    borderColor: '#16a34a',
  },

  badge: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },

  badgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '800',
  },

  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 7,
  },

  type: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 14,
  },

  price: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
  },

  days: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 3,
    marginBottom: 16,
  },

  button: {
    backgroundColor: '#111827',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },

  currentButton: {
    backgroundColor: '#16a34a',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  empty: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
  },

  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
  },
});
