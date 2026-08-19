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

export default function CreateClassScreen() {
  const [name, setName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [loading, setLoading] = useState(false);

  async function createClass() {
    if (!name.trim()) {
      Alert.alert('Skriv et klassenavn');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Du er ikke logget ind');
        return;
      }

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: name.trim(),
          school_year: schoolYear.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Kunne ikke oprette klasse', error.message);
        return;
      }

      router.replace(`/classes/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Ny klasse</Text>
      <Text style={styles.title}>Opret klasse</Text>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Fx 2.B"
          style={styles.input}
          autoFocus
        />

        <TextInput
          value={schoolYear}
          onChangeText={setSchoolYear}
          placeholder="Skoleår, fx 2026/2027"
          style={styles.input}
        />

        <Pressable
          onPress={createClass}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Opretter...' : 'Opret klasse'}
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
    padding: 24,
    paddingTop: 80,
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 32,
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
    backgroundColor: '#111827',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },
});