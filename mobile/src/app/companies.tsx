import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

const API_URL = 'http://127.0.0.1:5000';

type Company = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  company_type?: string;
  registration_number?: string;
  status?: string;
};

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  async function getToken() {
    return await AsyncStorage.getItem('driverlink_token');
  }

  async function loadCompanies(showLoading = true) {
    try {
      if (showLoading) setLoading(true);

      const token = await getToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem('driverlink_token');
        router.replace('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load companies');
      }

      setCompanies(Array.isArray(data) ? data : data.companies || []);
    } catch (error) {
      Alert.alert(
        'کێشە',
        'نەتوانرا کۆمپانیاکان باربکرێن.'
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadCompanies();
    }, [])
  );

  async function refreshCompanies() {
    setRefreshing(true);
    try {
      await loadCompanies(false);
    } finally {
      setRefreshing(false);
    }
  }

  function clearForm() {
    setName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setCompanyType('');
    setRegistrationNumber('');
    setEditingId(null);
  }

  function editCompany(company: Company) {
    setEditingId(company.id);
    setName(company.name || '');
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setLocation(company.location || '');
    setCompanyType(company.company_type || '');
    setRegistrationNumber(company.registration_number || '');
  }

  async function saveCompany() {
    if (!name.trim()) {
      Alert.alert(
        'زانیاری پێویستە',
        'تکایە ناوی کۆمپانیا بنووسە.'
      );
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const body = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        company_type: companyType.trim(),
        registration_number: registrationNumber.trim(),
      };

      const url = editingId
        ? `${API_URL}/api/companies/${editingId}`
        : `${API_URL}/api/companies`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not save company'
        );
      }

      Alert.alert(
        'سەرکەوتوو بوو ✅',
        editingId
          ? 'کۆمپانیاکە نوێ کرایەوە.'
          : 'کۆمپانیاکە بە سەرکەوتوویی زیادکرا.'
      );

      clearForm();
      await loadCompanies();
    } catch (error: any) {
      Alert.alert(
        'کێشە ❌',
        error.message || 'نەتوانرا کۆمپانیا پاشەکەوت بکرێت.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany(id: number) {
    Alert.alert(
      'سڕینەوەی کۆمپانیا',
      'دڵنیایت دەتەوێت ئەم کۆمپانیایە بسڕیتەوە؟',
      [
        {
          text: 'نەخێر',
          style: 'cancel',
        },
        {
          text: 'بەڵێ، بیسڕەوە',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();

              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await fetch(
                `${API_URL}/api/companies/${id}`,
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
                  data.error || 'Could not delete company'
                );
              }

              await loadCompanies();
            } catch (error: any) {
              Alert.alert(
                'کێشە ❌',
                error.message ||
                  'نەتوانرا کۆمپانیا بسڕدرێتەوە.'
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>🚚</Text>
        </View>

        <ActivityIndicator
          size="large"
          color="#1264F4"
        />

        <Text style={styles.loadingTitle}>
          DriverLink
        </Text>

        <Text style={styles.loadingText}>
          کۆمپانیاکان بار دەکرێن...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCompanies}
            tintColor="#1264F4"
            colors={["#1264F4"]}
          />
        }
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>
              DRIVERLINK
            </Text>

            <Text style={styles.title}>
              کۆمپانیاکان
            </Text>

            <Text style={styles.subtitle}>
              بەڕێوەبردنی کۆمپانیاکانی گواستنەوە
            </Text>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalNumber}>
              {companies.length}
            </Text>

            <Text style={styles.totalLabel}>
              کۆی گشتی
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>🏢</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              کۆمپانیاکانت بەڕێوەبەرە
            </Text>

            <Text style={styles.heroText}>
              کۆمپانیا نوێکان زیاد بکە و زانیارییەکانیان
              بە ئاسانی بەڕێوە ببە.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.formIcon}>
              <Text style={styles.formIconText}>
                {editingId ? '✏️' : '＋'}
              </Text>
            </View>

            <View style={styles.formHeaderText}>
              <Text style={styles.sectionTitle}>
                {editingId
                  ? 'دەستکاریکردنی کۆمپانیا'
                  : 'زیادکردنی کۆمپانیای نوێ'}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {editingId
                  ? 'زانیارییەکان نوێ بکەرەوە'
                  : 'زانیارییە سەرەکییەکان پڕبکەرەوە'}
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>
            ناوی کۆمپانیا *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="نموونە: DriverLink Logistics"
            placeholderTextColor="#9AA4B2"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>
            ئیمەیڵ
          </Text>

          <TextInput
            style={styles.input}
            placeholder="company@example.com"
            placeholderTextColor="#9AA4B2"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>
            ژمارەی تەلەفۆن
          </Text>

          <TextInput
            style={styles.input}
            placeholder="+964 750 000 0000"
            placeholderTextColor="#9AA4B2"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>
            شوێن
          </Text>

          <TextInput
            style={styles.input}
            placeholder="نموونە: Akre, Kurdistan"
            placeholderTextColor="#9AA4B2"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.inputLabel}>
            جۆری کۆمپانیا
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Transport Company"
            placeholderTextColor="#9AA4B2"
            value={companyType}
            onChangeText={setCompanyType}
          />

          <Text style={styles.inputLabel}>
            ژمارەی تۆمارکردن
          </Text>

          <TextInput
            style={styles.input}
            placeholder="DL-2026-001"
            placeholderTextColor="#9AA4B2"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={saveCompany}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonIcon}>
                    {editingId ? '✓' : '+'}
                  </Text>

                  <Text style={styles.primaryButtonText}>
                    {editingId
                      ? 'نوێکردنەوە'
                      : 'زیادکردنی کۆمپانیا'}
                  </Text>
                </>
              )}
            </Pressable>

            {editingId && (
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={clearForm}
              >
                <Text style={styles.cancelButtonText}>
                  هەڵوەشاندنەوە
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>
              لیستی کۆمپانیاکان
            </Text>

            <Text style={styles.listSubtitle}>
              هەموو کۆمپانیا بەڕێوەبەرەکانت
            </Text>
          </View>

          <View style={styles.listBadge}>
            <Text style={styles.listBadgeText}>
              {companies.length}
            </Text>
          </View>
        </View>

        {companies.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>
                🏢
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              هێشتا کۆمپانیات نییە
            </Text>

            <Text style={styles.emptyText}>
              یەکەم کۆمپانیاکەت لەسەرەوە زیاد بکە
              بۆ ئەوەی لە DriverLink ـدا دەست بە
              بەڕێوەبردنی بکەیت.
            </Text>
          </View>
        ) : (
          companies.map((company) => (
            <View
              key={company.id}
              style={styles.companyCard}
            >
              <View style={styles.companyTop}>
                <View style={styles.companyIcon}>
                  <Text style={styles.companyIconText}>
                    🏢
                  </Text>
                </View>

                <View style={styles.companyMain}>
                  <Text
                    style={styles.companyName}
                    numberOfLines={1}
                  >
                    {company.name}
                  </Text>

                  <Text
                    style={styles.companyType}
                    numberOfLines={1}
                  >
                    {company.company_type ||
                      'Transport Company'}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    {company.status === 'inactive'
                      ? 'ناچالاک'
                      : 'چالاک'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.details}>
                {!!company.email && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      ✉️
                    </Text>

                    <Text
                      style={styles.detailText}
                      numberOfLines={1}
                    >
                      {company.email}
                    </Text>
                  </View>
                )}

                {!!company.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      📞
                    </Text>

                    <Text style={styles.detailText}>
                      {company.phone}
                    </Text>
                  </View>
                )}

                {!!company.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      📍
                    </Text>

                    <Text style={styles.detailText}>
                      {company.location}
                    </Text>
                  </View>
                )}

                {!!company.registration_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      🆔
                    </Text>

                    <Text style={styles.detailText}>
                      {company.registration_number}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => editCompany(company)}
                >
                  <Text style={styles.editIcon}>
                    ✏️
                  </Text>

                  <Text style={styles.editText}>
                    دەستکاری
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() =>
                    deleteCompany(company.id)
                  }
                >
                  <Text style={styles.deleteIcon}>
                    🗑️
                  </Text>

                  <Text style={styles.deleteText}>
                    سڕینەوە
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            DRIVERLINK
          </Text>

          <Text style={styles.footerText}>
            Connect Drivers & Companies
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  content: {
    padding: 18,
    paddingTop: 22,
    paddingBottom: 45,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },

  loadingLogo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#1264F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  loadingLogoText: {
    fontSize: 34,
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#172033',
    marginTop: 12,
  },

  loadingText: {
    fontSize: 13,
    color: '#7B8798',
    marginTop: 5,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#1264F4',
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#172033',
    marginTop: 3,
  },

  subtitle: {
    fontSize: 13,
    color: '#7B8798',
    marginTop: 4,
  },

  totalCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#172033',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  totalNumber: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1264F4',
  },

  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A94A6',
    marginTop: 1,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1264F4',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#1264F4',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroIconText: {
    fontSize: 28,
  },

  heroContent: {
    flex: 1,
    marginLeft: 14,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  heroText: {
    color: '#DCE9FF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 18,
    marginBottom: 25,
    shadowColor: '#172033',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  formIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formIconText: {
    color: '#1264F4',
    fontSize: 24,
    fontWeight: '900',
  },

  formHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#172033',
  },

  sectionSubtitle: {
    fontSize: 11,
    color: '#8A94A6',
    marginTop: 3,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5567',
    marginBottom: 6,
    marginTop: 2,
  },

  input: {
    minHeight: 48,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#172033',
    marginBottom: 11,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 4,
  },

  primaryButton: {
    flex: 1,
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: '#1264F4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#1264F4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  primaryButtonIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 7,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  cancelButton: {
    minHeight: 51,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#596579',
    fontSize: 13,
    fontWeight: '800',
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  listTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#172033',
  },

  listSubtitle: {
    fontSize: 11,
    color: '#8A94A6',
    marginTop: 3,
  },

  listBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listBadgeText: {
    color: '#1264F4',
    fontSize: 15,
    fontWeight: '900',
  },

  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    marginBottom: 13,
    shadowColor: '#172033',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  companyTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  companyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  companyIconText: {
    fontSize: 25,
  },

  companyMain: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  companyName: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '900',
  },

  companyType: {
    color: '#7B8798',
    fontSize: 11,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E9F8EF',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20A464',
    marginRight: 5,
  },

  statusText: {
    color: '#17804C',
    fontSize: 10,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginVertical: 14,
  },

  details: {
    gap: 8,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    width: 27,
    fontSize: 14,
  },

  detailText: {
    flex: 1,
    color: '#5D6879',
    fontSize: 12,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },

  editButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 12,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  editIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  editText: {
    color: '#1264F4',
    fontSize: 12,
    fontWeight: '900',
  },

  deleteButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  deleteIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  deleteText: {
    color: '#D64545',
    fontSize: 12,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#172033',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyIcon: {
    fontSize: 34,
  },

  emptyTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: '#7B8798',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  footer: {
    alignItems: 'center',
    marginTop: 23,
  },

  footerBrand: {
    color: '#1264F4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerText: {
    color: '#A0A8B6',
    fontSize: 10,
    marginTop: 4,
  },
});
