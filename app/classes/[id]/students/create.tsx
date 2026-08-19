import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

export default function CreateStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  async function createStudent() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        'Manglende oplysninger',
        'Fornavn og efternavn er påkrævet.'
      );
      return;
    }

    if (!id) {
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

      const { error } = await supabase
        .from('students')
        .insert({
          class_id: id,

          first_name: firstName.trim(),
          last_name: lastName.trim(),

          birth_date:
            birthDate.trim() || null,

          phone:
            phone.trim() || null,

          created_by: user.id,
        });

      if (error) {
        Alert.alert(
          'Kunne ikke oprette elev',
          error.message
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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>
        Ny elev
      </Text>

      <Text style={styles.title}>
        Tilføj elev
      </Text>

      <Text style={styles.label}>
        Fornavn *
      </Text>

      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Emma"
        style={styles.input}
      />

      <Text style={styles.label}>
        Efternavn *
      </Text>

      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Jensen"
        style={styles.input}
      />

      <Text style={styles.label}>
        Fødselsdato
      </Text>

      <TextInput
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2017-03-14"
        style={styles.input}
      />

      <Text style={styles.help}>
        Foreløbig bruger vi formatet YYYY-MM-DD.
      </Text>

      <Text style={styles.label}>
        Telefonnummer
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+45 12 34 56 78"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Pressable
        onPress={createStudent}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Opretter...'
            : 'Tilføj elev'}
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
    padding: 24,
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
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    fontSize: 16,
  },

  help: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
  },

  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },
});