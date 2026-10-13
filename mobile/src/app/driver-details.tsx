import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const API_URL = 'http://10.233.21.132:5000';

export default function DriverDetailsScreen() {
  const params = useLocalSearchParams();

  const [name, setName] = useState(String(params.name || ''));
  const [email, setEmail] = useState(String(params.email || ''));
  const [phone, setPhone] = useState(String(params.phone || ''));
  const [location, setLocation] = useState(String(params.location || ''));
  const [vehicleType, setVehicleType] = useState(String(params.vehicle_type || ''));
  const [vehicleNumber, setVehicleNumber] = useState(String(params.vehicle_number || ''));
  const [editing, setEditing] = useState(false);

  async function saveDriver() {
    try {
      const response = await fetch(`${API_URL}/api/drivers/${String(params.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error('Update failed');
      }

      setEditing(false);
      Alert.alert('سەرکەوتوو', 'زانیاری شۆفێر نوێکرایەوە');
    } catch (error) {
      Alert.alert('هەڵە', 'نوێکردنەوەی زانیاری سەرکەوتوو نەبوو');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>زانیاری شۆفێر</Text>

      <View style={styles.card}>
        <Text style={styles.label}>ناو</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        ) : (
          <Text style={styles.value}>{name || '-'}</Text>
        )}

        <Text style={styles.label}>ئیمەیڵ</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        ) : (
          <Text style={styles.value}>{email || '-'}</Text>
        )}

        <Text style={styles.label}>تەلەفۆن</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />
        ) : (
          <Text style={styles.value}>{phone || '-'}</Text>
        )}

        <Text style={styles.label}>شوێن</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
        ) : (
          <Text style={styles.value}>{location || '-'}</Text>
        )}

        <Text style={styles.label}>جۆری ئۆتۆمبێل</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={vehicleType}
            onChangeText={setVehicleType}
          />
        ) : (
          <Text style={styles.value}>{vehicleType || '-'}</Text>
        )}

        <Text style={styles.label}>ژمارەی ئۆتۆمبێل</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
        ) : (
          <Text style={styles.value}>{vehicleNumber || '-'}</Text>
        )}

        <Text style={styles.label}>دۆخ</Text>
        <Text style={styles.value}>
          {params.status === 'online' ? '🟢 ئۆنلاین' : '⚪ ئۆفلاین'}
        </Text>
      </View>

      {editing ? (
        <TouchableOpacity style={styles.saveButton} onPress={saveDriver}>
          <Text style={styles.buttonText}>💾 پاشەکەوتکردن</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.buttonText}>✏️ دەستکاری</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>گەڕانەوە</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  value: {
    fontSize: 19,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 17,
    marginTop: 5,
  },
  editButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
