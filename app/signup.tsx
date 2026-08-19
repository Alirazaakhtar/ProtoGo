import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signup() {
    if (!name || !email || !password) {
      Alert.alert('Udfyld alle felter');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        Alert.alert(
          'Kunne ikke oprette bruger',
          error.message
        );

        return;
      }

      Alert.alert(
        'Konto oprettet',
        'Tjek din e-mail, hvis e-mailbekræftelse er aktiveret.'
      );

      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Opret lærerprofil
      </Text>

      <Text style={styles.subtitle}>
        Kom i gang med Protokol
      </Text>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Dit navn"
          style={styles.input}
        />

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
          onPress={signup}
          disabled={loading}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Opretter...'
              : 'Opret konto'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.login}>
            Har du allerede en konto? Log ind
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F6F8',
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
    marginBottom: 36,
  },

  form: {
    gap: 14,
  },

  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    fontSize: 16,
  },

  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  login: {
    textAlign: 'center',
    marginTop: 10,
    color: '#4F46E5',
    fontWeight: '600',
  },
});