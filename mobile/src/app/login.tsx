import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:5000';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim() || !password) {
      setMessage('تکایە ئیمەیڵ و وشەی نهێنی بنووسە.');
      return;
    }

    setLoading(true);
    setMessage('چاوەڕوان بە...');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.'
        );
        setLoading(false);
        return;
      }

      if (!data.token) {
        setMessage('Token وەرنەگیرا.');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem(
        'driverlink_token',
        data.token
      );

      await AsyncStorage.setItem(
        'driverlink_user',
        JSON.stringify(data.user || {})
      );

      setMessage('چوونەژوورەوە سەرکەوتوو بوو ✅');

      setTimeout(() => {
        router.replace('/dashboard');
      }, 300);

    } catch (error) {
      console.error('LOGIN ERROR:', error);

      setMessage(
        'پەیوەندی بە سێرڤەرەکە نەکرا ❌'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.logo}>🚚</Text>

      <Text style={styles.title}>
        DriverLink
      </Text>

      <Text style={styles.subtitle}>
        چوونەژوورەوە
      </Text>

      <TextInput
        style={styles.input}
        placeholder="ئیمەیڵ"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="وشەی نهێنی"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={login}
        disabled={loading}
      >

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>
            چوونەژوورەوە
          </Text>
        )}

      </TouchableOpacity>

      {!!message && (
        <Text style={styles.message}>
          {message}
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fa',
  },

  logo: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 30,
  },

  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    textAlign: 'right',
  },

  button: {
    width: '100%',
    maxWidth: 400,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#111827',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});
