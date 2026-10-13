import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚗</Text>
      <Text style={styles.title}>DriverLink</Text>
      <Text style={styles.subtitle}>بەخێربێیت بۆ DriverLink</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>سیستەمی گواستنەوە</Text>
        <Text style={styles.cardText}>شۆفێر • کڕیار • گەشت • GPS</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>چوونەژوورەوە</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
  },
  card: {
    marginTop: 30,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardText: {
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    marginTop: 25,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
