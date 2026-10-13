import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageScreen() {
  const { setLanguage, t } = useLanguage();

  const choose = (language: 'ku' | 'ar' | 'en' | 'de' | 'fr' | 'es') => {
    setLanguage(language);
    router.replace('/dashboard');
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t.language}</Text>
      <Text style={styles.subtitle}>{t.chooseLanguage}</Text>

      <Pressable style={styles.button} onPress={() => choose('ku')}>
        <Text style={styles.text}>🇹🇯 کوردی</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => choose('ar')}>
        <Text style={styles.text}>🇮🇶 عەرەبی</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => choose('en')}>
        <Text style={styles.text}>🇬🇧 English</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => choose('de')}>
        <Text style={styles.text}>🇩🇪 Deutsch</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => choose('fr')}>
        <Text style={styles.text}>🇫🇷 Français</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => choose('es')}>
        <Text style={styles.text}>🇪🇸 Español</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>{t.back}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#AAB4C5',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#111C2E',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '700',
  },
  back: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
