import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

export default function CreateGuardianScreen() {
  const { studentId } =
    useLocalSearchParams<{
      id: string;
      studentId: string;
    }>();

  const [name, setName] =
    useState('');

  const [relationship, setRelationship] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function saveGuardian() {
    if (!studentId) return;

    if (!name.trim()) {
      Alert.alert(
        'Navn mangler',
        'Skriv forælderens navn.'
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Fejl',
          'Du er ikke logget ind.'
        );

        return;
      }

      const {
        data: guardian,
        error: guardianError,
      } = await supabase
        .from('guardians')
        .insert({
          full_name: name.trim(),
          phone:
            phone.trim() || null,
          email:
            email.trim().toLowerCase() ||
            null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (guardianError) {
        Alert.alert(
          'Kunne ikke oprette forælder',
          guardianError.message
        );

        return;
      }

      const { error: linkError } =
        await supabase
          .from('student_guardians')
          .insert({
            student_id: studentId,
            guardian_id: guardian.id,
            relationship:
              relationship.trim() ||
              null,
          });

      if (linkError) {
        Alert.alert(
          'Kunne ikke tilknytte forælder',
          linkError.message
        );

        return;
      }

      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        Kontaktperson
      </Text>

      <Text style={styles.title}>
        Tilføj forælder
      </Text>

      <Text style={styles.label}>
        Navn
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Fx Anne Jensen"
        style={styles.input}
      />

      <Text style={styles.label}>
        Relation
      </Text>

      <TextInput
        value={relationship}
        onChangeText={setRelationship}
        placeholder="Fx Mor, Far eller Værge"
        style={styles.input}
      />

      <Text style={styles.label}>
        Telefon
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+45 12 34 56 78"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.label}>
        E-mail
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="anne@example.dk"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <Pressable
        onPress={saveGuardian}
        disabled={loading}
        style={[
          styles.button,
          loading && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Gemmer...'
            : 'Gem forælder'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 50,
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
    marginBottom: 28,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 18,
  },

  button: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  disabled: {
    opacity: 0.5,
  },
});