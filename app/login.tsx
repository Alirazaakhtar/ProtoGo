import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        Alert.alert('Login fejlede', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Protokol</Text>

        <Text style={styles.title}>
          Velkommen tilbage
        </Text>

        <Text style={styles.subtitle}>
          Log ind for at tage dagens protokol
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Adgangskode"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          onPress={login}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logger ind...' : 'Log ind'}
          </Text>
        </Pressable>
        
        <Pressable
         onPress={() => router.push('/signup')}
        >
            <Text style={styles.signupText}>
            Ingen konto? Opret dig
            </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 40,
  },

  logo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
    color: '#4F46E5',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },

  form: {
    gap: 14,
  },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  signupText: {
  textAlign: 'center',
  marginTop: 18,
  color: '#4F46E5',
  fontWeight: '600',
},
});