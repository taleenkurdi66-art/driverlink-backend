import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Commission = {
  id: number;
  trip_id: number;
  driver_id?: number | null;
  driver_name?: string | null;
  fare: number;
  commission_rate: number;
  commission_amount: number;
  driver_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | string;
  created_at: string;
};

const API_URL = 'http://127.0.0.1:5000';

export default function CommissionScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const [selected, setSelected] = useState<Commission | null>(null);

  const [tripId, setTripId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [fare, setFare] = useState('');
  const [rate, setRate] = useState('10');

  const loadCommissions = async () => {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      if (!token) {
        Alert.alert('هەڵە', 'تۆ چوویتە دەرەوە. تکایە دووبارە بچۆ ژوورەوە.');
        return;
      }

      const response = await fetch(`${API_URL}/api/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load commissions');
      }

      setCommissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'هەڵە',
        'نەتوانرا زانیارییەکانی Commission وەربگیرێت.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommissions();
  };

  const filteredCommissions = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return commissions;

    return commissions.filter((item) => {
      const text = [
        item.id,
        item.trip_id,
        item.driver_id,
        item.driver_name,
        item.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }, [commissions, search]);

  const totalFare = commissions.reduce(
    (sum, item) => sum + Number(item.fare || 0),
    0
  );

  const totalCommission = commissions.reduce(
    (sum, item) => sum + Number(item.commission_amount || 0),
    0
  );

  const totalDriverAmount = commissions.reduce(
    (sum, item) => sum + Number(item.driver_amount || 0),
    0
  );

  const pendingCount = commissions.filter(
    (item) => item.status === 'pending'
  ).length;

  const paidCount = commissions.filter(
    (item) => item.status === 'paid'
  ).length;

  const resetForm = () => {
    setTripId('');
    setDriverId('');
    setFare('');
    setRate('10');
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const calculatePreview = () => {
    const fareNumber = Number(fare) || 0;
    const rateNumber = Number(rate) || 0;
    const commission = fareNumber * rateNumber / 100;
    const driver = fareNumber - commission;

    return {
      commission,
      driver,
    };
  };

  const saveCommission = async () => {
    if (!tripId.trim()) {
      Alert.alert('ئاگاداری', 'Trip ID بنووسە.');
      return;
    }

    if (!fare.trim()) {
      Alert.alert('ئاگاداری', 'نرخی گەشت بنووسە.');
      return;
    }

    const tripNumber = Number(tripId);
    const fareNumber = Number(fare);
    const rateNumber = Number(rate);

    if (!Number.isInteger(tripNumber) || tripNumber <= 0) {
      Alert.alert('ئاگاداری', 'Trip ID دەبێت ژمارەیەکی دروست بێت.');
      return;
    }

    if (!Number.isFinite(fareNumber) || fareNumber < 0) {
      Alert.alert('ئاگاداری', 'نرخی گەشت دروست نییە.');
      return;
    }

    if (
      !Number.isFinite(rateNumber) ||
      rateNumber < 0 ||
      rateNumber > 100
    ) {
      Alert.alert('ئاگاداری', 'ڕێژەی Commission دەبێت لە 0 تا 100 بێت.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      const response = await fetch(`${API_URL}/api/commissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: tripNumber,
          driver_id: driverId.trim()
            ? Number(driverId)
            : null,
          fare: fareNumber,
          commission_rate: rateNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to add commission');
      }

      setCommissions((prev) => [data, ...prev]);
      setModalVisible(false);
      resetForm();

      Alert.alert('سەرکەوتوو', 'Commission بە سەرکەوتوویی زیاد کرا. ✅');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'هەڵە',
        error instanceof Error

          ? error.message
          : 'نەتوانرا Commission زیاد بکرێت.'
      );
    }
  };

  const updateStatus = async (
    item: Commission,
    status: 'paid' | 'cancelled'
  ) => {
    try {
      const token = await AsyncStorage.getItem('driverlink_token');

      const response = await fetch(
        `${API_URL}/api/commissions/${item.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update status');
      }

      setCommissions((prev) =>
        prev.map((commission) =>
          commission.id === item.id ? data : commission
        )
      );

      setSelected(data);

      Alert.alert(
        'سەرکەوتوو',
        status === 'paid'
          ? 'Commission وەک پارەدراو تۆمار کرا. ✅'
          : 'Commission هەڵوەشێندرایەوە. ✅'
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'هەڵە',
        error instanceof Error
          ? error.message
          : 'نەتوانرا دۆخی Commission بگۆڕدرێت.'
      );
    }
  };

  const deleteCommission = (item: Commission) => {
    Alert.alert(
      'سڕینەوە',
      `دڵنیایت دەتەوێت Commission #${item.id} بسڕیتەوە؟`,
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
              const token =
                await AsyncStorage.getItem('driverlink_token');

              const response = await fetch(
                `${API_URL}/api/commissions/${item.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data?.error || 'Failed to delete commission'
                );
              }

              setCommissions((prev) =>
                prev.filter(
                  (commission) => commission.id !== item.id
                )
              );

              if (selected?.id === item.id) {
                setSelected(null);
                setDetailsVisible(false);
              }

              Alert.alert(
                'سەرکەوتوو',
                'Commission بە سەرکەوتوویی سڕایەوە. ✅'
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                'هەڵە',
                error instanceof Error
                  ? error.message
                  : 'نەتوانرا Commission بسڕدرێتەوە.'
              );
            }
          },
        },
      ]
    );
  };

  const preview = calculatePreview();

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString();
  };

  const statusLabel = (status: string) => {
    if (status === 'paid') return 'پارەدراو';
    if (status === 'cancelled') return 'هەڵوەشاوە';
    return 'چاوەڕوان';
  };

  const statusStyle = (status: string) => {
    if (status === 'paid') return styles.statusPaid;
    if (status === 'cancelled') return styles.statusCancelled;
    return styles.statusPending;
  };

  const renderItem = ({ item }: { item: Commission }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTitle}>Commission #{item.id}</Text>
          <Text style={styles.tripText}>گەشت #{item.trip_id}</Text>
        </View>

        <View style={[styles.statusBadge, statusStyle(item.status)]}>
          <Text style={styles.statusText}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>نرخی گەشت</Text>
        <Text style={styles.infoValue}>
          {formatMoney(item.fare)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ڕێژەی کۆمیشن</Text>
        <Text style={styles.infoValue}>
          {Number(item.commission_rate).toFixed(2)}%
        </Text>
      </View>

      <View style={styles.highlightRow}>
        <Text style={styles.highlightLabel}>کۆمیشن</Text>
        <Text style={styles.highlightValue}>
          {formatMoney(item.commission_amount)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>پارەی شۆفێر</Text>
        <Text style={styles.driverValue}>
          {formatMoney(item.driver_amount)}
        </Text>
      </View>

      {item.driver_name ? (
        <Text style={styles.driverName}>
          🚚 شۆفێر: {item.driver_name}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.detailsButton}
          onPress={() => {
            setSelected(item);
            setDetailsVisible(true);
          }}
        >
          <Text style={styles.detailsButtonText}>
            👁️ وردەکاری
          </Text>
        </Pressable>

        {item.status !== 'paid' && (
          <Pressable
            style={styles.paidButton}
            onPress={() => updateStatus(item, 'paid')}
          >
            <Text style={styles.paidButtonText}>✓ پارەدرا</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteCommission(item)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>کۆمیشن 💰</Text>
          <Text style={styles.headerSubtitle}>
            بەڕێوەبردنی داهاتی DriverLink
          </Text>
        </View>

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatMoney(totalFare)}
          </Text>
          <Text style={styles.statLabel}>کۆی گەشتەکان</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatMoney(totalCommission)}
          </Text>
          <Text style={styles.statLabel}>کۆی کۆمیشن</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatMoney(totalDriverAmount)}
          </Text>
          <Text style={styles.statLabel}>پارەی شۆفێر</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>چاوەڕوان</Text>
        </View>
      </View>

      <View style={styles.miniStats}>
        <Text style={styles.miniText}>
          هەموو: {commissions.length}
        </Text>
        <Text style={styles.miniText}>
          پارەدراو: {paidCount}
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="گەڕان بە Commission یان Trip..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredCommissions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={
          filteredCommissions.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>چاوەڕوان بە...</Text>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyTitle}>
                هیچ Commission ـێک نییە
              </Text>
              <Text style={styles.emptySubtitle}>
                دوگمەی ＋ بەکاربهێنە بۆ زیادکردنی یەکەم Commission.
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              زیادکردنی Commission
            </Text>

            <Text style={styles.fieldLabel}>Trip ID *</Text>
            <TextInput
              value={tripId}
              onChangeText={setTripId}
              placeholder="نموونە: 1"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Driver ID</Text>
            <TextInput
              value={driverId}
              onChangeText={setDriverId}
              placeholder="نموونە: 7"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>نرخی گەشت *</Text>
            <TextInput
              value={fare}
              onChangeText={setFare}
              placeholder="نموونە: 100"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>
              ڕێژەی Commission %
            </Text>
            <TextInput
              value={rate}
              onChangeText={setRate}
              placeholder="10"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>
                پێشبینینی حساب:
              </Text>

              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>کۆمیشن:</Text>
                <Text style={styles.previewValue}>
                  {formatMoney(preview.commission)}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  پارەی شۆفێر:
                </Text>
                <Text style={styles.previewValue}>
                  {formatMoney(preview.driver)}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>
                  پاشگەزبوونەوە
                </Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={saveCommission}
              >
                <Text style={styles.saveText}>زیادکردن</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={detailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsBox}>
            {selected ? (
              <>
                <Text style={styles.modalTitle}>
                  Commission #{selected.id}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    statusStyle(selected.status),
                    styles.detailsStatus,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {statusLabel(selected.status)}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Trip ID</Text>
                  <Text style={styles.detailsValue}>
                    #{selected.trip_id}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Driver ID</Text>
                  <Text style={styles.detailsValue}>
                    {selected.driver_id ?? '-'}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>شۆفێر</Text>
                  <Text style={styles.detailsValue}>
                    {selected.driver_name || 'دیارینەکراوە'}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>
                    نرخی گەشت
                  </Text>
                  <Text style={styles.detailsValue}>
                    {formatMoney(selected.fare)}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>
                    Commission
                  </Text>
                  <Text style={styles.detailsValue}>
                    {formatMoney(selected.commission_amount)}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>
                    پارەی شۆفێر
                  </Text>
                  <Text style={styles.detailsValue}>
                    {formatMoney(selected.driver_amount)}
                  </Text>
                </View>

                <View style={styles.detailsActions}>
                  {selected.status === 'pending' && (
                    <Pressable
                      style={styles.paidButtonLarge}
                      onPress={() =>
                        updateStatus(selected, 'paid')
                      }
                    >
                      <Text style={styles.paidButtonText}>
                        ✓ پارەدرا
                      </Text>
                    </Pressable>
                  )}

                  {selected.status !== 'cancelled' && (
                    <Pressable
                      style={styles.cancelCommissionButton}
                      onPress={() =>
                        updateStatus(selected, 'cancelled')
                      }
                    >
                      <Text style={styles.cancelCommissionText}>
                        هەڵوەشاندنەوە
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.closeDetailsButton}
                    onPress={() => setDetailsVisible(false)}
                  >
                    <Text style={styles.closeDetailsText}>
                      داخستن
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },

  statCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },

  statLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#6b7280',
  },

  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  miniText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
  },

  searchBox: {
    marginHorizontal: 14,
    marginBottom: 10,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  tripText: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusPending: {
    backgroundColor: '#fff4cc',
  },

  statusPaid: {
    backgroundColor: '#dcfce7',
  },

  statusCancelled: {
    backgroundColor: '#fee2e2',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },

  divider: {
    height: 1,
    backgroundColor: '#eef0f2',
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  infoLabel: {
    color: '#6b7280',
    fontSize: 13,
  },

  infoValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },

  highlightRow: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  highlightLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  highlightValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  driverValue: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '900',
  },

  driverName: {
    marginTop: 7,
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 8,
  },

  detailsButton: {
    flex: 1,
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  detailsButtonText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '800',
  },

  paidButton: {
    flex: 1,
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  paidButtonText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
  },

  deleteButton: {
    width: 42,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    fontSize: 17,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  emptySubtitle: {
    marginTop: 7,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
  },

  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 18,
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    maxHeight: '92%',
  },

  detailsBox: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'right',
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'right',
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#111827',
    textAlign: 'right',
    backgroundColor: '#fafafa',
  },

  previewBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 13,
    marginTop: 2,
    marginBottom: 14,
  },

  previewTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'right',
  },

  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  previewLabel: {
    color: '#6b7280',
    fontSize: 13,
  },

  previewValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelText: {
    color: '#374151',
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontWeight: '900',
  },

  detailsStatus: {
    alignSelf: 'flex-end',
    marginBottom: 14,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  detailsLabel: {
    color: '#6b7280',
    fontSize: 13,
  },

  detailsValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    maxWidth: '60%',
    textAlign: 'right',
  },

  detailsActions: {
    marginTop: 18,
    gap: 9,
  },

  paidButtonLarge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelCommissionButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelCommissionText: {
    color: '#b91c1c',
    fontWeight: '900',
  },

  closeDetailsButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  closeDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
