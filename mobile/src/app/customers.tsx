import { useEffect, useState } from 'react';
import {
Alert,
FlatList,
KeyboardAvoidingView,
Modal,
Platform,
Pressable,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Customer = {
id: number;
name: string;
email?: string;
phone?: string;
location?: string;
status?: string;
};

const API_URL = 'http://127.0.0.1:5000';

export default function CustomersScreen() {
const [customers, setCustomers] = useState<Customer[]>([]);
const [search, setSearch] = useState('');
const [loading, setLoading] = useState(true);
const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);

const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
const [location, setLocation] = useState('');

useEffect(() => {
loadCustomers();
}, []);

const loadCustomers = async () => {
try {
setLoading(true);

  const token = await AsyncStorage.getItem('driverlink_token');

  const response = await fetch(`${API_URL}/api/customers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load customers');
  }

  const data = await response.json();
  setCustomers(Array.isArray(data) ? data : data.customers || []);
} catch (error) {
  console.log('Customers error:', error);
  Alert.alert(
    'کێشە',
    'نەتوانرا زانیاری کڕیارەکان بهێنرێت'
  );
} finally {
  setLoading(false);
}

};

const addCustomer = async () => {
if (!name.trim()) {
Alert.alert('ئاگاداری', 'ناوی کڕیار بنووسە');
return;
}

try {
  const token = await AsyncStorage.getItem('driverlink_token');

  const response = await fetch(`${API_URL}/api/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add customer');
  }

  setName('');
  setEmail('');
  setPhone('');
  setLocation('');
  setModalVisible(false);

  await loadCustomers();

  Alert.alert('سەرکەوتوو', 'کڕیار بە سەرکەوتوویی زیادکرا ✅');
} catch (error) {
  console.log('Add customer error:', error);
  Alert.alert('کێشە', 'کڕیار زیاد نەکرا ❌');
}

};

const editCustomer = (customer: Customer) => {
  setSelectedCustomer(customer.id);
  setName(customer.name || '');
  setEmail(customer.email || '');
  setPhone(customer.phone || '');
  setLocation(customer.location || '');
  setEditing(true);
  setModalVisible(true);
};

const updateCustomer = async () => {
  if (!selectedCustomer) return;

  if (!name.trim()) {
    Alert.alert('ئاگاداری', 'ناوی کڕیار بنووسە');
    return;
  }

  try {
    const token = await AsyncStorage.getItem('driverlink_token');

    const response = await fetch(
      `${API_URL}/api/customers/${selectedCustomer}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update customer');
    }

    setName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setSelectedCustomer(null);
    setEditing(false);
    setModalVisible(false);

    await loadCustomers();

    Alert.alert('سەرکەوتوو', 'زانیاری کڕیار نوێکرایەوە ✅');
  } catch (error) {
    console.log('Update customer error:', error);
    Alert.alert('کێشە', 'زانیاری کڕیار نوێ نەکرایەوە ❌');
  }
};

const deleteCustomer = (id: number) => {
Alert.alert(
'سڕینەوەی کڕیار',
'دڵنیایت دەتەوێت ئەم کڕیارە بسڕیتەوە؟',
[
{ text: 'نەخێر', style: 'cancel' },
{
text: 'بەڵێ، بیسڕەوە',
style: 'destructive',
onPress: async () => {
try {
const token = await AsyncStorage.getItem('driverlink_token');

          const response = await fetch(
            `${API_URL}/api/customers/${id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Delete failed');
          }

          await loadCustomers();

          Alert.alert('سەرکەوتوو', 'کڕیار سڕایەوە ✅');
        } catch (error) {
          console.log('Delete customer error:', error);
          Alert.alert('کێشە', 'کڕیار نەسڕایەوە ❌');
        }
      },
    },
  ]
);

};

const filteredCustomers = customers.filter((customer) => {
const text = search.toLowerCase();

return (
  customer.name?.toLowerCase().includes(text) ||
  customer.email?.toLowerCase().includes(text) ||
  customer.phone?.toLowerCase().includes(text) ||
  customer.location?.toLowerCase().includes(text)
);

});

const renderCustomer = ({ item }: { item: Customer }) => (
<View style={styles.card}>
<View style={styles.cardTop}>
<View style={styles.avatar}>
<Text style={styles.avatarText}>
{item.name?.charAt(0)?.toUpperCase() || '?'}
</Text>
</View>

    <View style={styles.customerInfo}>
      <Text style={styles.customerName}>{item.name}</Text>

      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {item.status || 'active'}
        </Text>
      </View>
    </View>
  </View>

  {item.phone ? (
    <Text style={styles.detail}>📞 {item.phone}</Text>
  ) : null}

  {item.email ? (
    <Text style={styles.detail}>✉️ {item.email}</Text>
  ) : null}

  {item.location ? (
    <Text style={styles.detail}>📍 {item.location}</Text>
  ) : null}

  <View style={styles.actionRow}>
    <Pressable
      style={styles.editButton}
      onPress={() => editCustomer(item)}
    >
      <Text style={styles.editText}>✏️ دەستکاری</Text>
    </Pressable>

    <Pressable
      style={styles.deleteButton}
      onPress={() => deleteCustomer(item.id)}
    >
      <Text style={styles.deleteText}>🗑️ سڕینەوە</Text>
    </Pressable>
  </View>
</View>

);

return (
<View style={styles.container}>
<View style={styles.header}>
<View>
<Text style={styles.headerTitle}>کڕیارەکان</Text>
<Text style={styles.headerSubtitle}>
بەڕێوەبردنی کڕیارەکانی DriverLink
</Text>
</View>

    <Pressable
      style={styles.addButton}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.addButtonText}>＋</Text>
    </Pressable>
  </View>

  <View style={styles.statsCard}>
    <View>
      <Text style={styles.statsLabel}>کۆی کڕیارەکان</Text>
      <Text style={styles.statsNumber}>{customers.length}</Text>
    </View>

    <Text style={styles.statsIcon}>👥</Text>
  </View>

  <TextInput
    value={search}
    onChangeText={setSearch}
    placeholder="🔎 گەڕان بە ناو، ژمارە یان شوێن..."
    placeholderTextColor="#999"
    style={styles.searchInput}
  />

  {loading ? (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>⏳</Text>
      <Text style={styles.emptyTitle}>چاوەڕێ بکە...</Text>
    </View>
  ) : filteredCustomers.length === 0 ? (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>هیچ کڕیارێک نییە</Text>
      <Text style={styles.emptyText}>
        لە دوگمەی ＋ بەکاربهێنە بۆ زیادکردنی کڕیار
      </Text>
    </View>
  ) : (
    <FlatList
      data={filteredCustomers}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderCustomer}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={loadCustomers}
    />
  )}

  <Modal
    visible={modalVisible}
    animationType="slide"
    transparent
    onRequestClose={() => setModalVisible(false)}
  >
    <KeyboardAvoidingView
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
  {editing ? 'دەستکاریکردنی کڕیار' : 'زیادکردنی کڕیار'}
</Text>

          <Pressable onPress={() => setModalVisible(false)}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="ناوی کڕیار *"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="ئیمەیڵ"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="ژمارەی تەلەفۆن"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          placeholder="شوێن"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
        />

        <Pressable
          style={styles.saveButton}
          onPress={addCustomer}
        >
          <Text style={styles.saveText}>
            زیادکردنی کڕیار
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelText}>پاشگەزبوونەوە</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
paddingHorizontal: 20,
paddingTop: 55,
paddingBottom: 18,
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
backgroundColor: '#fff',
},

headerTitle: {
fontSize: 28,
fontWeight: '800',
color: '#111827',
},

headerSubtitle: {
marginTop: 5,
fontSize: 14,
color: '#6b7280',
},

addButton: {
width: 50,
height: 50,
borderRadius: 16,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#111827',
},

addButtonText: {
color: '#fff',
fontSize: 30,
lineHeight: 32,
},

statsCard: {
margin: 16,
padding: 20,
borderRadius: 20,
backgroundColor: '#fff',
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},

statsLabel: {
color: '#6b7280',
fontSize: 14,
},

statsNumber: {
marginTop: 5,
fontSize: 30,
fontWeight: '800',
color: '#111827',
},

statsIcon: {
fontSize: 38,
},

searchInput: {
marginHorizontal: 16,
marginBottom: 8,
paddingHorizontal: 16,
height: 52,
borderRadius: 15,
backgroundColor: '#fff',
fontSize: 15,
color: '#111827',
},

list: {
padding: 16,
paddingTop: 8,
paddingBottom: 30,
},

card: {
backgroundColor: '#fff',
borderRadius: 20,
padding: 18,
marginBottom: 14,
},

cardTop: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 14,
},

avatar: {
width: 52,
height: 52,
borderRadius: 17,
backgroundColor: '#111827',
alignItems: 'center',
justifyContent: 'center',
},

avatarText: {
color: '#fff',
fontSize: 22,
fontWeight: '800',
},

customerInfo: {
marginLeft: 13,
flex: 1,
},

customerName: {
fontSize: 18,
fontWeight: '800',
color: '#111827',
},

statusRow: {
flexDirection: 'row',
alignItems: 'center',
marginTop: 5,
},

statusDot: {
width: 8,
height: 8,
borderRadius: 4,
backgroundColor: '#22c55e',
marginRight: 6,
},

statusText: {
fontSize: 13,
color: '#22c55e',
fontWeight: '600',
},

detail: {
marginTop: 7,
color: '#4b5563',
fontSize: 14,
},

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  editButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },

  editText: {
    fontWeight: '700',
    color: '#111827',
  },

deleteButton: {
marginTop: 15,
paddingVertical: 11,
borderRadius: 12,
backgroundColor: '#f3f4f6',
alignItems: 'center',
},

deleteText: {
color: '#374151',
fontWeight: '700',
},

empty: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
paddingHorizontal: 30,
},

emptyIcon: {
fontSize: 55,
marginBottom: 12,
},

emptyTitle: {
fontSize: 20,
fontWeight: '800',
color: '#111827',
},

emptyText: {
marginTop: 8,
textAlign: 'center',
color: '#6b7280',
fontSize: 14,
},

modalContainer: {
flex: 1,
justifyContent: 'flex-end',
backgroundColor: 'rgba(0,0,0,0.45)',
},

modal: {
backgroundColor: '#fff',
borderTopLeftRadius: 28,
borderTopRightRadius: 28,
padding: 22,
paddingBottom: 35,
},

modalHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 20,
},

modalTitle: {
fontSize: 23,
fontWeight: '800',
color: '#111827',
},

close: {
fontSize: 22,
color: '#6b7280',
},

input: {
height: 52,
borderWidth: 1,
borderColor: '#e5e7eb',
borderRadius: 14,
paddingHorizontal: 15,
marginBottom: 12,
fontSize: 15,
backgroundColor: '#f9fafb',
},

saveButton: {
height: 52,
borderRadius: 14,
backgroundColor: '#111827',
alignItems: 'center',
justifyContent: 'center',
marginTop: 5,
},

saveText: {
color: '#fff',
fontSize: 16,
fontWeight: '800',
},

cancelButton: {
marginTop: 10,
height: 48,
alignItems: 'center',
justifyContent: 'center',
},

cancelText: {
color: '#6b7280',
fontWeight: '700',
},
});
